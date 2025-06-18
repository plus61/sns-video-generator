#!/bin/bash
# build-monitor.sh - Railway/Vercelビルド状態監視スクリプト

# ログディレクトリの作成
LOG_DIR="./logs/build-monitor"
mkdir -p "$LOG_DIR"

# 現在の日付でログファイル名を生成
LOG_FILE="$LOG_DIR/build-status-$(date +%Y%m%d).log"
ERROR_LOG="$LOG_DIR/build-errors-$(date +%Y%m%d).log"

# 色付き出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ記録関数
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        ERROR)
            echo -e "${RED}[$timestamp] [$level] $message${NC}"
            echo "[$timestamp] $message" >> "$ERROR_LOG"
            ;;
        SUCCESS)
            echo -e "${GREEN}[$timestamp] [$level] $message${NC}"
            ;;
        WARNING)
            echo -e "${YELLOW}[$timestamp] [$level] $message${NC}"
            ;;
        *)
            echo "[$timestamp] [$level] $message"
            ;;
    esac
}

# Gitの最新コミット情報取得
get_latest_commit() {
    cd .. && git log -1 --format="%H %s" 2>/dev/null || echo "unknown"
}

# ビルドステータスチェック関数
check_build_status() {
    local platform=$1
    local commit=$(get_latest_commit)
    
    log_message "INFO" "Checking $platform build status for commit: $commit"
    
    # プラットフォーム別のチェック
    case $platform in
        railway)
            # Railway CLI使用（インストール済みの場合）
            if command -v railway &> /dev/null; then
                railway status 2>&1 | tee -a "$LOG_FILE"
            else
                log_message "WARNING" "Railway CLI not installed, skipping Railway check"
            fi
            ;;
        vercel)
            # Vercel CLI使用（インストール済みの場合）
            if command -v vercel &> /dev/null; then
                vercel list --output json 2>&1 | tee -a "$LOG_FILE"
            else
                log_message "WARNING" "Vercel CLI not installed, skipping Vercel check"
            fi
            ;;
    esac
}

# ローカルビルドテスト
test_local_build() {
    log_message "INFO" "Starting local build test..."
    
    cd ..
    
    # npm ciテスト
    if npm ci --dry-run > /dev/null 2>&1; then
        log_message "SUCCESS" "npm ci check passed"
    else
        log_message "ERROR" "npm ci check failed - package-lock.json may be out of sync"
        return 1
    fi
    
    # ビルドテスト
    if npm run build > /dev/null 2>&1; then
        log_message "SUCCESS" "Local build succeeded"
    else
        log_message "ERROR" "Local build failed"
        return 1
    fi
    
    return 0
}

# Docker ビルドテスト
test_docker_build() {
    log_message "INFO" "Starting Docker build test..."
    
    cd ..
    
    if docker build -t sns-video-test . > /dev/null 2>&1; then
        log_message "SUCCESS" "Docker build succeeded"
        # クリーンアップ
        docker rmi sns-video-test > /dev/null 2>&1
    else
        log_message "ERROR" "Docker build failed"
        return 1
    fi
    
    return 0
}

# エラー通知（BOSSシステムへ）
notify_boss() {
    local error_type=$1
    local error_details=$2
    
    # send_log.txtに記録
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BUILD_MONITOR: ERROR - $error_type: $error_details" >> ./logs/send_log.txt
}

# メイン監視ループ
main_monitor() {
    log_message "INFO" "Build monitor started"
    
    while true; do
        echo "=== Build Status Check - $(date) ==="
        
        # ローカルビルドチェック
        if ! test_local_build; then
            notify_boss "LOCAL_BUILD_FAILURE" "Local build test failed"
        fi
        
        # Dockerビルドチェック（Docker使用可能な場合）
        if command -v docker &> /dev/null; then
            if ! test_docker_build; then
                notify_boss "DOCKER_BUILD_FAILURE" "Docker build test failed"
            fi
        fi
        
        # プラットフォーム別チェック
        check_build_status "railway"
        check_build_status "vercel"
        
        # 次回チェックまで待機（5分）
        echo "Next check in 5 minutes..."
        sleep 300
    done
}

# スクリプト実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Starting SNS Video Generator Build Monitor..."
    echo "Logs will be saved to: $LOG_FILE"
    echo "Errors will be saved to: $ERROR_LOG"
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    # トラップ設定（終了時のクリーンアップ）
    trap 'log_message "INFO" "Build monitor stopped"; exit 0' INT TERM
    
    # メイン監視ループ開始
    main_monitor
fi