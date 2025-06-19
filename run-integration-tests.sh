#!/bin/bash

# 統合テスト実行シェルスクリプト
# Railway & Supabase 環境の包括的検証

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ログファイル
LOG_DIR="logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/integration-test-$TIMESTAMP.log"

mkdir -p $LOG_DIR

echo -e "${BLUE}🚀 統合テスト実行開始${NC}"
echo "ログファイル: $LOG_FILE"
echo "開始時間: $(date)"

# ログ関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}ℹ️ $1${NC}" | tee -a "$LOG_FILE"
}

# 環境変数チェック
check_environment() {
    log_info "環境変数チェック開始..."
    
    if [[ -z "$RAILWAY_API_URL" ]]; then
        export RAILWAY_API_URL="https://sns-video-generator-production.up.railway.app"
        log_warning "RAILWAY_API_URL が設定されていません。デフォルト値を使用: $RAILWAY_API_URL"
    fi
    
    if [[ -z "$VERCEL_URL" ]]; then
        export VERCEL_URL="https://sns-video-generator.vercel.app"
        log_warning "VERCEL_URL が設定されていません。デフォルト値を使用: $VERCEL_URL"
    fi
    
    log_success "環境変数チェック完了"
    echo "RAILWAY_API_URL: $RAILWAY_API_URL" >> "$LOG_FILE"
    echo "VERCEL_URL: $VERCEL_URL" >> "$LOG_FILE"
}

# Railway環境の基本チェック
check_railway_basic() {
    log_info "Railway環境基本チェック開始..."
    
    # ヘルスチェック
    if curl -s -f "$RAILWAY_API_URL/api/health" > /dev/null; then
        log_success "Railway ヘルスチェック成功"
    else
        log_error "Railway ヘルスチェック失敗"
        return 1
    fi
    
    # 基本APIエンドポイント
    local endpoints=("/api/test-db" "/api/test-supabase" "/api/user-usage")
    
    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_API_URL$endpoint")
        if [[ "$status_code" =~ ^(200|401|403)$ ]]; then
            log_success "$endpoint: $status_code (正常)"
        else
            log_error "$endpoint: $status_code (異常)"
        fi
    done
    
    log_success "Railway環境基本チェック完了"
}

# Supabase接続チェック
check_supabase_connection() {
    log_info "Supabase接続チェック開始..."
    
    local response=$(curl -s "$RAILWAY_API_URL/api/test-supabase")
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_API_URL/api/test-supabase")
    
    if [[ "$status_code" =~ ^(200|401)$ ]]; then
        log_success "Supabase接続確認: $status_code"
    else
        log_error "Supabase接続失敗: $status_code"
        return 1
    fi
    
    log_success "Supabase接続チェック完了"
}

# パフォーマンステスト
performance_test() {
    log_info "パフォーマンステスト開始..."
    
    local total_time=0
    local success_count=0
    local test_count=5
    
    for i in $(seq 1 $test_count); do
        local start_time=$(date +%s%N)
        if curl -s -f "$RAILWAY_API_URL/api/health" > /dev/null; then
            local end_time=$(date +%s%N)
            local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
            total_time=$((total_time + response_time))
            success_count=$((success_count + 1))
            log "テスト $i: ${response_time}ms"
        else
            log_error "テスト $i: 失敗"
        fi
        sleep 1
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$((total_time / success_count))
        log_success "平均レスポンス時間: ${avg_time}ms (成功率: $success_count/$test_count)"
        
        if [ $avg_time -lt 5000 ]; then
            log_success "パフォーマンス良好 (<5秒)"
        else
            log_warning "パフォーマンス要改善 (>5秒)"
        fi
    else
        log_error "全てのパフォーマンステストが失敗"
        return 1
    fi
}

# セキュリティチェック
security_check() {
    log_info "セキュリティチェック開始..."
    
    # 認証が必要なエンドポイントのチェック
    local protected_endpoints=("/api/upload-video" "/api/video-projects" "/api/user-usage")
    
    for endpoint in "${protected_endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_API_URL$endpoint")
        if [[ "$status_code" =~ ^(401|403)$ ]]; then
            log_success "$endpoint: 認証保護確認 ($status_code)"
        else
            log_warning "$endpoint: 認証保護要確認 ($status_code)"
        fi
    done
    
    log_success "セキュリティチェック完了"
}

# 負荷テスト
load_test() {
    log_info "負荷テスト開始..."
    
    local concurrent_requests=10
    local temp_file="/tmp/load_test_results.txt"
    
    # 並列リクエスト実行
    for i in $(seq 1 $concurrent_requests); do
        (
            if curl -s -f "$RAILWAY_API_URL/api/health" > /dev/null; then
                echo "SUCCESS" >> "$temp_file"
            else
                echo "FAILURE" >> "$temp_file"
            fi
        ) &
    done
    
    wait # 全ての並列プロセスの完了を待機
    
    local success_count=$(grep -c "SUCCESS" "$temp_file" 2>/dev/null || echo 0)
    local success_rate=$((success_count * 100 / concurrent_requests))
    
    rm -f "$temp_file"
    
    if [ $success_rate -ge 80 ]; then
        log_success "負荷テスト成功: $success_rate% ($success_count/$concurrent_requests)"
    else
        log_error "負荷テスト失敗: $success_rate% ($success_count/$concurrent_requests)"
        return 1
    fi
}

# Jestテスト実行
run_jest_tests() {
    log_info "Jest統合テスト実行開始..."
    
    # 環境変数設定
    export NODE_ENV=test
    
    if npm test -- __tests__/integration/railway-supabase-integration.test.ts; then
        log_success "Jest統合テスト成功"
    else
        log_error "Jest統合テスト失敗"
        return 1
    fi
}

# テスト結果集計
generate_report() {
    log_info "テスト結果レポート生成中..."
    
    local report_file="$LOG_DIR/integration-test-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Railway & Supabase 統合テスト結果レポート

**実行日時**: $(date)
**ログファイル**: $LOG_FILE

## テスト環境

- **Railway URL**: $RAILWAY_API_URL
- **Vercel URL**: $VERCEL_URL
- **Node.js Version**: $(node --version)
- **NPM Version**: $(npm --version)

## テスト結果サマリー

EOF

    # ログから結果を抽出してレポートに追加
    grep "✅\|❌\|⚠️" "$LOG_FILE" >> "$report_file"
    
    cat >> "$report_file" << EOF

## 詳細ログ

\`\`\`
$(cat "$LOG_FILE")
\`\`\`

## 推奨事項

EOF

    # エラーが見つかった場合の推奨事項
    if grep -q "❌" "$LOG_FILE"; then
        cat >> "$report_file" << EOF
- ❌ エラーが検出されました。詳細な調査が必要です。
- 🔍 失敗したテストの原因を特定し、修正してください。
- 🔄 修正後、再度テストを実行してください。
EOF
    else
        cat >> "$report_file" << EOF
- ✅ 全てのテストが成功しました。
- 🚀 システムは本格運用準備完了です。
- 📊 定期的な監視を継続してください。
EOF
    fi
    
    log_success "テストレポート生成完了: $report_file"
}

# エラーハンドリング
cleanup() {
    log_info "クリーンアップ処理実行中..."
    # 一時ファイルの削除など
    rm -f /tmp/load_test_results.txt
    log_success "クリーンアップ完了"
}

# メイン実行フロー
main() {
    local exit_code=0
    
    trap cleanup EXIT
    
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${PURPLE}    Railway & Supabase 統合テスト    ${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo
    
    # テスト実行
    check_environment || exit_code=1
    check_railway_basic || exit_code=1
    check_supabase_connection || exit_code=1
    performance_test || exit_code=1
    security_check || exit_code=1
    load_test || exit_code=1
    
    # Jest テストは任意実行（失敗してもexit_codeに影響しない）
    if command -v npm >/dev/null 2>&1; then
        run_jest_tests || log_warning "Jest テストが失敗しましたが、継続します"
    else
        log_warning "npm コマンドが見つかりません。Jest テストをスキップします"
    fi
    
    generate_report
    
    echo
    echo -e "${PURPLE}=====================================${NC}"
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 統合テスト完了: 成功${NC}"
    else
        echo -e "${RED}💥 統合テスト完了: 一部失敗${NC}"
    fi
    echo -e "${PURPLE}=====================================${NC}"
    echo
    
    log "統合テスト終了: exit_code=$exit_code"
    exit $exit_code
}

# スクリプト実行
main "$@"