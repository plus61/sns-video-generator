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
