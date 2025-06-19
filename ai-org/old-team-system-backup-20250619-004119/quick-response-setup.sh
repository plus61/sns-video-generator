#!/bin/bash
# quick-response-setup.sh - 簡易応答システムセットアップ

# ディレクトリ作成
echo "📁 通信ディレクトリ作成中..."
mkdir -p messages/{inbox/{president,boss1,worker1,worker2,worker3},outbox,processed}
mkdir -p responses

# 応答監視スクリプト作成
cat > response-monitor.sh << 'EOF'
#!/bin/bash
# response-monitor.sh - President用応答監視

INBOX="./messages/inbox/president"
PROCESSED="./messages/processed"

echo "📡 応答監視開始..."
echo "   監視ディレクトリ: $INBOX"

while true; do
    for file in "$INBOX"/*.msg 2>/dev/null; do
        if [ -f "$file" ]; then
            echo ""
            echo "="
            echo "📨 新着メッセージ: $(basename "$file")"
            echo "時刻: $(date '+%Y-%m-%d %H:%M:%S')"
            echo "内容:"
            cat "$file"
            echo "="
            
            # 処理済みに移動
            mkdir -p "$PROCESSED"
            mv "$file" "$PROCESSED/$(date +%s)_$(basename "$file")"
        fi
    done
    sleep 1
done
EOF

chmod +x response-monitor.sh

# BOSS/Worker用応答送信スクリプト
cat > send-response.sh << 'EOF'
#!/bin/bash
# send-response.sh - BOSS/Worker用応答送信

if [ $# -lt 2 ]; then
    echo "使用方法: $0 [from] [message]"
    echo "例: $0 boss1 \"タスク完了しました\""
    exit 1
fi

FROM="$1"
MESSAGE="$2"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MSG_FILE="messages/inbox/president/${FROM}_$(date +%s%N).msg"

mkdir -p "$(dirname "$MSG_FILE")"

cat > "$MSG_FILE" << EOT
From: $FROM
Time: $TIMESTAMP
Message: $MESSAGE
EOT

echo "✅ 応答送信完了: $MSG_FILE"
EOF

chmod +x send-response.sh

# 使用方法ガイド
cat > RESPONSE_GUIDE.md << 'EOF'
# 応答システム使用ガイド

## President側（応答受信）

1. 監視開始:
```bash
./response-monitor.sh
```

2. 別ターミナルでメッセージ送信:
```bash
./agent-send.sh boss1 "状況報告をお願いします"
```

## BOSS/Worker側（応答送信）

```bash
# 応答を送信
./send-response.sh boss1 "全タスク完了。エラーなし。"
./send-response.sh worker1 "Dockerfile修正完了"
```

## ディレクトリ構造
```
messages/
├── inbox/
│   └── president/  # Presidentへの応答
├── outbox/        # 送信履歴
└── processed/     # 処理済み
```
EOF

echo "✅ セットアップ完了！"
echo ""
echo "📖 使用方法:"
echo "1. President側: ./response-monitor.sh を実行"
echo "2. BOSS側: ./send-response.sh boss1 \"メッセージ\""
echo ""
echo "詳細は RESPONSE_GUIDE.md を参照"