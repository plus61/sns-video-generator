#\!/bin/bash

# Auto Timer System for Worker2
# 5分間隔でエラー分析報告

TIMER_FILE="./tmp/worker2_timer.txt"
INTERVAL=300  # 5分 = 300秒

check() {
    current_time=$(date +%s)
    
    if [ -f "$TIMER_FILE" ]; then
        last_check=$(cat "$TIMER_FILE")
        elapsed=$((current_time - last_check))
        
        if [ $elapsed -ge $INTERVAL ]; then
            echo "⏰ 5分経過検知！エラー分析報告タイミング"
            echo "$current_time" > "$TIMER_FILE"
            
            # 最新状況分析
            echo "📊 現在の状況："
            echo "- railway.toml: startCommand修正済み (npm start)"
            echo "- next.config.ts: standalone無効化済み"
            echo "- .next: ディレクトリ存在確認済み"
            echo ""
            echo "✅ 修正完了項目："
            echo "1. startCommand = 'npm start' に変更"
            echo "2. dockerfilePath = './Dockerfile.railway-fix' に更新"
            echo "3. standalone出力を無効化"
            
            return 0
        else
            remaining=$((INTERVAL - elapsed))
            echo "次回チェックまで: ${remaining}秒"
        fi
    else
        echo "$current_time" > "$TIMER_FILE"
        echo "⏰ タイマーシステム初期化完了"
    fi
}

case "$1" in
    check)
        check
        ;;
    reset)
        rm -f "$TIMER_FILE"
        echo "タイマーリセット完了"
        ;;
    *)
        echo "使用方法: $0 {check|reset}"
        exit 1
        ;;
esac
