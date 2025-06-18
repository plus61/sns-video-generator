#!/bin/bash
# response-monitor-v2.sh - President用応答監視（修正版）

INBOX="./messages/inbox/president"
PROCESSED="./messages/processed"

echo "📡 応答監視開始..."
echo "   監視ディレクトリ: $INBOX"

while true; do
    # ファイルが存在するかチェック
    if ls "$INBOX"/*.msg 1> /dev/null 2>&1; then
        for file in "$INBOX"/*.msg; do
            if [ -f "$file" ]; then
                echo ""
                echo "========================================"
                echo "📨 新着メッセージ: $(basename "$file")"
                echo "時刻: $(date '+%Y-%m-%d %H:%M:%S')"
                echo "内容:"
                cat "$file"
                echo "========================================"
                
                # 処理済みに移動
                mkdir -p "$PROCESSED"
                mv "$file" "$PROCESSED/$(date +%s)_$(basename "$file")"
            fi
        done
    fi
    sleep 1
done