#!/bin/bash

# 継続的品質監視・自動テスト・予防的検知システム
# Worker3 - 品質保証の継続的実行

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 設定
RAILWAY_URL="${RAILWAY_API_URL:-https://sns-video-generator-production.up.railway.app}"
VERCEL_URL="${VERCEL_URL:-https://sns-video-generator.vercel.app}"
MONITOR_INTERVAL=30  # 30秒間隔
ALERT_THRESHOLD_ERROR_RATE=0.1  # 10%エラー率でアラート
ALERT_THRESHOLD_RESPONSE_TIME=5000  # 5秒でアラート
LOG_DIR="logs"
METRICS_DIR="metrics"
REPORT_DIR="reports"

# ディレクトリ作成
mkdir -p $LOG_DIR $METRICS_DIR $REPORT_DIR

# ログファイル
QUALITY_LOG="$LOG_DIR/quality-monitor-$(date +%Y%m%d).log"
METRICS_FILE="$METRICS_DIR/metrics-$(date +%Y%m%d-%H).json"
HOURLY_REPORT="$REPORT_DIR/hourly-report-$(date +%Y%m%d-%H).md"

# 品質メトリクス構造体
declare -A quality_metrics
quality_metrics[start_time]=$(date +%s)
quality_metrics[total_tests]=0
quality_metrics[successful_tests]=0
quality_metrics[failed_tests]=0
quality_metrics[avg_response_time]=0
quality_metrics[error_rate]=0.0
quality_metrics[last_alert]=""

# ログ関数
log_quality() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$QUALITY_LOG"
}

log_success() {
    log_quality "SUCCESS" "$1"
}

log_error() {
    log_quality "ERROR" "$1"
}

log_warning() {
    log_quality "WARNING" "$1"
}

log_info() {
    log_quality "INFO" "$1"
}

# メトリクス記録関数
record_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp=$(date +%s)
    
    echo "{\"timestamp\": $timestamp, \"metric\": \"$metric_name\", \"value\": \"$metric_value\"}" >> "$METRICS_FILE"
}

# パフォーマンス測定
measure_performance() {
    local endpoint="$1"
    local start_time=$(date +%s%N)
    local status_code
    local success=false
    
    if status_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null); then
        if [[ "$status_code" =~ ^(200|401|403)$ ]]; then
            success=true
        fi
    else
        status_code="TIMEOUT"
    fi
    
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    # メトリクス記録
    record_metric "response_time_$endpoint" "$response_time"
    record_metric "status_code_$endpoint" "$status_code"
    record_metric "success_$endpoint" "$success"
    
    # 戻り値: success:response_time:status_code
    echo "$success:$response_time:$status_code"
}

# 包括的システムテスト
run_comprehensive_test() {
    log_info "包括的システムテスト開始"
    
    local total_tests=0
    local successful_tests=0
    local total_response_time=0
    local test_results=()
    
    # テスト対象エンドポイント
    local endpoints=(
        "$RAILWAY_URL/api/health"
        "$RAILWAY_URL/api/test-db"
        "$RAILWAY_URL/api/test-supabase"
        "$RAILWAY_URL/api/user-usage"
        "$VERCEL_URL"
    )
    
    for endpoint in "${endpoints[@]}"; do
        total_tests=$((total_tests + 1))
        
        local result=$(measure_performance "$endpoint")
        IFS=':' read -r success response_time status_code <<< "$result"
        
        if [ "$success" = "true" ]; then
            successful_tests=$((successful_tests + 1))
            total_response_time=$((total_response_time + response_time))
            log_success "$(basename "$endpoint"): ${response_time}ms (${status_code})"
        else
            log_error "$(basename "$endpoint"): FAILED (${status_code})"
        fi
        
        test_results+=("$endpoint:$success:$response_time:$status_code")
    done
    
    # 総合メトリクス計算
    local success_rate=$(echo "scale=2; $successful_tests * 100 / $total_tests" | bc)
    local avg_response_time=0
    if [ $successful_tests -gt 0 ]; then
        avg_response_time=$((total_response_time / successful_tests))
    fi
    local error_rate=$(echo "scale=2; (100 - $success_rate) / 100" | bc)
    
    # グローバルメトリクス更新
    quality_metrics[total_tests]=$((${quality_metrics[total_tests]} + total_tests))
    quality_metrics[successful_tests]=$((${quality_metrics[successful_tests]} + successful_tests))
    quality_metrics[failed_tests]=$((${quality_metrics[failed_tests]} + total_tests - successful_tests))
    quality_metrics[avg_response_time]=$avg_response_time
    quality_metrics[error_rate]=$error_rate
    
    # メトリクス記録
    record_metric "total_tests" "$total_tests"
    record_metric "successful_tests" "$successful_tests"
    record_metric "success_rate" "$success_rate"
    record_metric "avg_response_time" "$avg_response_time"
    record_metric "error_rate" "$error_rate"
    
    log_info "テスト完了: 成功率${success_rate}%, 平均応答時間${avg_response_time}ms"
    
    # アラートチェック
    check_alerts "$error_rate" "$avg_response_time"
    
    echo "$success_rate:$avg_response_time:$error_rate"
}

# アラートチェック
check_alerts() {
    local error_rate="$1"
    local avg_response_time="$2"
    local current_time=$(date +%s)
    local last_alert_time=${quality_metrics[last_alert]:-0}
    local alert_cooldown=300  # 5分間のクールダウン
    
    if [ $((current_time - last_alert_time)) -lt $alert_cooldown ]; then
        return 0  # クールダウン中
    fi
    
    local alert_triggered=false
    local alert_message=""
    
    # エラー率アラート
    if (( $(echo "$error_rate > $ALERT_THRESHOLD_ERROR_RATE" | bc -l) )); then
        alert_message="🚨 高エラー率検出: ${error_rate}% (閾値: ${ALERT_THRESHOLD_ERROR_RATE}%)"
        alert_triggered=true
    fi
    
    # レスポンス時間アラート
    if [ "$avg_response_time" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
        if [ -n "$alert_message" ]; then
            alert_message="$alert_message\n"
        fi
        alert_message="${alert_message}🚨 高レスポンス時間検出: ${avg_response_time}ms (閾値: ${ALERT_THRESHOLD_RESPONSE_TIME}ms)"
        alert_triggered=true
    fi
    
    if [ "$alert_triggered" = true ]; then
        log_error "$alert_message"
        quality_metrics[last_alert]=$current_time
        
        # Boss1への緊急報告
        send_emergency_alert "$alert_message"
    fi
}

# 緊急アラート送信
send_emergency_alert() {
    local alert_message="$1"
    
    local emergency_report="【Worker3 緊急品質アラート】

## 🚨 品質問題検出
$alert_message

## 📊 現在のメトリクス
- 総テスト数: ${quality_metrics[total_tests]}
- 成功テスト数: ${quality_metrics[successful_tests]}
- 失敗テスト数: ${quality_metrics[failed_tests]}
- 平均応答時間: ${quality_metrics[avg_response_time]}ms
- エラー率: ${quality_metrics[error_rate]}%

## 🔧 推奨対応
- 即座の原因調査が必要
- Worker1/Worker2の作業状況確認
- システムリソース確認

緊急対応をお願いします！"

    echo "$emergency_report" | ./agent-send.sh boss1
    log_warning "緊急アラートをBoss1に送信しました"
}

# セキュリティスキャン
security_scan() {
    log_info "セキュリティスキャン開始"
    
    # HTTPS強制チェック
    local http_check=$(curl -s -o /dev/null -w "%{http_code}" "http://sns-video-generator.vercel.app" --max-time 5 2>/dev/null || echo "FAIL")
    if [[ "$http_check" =~ ^(301|302|403)$ ]]; then
        log_success "HTTPS強制: 正常"
        record_metric "https_enforcement" "OK"
    else
        log_warning "HTTPS強制: 要確認 ($http_check)"
        record_metric "https_enforcement" "WARNING"
    fi
    
    # セキュリティヘッダーチェック
    local headers_check=$(curl -s -I "$VERCEL_URL" | grep -i "content-security-policy\|x-frame-options\|x-content-type-options" | wc -l)
    if [ "$headers_check" -ge 2 ]; then
        log_success "セキュリティヘッダー: 正常"
        record_metric "security_headers" "OK"
    else
        log_warning "セキュリティヘッダー: 不十分"
        record_metric "security_headers" "WARNING"
    fi
    
    # 認証エンドポイント保護チェック
    local protected_endpoints=("/api/upload-video" "/api/video-projects" "/api/user-usage")
    local protected_count=0
    
    for endpoint in "${protected_endpoints[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint" --max-time 5 2>/dev/null || echo "FAIL")
        if [[ "$status" =~ ^(401|403)$ ]]; then
            protected_count=$((protected_count + 1))
        fi
    done
    
    if [ "$protected_count" -eq "${#protected_endpoints[@]}" ]; then
        log_success "認証保護: 正常"
        record_metric "auth_protection" "OK"
    else
        log_warning "認証保護: 一部未保護 ($protected_count/${#protected_endpoints[@]})"
        record_metric "auth_protection" "WARNING"
    fi
}

# 依存関係チェック
dependency_check() {
    log_info "依存関係チェック開始"
    
    # package.jsonの更新チェック（簡易版）
    if [ -f "../package.json" ]; then
        local package_age=$(find "../package.json" -mtime +7 | wc -l)
        if [ "$package_age" -gt 0 ]; then
            log_warning "package.json: 7日以上更新なし"
            record_metric "package_freshness" "OLD"
        else
            log_success "package.json: 最新"
            record_metric "package_freshness" "FRESH"
        fi
    fi
    
    # 重要なサービスの死活確認
    local services=("Railway API" "Vercel Frontend" "Supabase DB")
    local service_urls=("$RAILWAY_URL/api/health" "$VERCEL_URL" "$RAILWAY_URL/api/test-supabase")
    local healthy_services=0
    
    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local url="${service_urls[$i]}"
        
        if curl -s -f "$url" --max-time 10 > /dev/null 2>&1; then
            healthy_services=$((healthy_services + 1))
            log_success "$service: 正常"
        else
            log_warning "$service: 応答なし"
        fi
    done
    
    record_metric "healthy_services" "$healthy_services/${#services[@]}"
}

# 時間別レポート生成
generate_hourly_report() {
    log_info "時間別レポート生成開始"
    
    local current_hour=$(date +%H)
    local report_time=$(date '+%Y-%m-%d %H:00:00')
    
    cat > "$HOURLY_REPORT" << EOF
# Worker3 品質監視 時間別レポート

**レポート時間**: $report_time  
**監視間隔**: ${MONITOR_INTERVAL}秒  
**アラート閾値**: エラー率${ALERT_THRESHOLD_ERROR_RATE}%, 応答時間${ALERT_THRESHOLD_RESPONSE_TIME}ms

## 📊 品質メトリクス サマリー

### システムパフォーマンス
- **総テスト実行数**: ${quality_metrics[total_tests]}
- **成功テスト数**: ${quality_metrics[successful_tests]}
- **失敗テスト数**: ${quality_metrics[failed_tests]}
- **成功率**: $(echo "scale=1; ${quality_metrics[successful_tests]} * 100 / ${quality_metrics[total_tests]}" | bc)%
- **平均応答時間**: ${quality_metrics[avg_response_time]}ms
- **現在のエラー率**: ${quality_metrics[error_rate]}%

### 品質評価
EOF

    # 品質スコア計算
    local success_rate=$(echo "scale=1; ${quality_metrics[successful_tests]} * 100 / ${quality_metrics[total_tests]}" | bc)
    local quality_score="A+"
    
    if (( $(echo "$success_rate < 95" | bc -l) )); then
        quality_score="B+"
    fi
    if (( $(echo "$success_rate < 90" | bc -l) )); then
        quality_score="B"
    fi
    if (( $(echo "$success_rate < 80" | bc -l) )); then
        quality_score="C"
    fi
    
    cat >> "$HOURLY_REPORT" << EOF
- **品質スコア**: $quality_score
- **システム状態**: $([ "${quality_metrics[error_rate]%.*}" -lt 5 ] && echo "🟢 良好" || echo "🟡 注意")

### 最新メトリクス
\`\`\`
$(tail -10 "$METRICS_FILE" 2>/dev/null || echo "メトリクスファイル作成中...")
\`\`\`

### 推奨事項
EOF

    # 推奨事項生成
    if (( $(echo "${quality_metrics[error_rate]} > 5" | bc -l) )); then
        echo "- ⚠️ エラー率が高いため、システム調査が必要" >> "$HOURLY_REPORT"
    fi
    
    if [ "${quality_metrics[avg_response_time]}" -gt 3000 ]; then
        echo "- ⚠️ 応答時間が遅いため、パフォーマンス最適化が必要" >> "$HOURLY_REPORT"
    fi
    
    if (( $(echo "$success_rate > 98" | bc -l) )); then
        echo "- ✅ システムは非常に安定しています" >> "$HOURLY_REPORT"
    fi
    
    cat >> "$HOURLY_REPORT" << EOF

---
**次回レポート**: $(date -d '+1 hour' '+%Y-%m-%d %H:00:00')  
**監視継続中**: Worker3 自動品質保証システム
EOF

    log_success "時間別レポート生成完了: $HOURLY_REPORT"
}

# Worker1/Worker2の作業完了チェック
check_worker_status() {
    local worker1_status="進行中"
    local worker2_status="進行中"
    
    # Worker1状況確認
    if [ -f "./tmp/worker1_progress.log" ]; then
        local worker1_last=$(tail -1 "./tmp/worker1_progress.log" 2>/dev/null || echo "")
        if [[ "$worker1_last" =~ "完了" ]]; then
            worker1_status="完了"
        fi
    fi
    
    # Worker2状況確認
    if [ -f "./tmp/worker2_progress.log" ]; then
        local worker2_last=$(tail -1 "./tmp/worker2_progress.log" 2>/dev/null || echo "")
        if [[ "$worker2_last" =~ "完了" ]]; then
            worker2_status="完了"
        fi
    fi
    
    log_info "Worker状況 - Worker1: $worker1_status, Worker2: $worker2_status"
    
    # 状況変化をチェック
    local status_file="./tmp/worker_status_last.txt"
    local last_status=""
    if [ -f "$status_file" ]; then
        last_status=$(cat "$status_file")
    fi
    
    local current_status="Worker1:$worker1_status,Worker2:$worker2_status"
    if [ "$current_status" != "$last_status" ]; then
        echo "$current_status" > "$status_file"
        log_info "Worker状況変化検出 - 統合テスト再実行をスケジュール"
        
        # 状況変化時は即座に統合テスト実行
        run_comprehensive_test
    fi
}

# メイン監視ループ
continuous_monitoring_loop() {
    log_info "継続的品質監視開始 - 間隔: ${MONITOR_INTERVAL}秒"
    
    local cycle_count=0
    local last_hourly_report=$(date +%H)
    
    while true; do
        cycle_count=$((cycle_count + 1))
        local current_hour=$(date +%H)
        
        log_info "品質監視サイクル #$cycle_count 開始"
        
        # 包括的システムテスト実行
        local test_result=$(run_comprehensive_test)
        IFS=':' read -r success_rate avg_response_time error_rate <<< "$test_result"
        
        # セキュリティスキャン（10分毎）
        if [ $((cycle_count % 20)) -eq 0 ]; then
            security_scan
        fi
        
        # 依存関係チェック（30分毎）
        if [ $((cycle_count % 60)) -eq 0 ]; then
            dependency_check
        fi
        
        # Worker状況チェック
        check_worker_status
        
        # 時間別レポート生成（毎時）
        if [ "$current_hour" != "$last_hourly_report" ]; then
            generate_hourly_report
            last_hourly_report=$current_hour
        fi
        
        # 進捗ログ
        echo "[$(date)] Worker3 - 品質監視サイクル#$cycle_count完了 - 成功率:$success_rate%, 応答時間:${avg_response_time}ms" >> ./tmp/worker3_progress.log
        
        # 待機
        sleep $MONITOR_INTERVAL
    done
}

# 初期化
initialize_monitoring() {
    log_info "Worker3 継続的品質監視システム初期化"
    
    # 初期メトリクス設定
    quality_metrics[start_time]=$(date +%s)
    quality_metrics[total_tests]=0
    quality_metrics[successful_tests]=0
    quality_metrics[failed_tests]=0
    
    # 初期テスト実行
    log_info "初期システムテスト実行"
    run_comprehensive_test
    
    log_success "継続的品質監視システム初期化完了"
}

# 終了処理
cleanup_monitoring() {
    log_info "Worker3 継続的品質監視システム終了処理"
    
    # 最終レポート生成
    generate_hourly_report
    
    # 最終状況報告
    local final_report="【Worker3 継続的品質監視 終了報告】

## 📊 最終メトリクス
- 監視時間: $(($(date +%s) - ${quality_metrics[start_time]}))秒
- 総テスト実行数: ${quality_metrics[total_tests]}
- 成功率: $(echo "scale=1; ${quality_metrics[successful_tests]} * 100 / ${quality_metrics[total_tests]}" | bc)%
- 平均応答時間: ${quality_metrics[avg_response_time]}ms

継続的品質監視を終了します。"

    echo "$final_report" | ./agent-send.sh boss1
    log_success "継続的品質監視システム終了完了"
}

# シグナルハンドリング
trap cleanup_monitoring SIGINT SIGTERM

# メイン実行
main() {
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${PURPLE}  Worker3 継続的品質監視開始        ${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    
    initialize_monitoring
    continuous_monitoring_loop
}

# 引数処理
case "${1:-}" in
    "--status")
        cat "$QUALITY_LOG" 2>/dev/null | tail -20 || echo "ログファイルが見つかりません"
        exit 0
        ;;
    "--metrics")
        cat "$METRICS_FILE" 2>/dev/null | tail -10 || echo "メトリクスファイルが見つかりません"
        exit 0
        ;;
    "--report")
        cat "$HOURLY_REPORT" 2>/dev/null || echo "レポートファイルが見つかりません"
        exit 0
        ;;
    "--help")
        echo "Worker3 継続的品質監視システム"
        echo "使用方法:"
        echo "  $0           # 監視開始"
        echo "  $0 --status  # 最新ログ表示"
        echo "  $0 --metrics # メトリクス表示"
        echo "  $0 --report  # 最新レポート表示"
        exit 0
        ;;
esac

# 実行
main "$@"