#!/bin/bash

# Worker3 時間管理システム
# 5分間隔で進捗確認と代替案の準備状況をチェック

TIMER_FILE="/tmp/worker3_timer.txt"
LAST_CHECK_FILE="/tmp/worker3_last_check.txt"
INTERVAL=300  # 5分 = 300秒

check_time() {
    current_time=$(date +%s)
    
    if [ -f "$LAST_CHECK_FILE" ]; then
        last_check=$(cat "$LAST_CHECK_FILE")
        elapsed=$((current_time - last_check))
        minutes=$((elapsed / 60))
        seconds=$((elapsed % 60))
        
        echo "⏰ 時間管理システムチェック"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📅 現在時刻: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "⏱️  前回チェックから: ${minutes}分${seconds}秒経過"
        
        if [ $elapsed -ge $INTERVAL ]; then
            echo "🚨 5分経過検知！代替案進捗報告を実行"
            report_progress
            echo $current_time > "$LAST_CHECK_FILE"
        else
            remaining=$((INTERVAL - elapsed))
            echo "⏳ 次回報告まで: $((remaining / 60))分$((remaining % 60))秒"
        fi
    else
        echo "🆕 時間管理システム初期化"
        echo $current_time > "$LAST_CHECK_FILE"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

report_progress() {
    echo ""
    echo "📊 代替案準備状況報告"
    echo "========================="
    
    # プランA: Express サーバー
    if [ -f "express-server.js" ]; then
        echo "✅ プランA (Express): 準備完了"
    else
        echo "❌ プランA (Express): 未準備"
    fi
    
    # プランB: 静的エクスポート
    if [ -f "next.config.static.ts" ]; then
        echo "✅ プランB (静的エクスポート): 準備完了"
    else
        echo "❌ プランB (静的エクスポート): 未準備"
    fi
    
    # プランC: ビルド済みコミット
    if [ -f "prepare-prebuilt.sh" ]; then
        echo "✅ プランC (ビルド済み): 準備完了"
    else
        echo "❌ プランC (ビルド済み): 未準備"
    fi
    
    # Railway デプロイ状況
    echo ""
    echo "🚂 Railway デプロイ監視"
    echo "最新コミット: $(git log --oneline -n 1)"
    
    # ヘルスチェック（可能な場合）
    if command -v curl &> /dev/null; then
        echo ""
        echo "🏥 ヘルスチェック試行..."
        curl -s -o /dev/null -w "応答時間: %{time_total}秒\nHTTPステータス: %{http_code}\n" \
            https://sns-video-generator-production.up.railway.app/api/health || echo "❌ 接続失敗"
    fi
    
    echo "========================="
    echo ""
}

# メイン処理
case "$1" in
    check)
        check_time
        ;;
    init)
        echo "🚀 時間管理システムを初期化しました"
        date +%s > "$LAST_CHECK_FILE"
        ;;
    reset)
        rm -f "$LAST_CHECK_FILE" "$TIMER_FILE"
        echo "🔄 時間管理システムをリセットしました"
        ;;
    *)
        echo "使用方法: $0 {check|init|reset}"
        echo "  check - 時間チェックと進捗報告"
        echo "  init  - システム初期化"
        echo "  reset - タイマーリセット"
        exit 1
        ;;
esac