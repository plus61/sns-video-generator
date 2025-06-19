#!/bin/bash

# リアルタイム監視ダッシュボード
# Railway & Supabase 環境の継続的モニタリング

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
CHECK_INTERVAL=30  # 30秒間隔
LOG_DIR="logs"
MONITORING_LOG="$LOG_DIR/monitoring-$(date +%Y%m%d).log"

mkdir -p $LOG_DIR

# 画面クリア関数
clear_screen() {
    clear
    echo -e "${WHITE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                Railway & Supabase 監視ダッシュボード                    ║${NC}"
    echo -e "${WHITE}╠════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${WHITE}║ 更新間隔: ${CHECK_INTERVAL}秒 | 最終更新: $(date '+%Y-%m-%d %H:%M:%S')                   ║${NC}"
    echo -e "${WHITE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# ログ関数
log_monitoring() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MONITORING_LOG"
}

# Railway ヘルスチェック
check_railway_health() {
    local status="❌ DOWN"
    local response_time="N/A"
    local health_status="unknown"
    local db_status="unknown"
    local redis_status="unknown"
    local queue_status="unknown"
    local storage_status="unknown"
    local memory_usage="N/A"
    local disk_usage="N/A"
    
    local start_time=$(date +%s%N)
    
    if response=$(curl -s -f "$RAILWAY_URL/api/health" 2>/dev/null); then
        local end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))ms
        status="✅ UP"
        
        # JSONレスポンスから詳細情報を抽出
        health_status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        db_status=$(echo "$response" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
        redis_status=$(echo "$response" | grep -o '"redis":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
        queue_status=$(echo "$response" | grep -o '"queue":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
        storage_status=$(echo "$response" | grep -o '"storage":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
        
        # メモリ使用率を抽出（簡易版）
        memory_percentage=$(echo "$response" | grep -o '"memory":{[^}]*"percentage":[0-9]*' | grep -o '[0-9]*$' 2>/dev/null || echo "0")
        memory_usage="${memory_percentage}%"
        
        # ディスク使用率を抽出（簡易版）
        disk_percentage=$(echo "$response" | grep -o '"disk":{[^}]*"percentage":[0-9]*' | grep -o '[0-9]*$' 2>/dev/null || echo "0")
        disk_usage="${disk_percentage}%"
        
        log_monitoring "Railway Health: $health_status, DB: $db_status, Redis: $redis_status, Response: ${response_time}"
    else
        log_monitoring "Railway Health Check Failed"
    fi
    
    # ステータス表示
    echo -e "${CYAN}🚀 Railway 環境${NC}"
    echo -e "  状態:           $status ($response_time)"
    echo -e "  ヘルス:         $(format_status "$health_status")"
    echo -e "  データベース:   $(format_status "$db_status")"
    echo -e "  Redis:          $(format_status "$redis_status")"
    echo -e "  Queue:          $(format_status "$queue_status")"
    echo -e "  Storage:        $(format_status "$storage_status")"
    echo -e "  メモリ使用率:   $(format_percentage "$memory_usage")"
    echo -e "  ディスク使用率: $(format_percentage "$disk_usage")"
    echo
}

# Vercel フロントエンドチェック
check_vercel_frontend() {
    local status="❌ DOWN"
    local response_time="N/A"
    
    local start_time=$(date +%s%N)
    
    if curl -s -f "$VERCEL_URL" > /dev/null 2>&1; then
        local end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))ms
        status="✅ UP"
        log_monitoring "Vercel Frontend: UP, Response: ${response_time}"
    else
        log_monitoring "Vercel Frontend Check Failed"
    fi
    
    echo -e "${PURPLE}🌐 Vercel フロントエンド${NC}"
    echo -e "  状態:           $status ($response_time)"
    echo
}

# Supabase 接続チェック
check_supabase_connection() {
    local auth_status="❌ DOWN"
    local db_status="❌ DOWN"
    local storage_status="❌ DOWN"
    
    # 認証テスト
    local auth_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/test-auth-simple" 2>/dev/null)
    if [[ "$auth_code" =~ ^(200|401)$ ]]; then
        auth_status="✅ UP"
    fi
    
    # データベーステスト
    local db_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/test-supabase" 2>/dev/null)
    if [[ "$db_code" =~ ^(200|401)$ ]]; then
        db_status="✅ UP"
    fi
    
    # ストレージテスト（ヘルスチェックから推測）
    if curl -s -f "$RAILWAY_URL/api/health" | grep -q '"storage":{"status":"up"' 2>/dev/null; then
        storage_status="✅ UP"
    fi
    
    log_monitoring "Supabase - Auth: $auth_status, DB: $db_status, Storage: $storage_status"
    
    echo -e "${GREEN}🗄️ Supabase サービス${NC}"
    echo -e "  認証:           $auth_status"
    echo -e "  データベース:   $db_status"
    echo -e "  ストレージ:     $storage_status"
    echo
}

# API エンドポイントチェック
check_api_endpoints() {
    local endpoints=(
        "/api/health:ヘルスチェック"
        "/api/test-db:DB接続テスト"
        "/api/user-usage:ユーザー使用量"
        "/api/video-projects:動画プロジェクト"
    )
    
    echo -e "${YELLOW}🔌 API エンドポイント${NC}"
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_info" | cut -d: -f1)
        local description=$(echo "$endpoint_info" | cut -d: -f2)
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint" 2>/dev/null)
        local status_icon=""
        
        if [[ "$status_code" =~ ^(200|401|403)$ ]]; then
            status_icon="✅"
        else
            status_icon="❌"
        fi
        
        printf "  %-20s %s %s\n" "$description" "$status_icon" "$status_code"
    done
    echo
}

# パフォーマンス統計
show_performance_stats() {
    local response_times=()
    local success_count=0
    local total_tests=5
    
    echo -e "${BLUE}📊 パフォーマンス統計 (${total_tests}回テスト)${NC}"
    
    for i in $(seq 1 $total_tests); do
        local start_time=$(date +%s%N)
        if curl -s -f "$RAILWAY_URL/api/health" > /dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local response_time=$(( (end_time - start_time) / 1000000 ))
            response_times+=($response_time)
            success_count=$((success_count + 1))
        fi
        sleep 0.5
    done
    
    if [ $success_count -gt 0 ]; then
        # 平均計算
        local total=0
        for time in "${response_times[@]}"; do
            total=$((total + time))
        done
        local avg=$((total / success_count))
        
        # 最小・最大計算
        local min=${response_times[0]}
        local max=${response_times[0]}
        for time in "${response_times[@]}"; do
            [ $time -lt $min ] && min=$time
            [ $time -gt $max ] && max=$time
        done
        
        echo -e "  成功率:         ${success_count}/${total_tests} ($(( success_count * 100 / total_tests ))%)"
        echo -e "  平均応答時間:   ${avg}ms"
        echo -e "  最小応答時間:   ${min}ms"
        echo -e "  最大応答時間:   ${max}ms"
        
        # パフォーマンス評価
        if [ $avg -lt 1000 ]; then
            echo -e "  評価:           🚀 優秀 (<1秒)"
        elif [ $avg -lt 3000 ]; then
            echo -e "  評価:           ✅ 良好 (<3秒)"
        elif [ $avg -lt 5000 ]; then
            echo -e "  評価:           ⚠️ 普通 (<5秒)"
        else
            echo -e "  評価:           ❌ 要改善 (>5秒)"
        fi
        
        log_monitoring "Performance - Success: $success_count/$total_tests, Avg: ${avg}ms, Min: ${min}ms, Max: ${max}ms"
    else
        echo -e "  ${RED}全てのテストが失敗しました${NC}"
        log_monitoring "Performance - All tests failed"
    fi
    echo
}

# ステータスフォーマット関数
format_status() {
    local status="$1"
    case "$status" in
        "up"|"healthy") echo -e "${GREEN}✅ UP${NC}" ;;
        "down"|"unhealthy") echo -e "${RED}❌ DOWN${NC}" ;;
        "degraded") echo -e "${YELLOW}⚠️ DEGRADED${NC}" ;;
        *) echo -e "${YELLOW}❓ $status${NC}" ;;
    esac
}

# パーセンテージフォーマット関数
format_percentage() {
    local percentage="$1"
    local num=$(echo "$percentage" | grep -o '[0-9]*' || echo "0")
    
    if [ "$num" -lt 50 ]; then
        echo -e "${GREEN}$percentage${NC}"
    elif [ "$num" -lt 80 ]; then
        echo -e "${YELLOW}$percentage${NC}"
    else
        echo -e "${RED}$percentage${NC}"
    fi
}

# アラート表示
show_alerts() {
    echo -e "${RED}🚨 アラート${NC}"
    
    # ヘルスチェックからアラート条件をチェック
    if response=$(curl -s -f "$RAILWAY_URL/api/health" 2>/dev/null); then
        local health_status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        local memory_percentage=$(echo "$response" | grep -o '"memory":{[^}]*"percentage":[0-9]*' | grep -o '[0-9]*$' 2>/dev/null || echo "0")
        local disk_percentage=$(echo "$response" | grep -o '"disk":{[^}]*"percentage":[0-9]*' | grep -o '[0-9]*$' 2>/dev/null || echo "0")
        
        local alerts_found=false
        
        if [ "$health_status" = "unhealthy" ]; then
            echo -e "  🔴 システムヘルス: 不健全状態"
            alerts_found=true
        elif [ "$health_status" = "degraded" ]; then
            echo -e "  🟡 システムヘルス: 劣化状態"
            alerts_found=true
        fi
        
        if [ "$memory_percentage" -gt 90 ]; then
            echo -e "  🔴 メモリ使用率: ${memory_percentage}% (危険レベル)"
            alerts_found=true
        elif [ "$memory_percentage" -gt 80 ]; then
            echo -e "  🟡 メモリ使用率: ${memory_percentage}% (警告レベル)"
            alerts_found=true
        fi
        
        if [ "$disk_percentage" -gt 85 ]; then
            echo -e "  🔴 ディスク使用率: ${disk_percentage}% (危険レベル)"
            alerts_found=true
        elif [ "$disk_percentage" -gt 75 ]; then
            echo -e "  🟡 ディスク使用率: ${disk_percentage}% (警告レベル)"
            alerts_found=true
        fi
        
        if [ "$alerts_found" = false ]; then
            echo -e "  ${GREEN}✅ アラートなし${NC}"
        fi
    else
        echo -e "  🔴 Railway 接続不可"
    fi
    echo
}

# 操作ガイド表示
show_controls() {
    echo -e "${WHITE}🎮 操作方法${NC}"
    echo -e "  ${CYAN}Ctrl+C${NC}: 監視終了"
    echo -e "  ${CYAN}r${NC}: 手動更新"
    echo -e "  ${CYAN}l${NC}: ログ表示"
    echo -e "  ${CYAN}h${NC}: ヘルプ"
    echo
}

# ログ表示
show_logs() {
    echo -e "${WHITE}📋 最新ログ (最新10件)${NC}"
    tail -n 10 "$MONITORING_LOG" 2>/dev/null || echo "ログファイルが見つかりません"
    echo
    echo "エンターキーを押してダッシュボードに戻る..."
    read
}

# ヘルプ表示
show_help() {
    clear
    echo -e "${WHITE}📖 監視ダッシュボード ヘルプ${NC}"
    echo
    echo -e "${CYAN}概要:${NC}"
    echo "  Railway & Supabase 環境の継続的監視を行います"
    echo
    echo -e "${CYAN}監視項目:${NC}"
    echo "  • Railway ヘルスチェック"
    echo "  • Vercel フロントエンド状態"
    echo "  • Supabase サービス状態"
    echo "  • API エンドポイント疎通"
    echo "  • パフォーマンス統計"
    echo "  • リソース使用率"
    echo "  • システムアラート"
    echo
    echo -e "${CYAN}ログファイル:${NC}"
    echo "  $MONITORING_LOG"
    echo
    echo -e "${CYAN}設定:${NC}"
    echo "  更新間隔: ${CHECK_INTERVAL}秒"
    echo "  Railway URL: $RAILWAY_URL"
    echo "  Vercel URL: $VERCEL_URL"
    echo
    echo "エンターキーを押してダッシュボードに戻る..."
    read
}

# メイン監視ループ
monitoring_loop() {
    local manual_refresh=false
    
    while true; do
        clear_screen
        check_railway_health
        check_vercel_frontend
        check_supabase_connection
        check_api_endpoints
        show_performance_stats
        show_alerts
        show_controls
        
        echo -e "${WHITE}次回更新まで: ${CHECK_INTERVAL}秒 | ログファイル: $(basename "$MONITORING_LOG")${NC}"
        
        # 入力待機（タイムアウト付き）
        if read -t $CHECK_INTERVAL -n 1 input 2>/dev/null; then
            case "$input" in
                'r'|'R') continue ;;  # 手動更新
                'l'|'L') show_logs ;;  # ログ表示
                'h'|'H') show_help ;;  # ヘルプ表示
                'q'|'Q') echo -e "\n${YELLOW}監視を終了します...${NC}"; exit 0 ;;
            esac
        fi
    done
}

# 初期化
initialize() {
    echo -e "${BLUE}🚀 監視ダッシュボード初期化中...${NC}"
    
    # ログファイル作成
    log_monitoring "Monitoring Dashboard Started - Railway: $RAILWAY_URL, Vercel: $VERCEL_URL"
    
    # 初期接続テスト
    echo -e "${CYAN}初期接続テスト実行中...${NC}"
    
    if curl -s -f "$RAILWAY_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Railway 接続成功${NC}"
    else
        echo -e "${RED}❌ Railway 接続失敗${NC}"
        echo -e "${YELLOW}⚠️ 続行しますが、エラーが表示される可能性があります${NC}"
    fi
    
    if curl -s -f "$VERCEL_URL" > /dev/null; then
        echo -e "${GREEN}✅ Vercel 接続成功${NC}"
    else
        echo -e "${RED}❌ Vercel 接続失敗${NC}"
        echo -e "${YELLOW}⚠️ 続行しますが、エラーが表示される可能性があります${NC}"
    fi
    
    sleep 2
    echo -e "${GREEN}✅ 初期化完了${NC}"
    sleep 1
}

# 終了処理
cleanup() {
    echo -e "\n${YELLOW}監視ダッシュボードを終了しています...${NC}"
    log_monitoring "Monitoring Dashboard Stopped"
    echo -e "${GREEN}✅ 終了完了${NC}"
    exit 0
}

# シグナルハンドリング
trap cleanup SIGINT SIGTERM

# メイン実行
main() {
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${PURPLE}  Railway & Supabase 監視開始       ${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    
    initialize
    monitoring_loop
}

# 引数チェック
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# 実行
main "$@"