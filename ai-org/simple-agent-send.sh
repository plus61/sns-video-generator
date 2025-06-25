#!/bin/bash

# シンプル化されたエージェント通信スクリプト

to_agent="$1"
message="$2"

if [ -z "$to_agent" ] || [ -z "$message" ]; then
    echo "Usage: $0 <agent> <message>"
    echo "Example: $0 worker1 'タスクを実行してください'"
    exit 1
fi

echo "📤 送信中: $to_agent ← '$message'"

# TMuxセッションに直接送信を試みる
if tmux has-session -t "$to_agent" 2>/dev/null; then
    tmux send-keys -t "$to_agent" "$message" Enter
    echo "✅ TMux送信完了: $to_agent"
else
    echo "❌ TMuxセッション '$to_agent' が見つかりません"
    
    # フォールバック：ファイルベース通信
    mkdir -p "messages/inbox/$to_agent"
    echo "$message" > "messages/inbox/$to_agent/$(date +%s).msg"
    echo "📁 ファイル経由で送信: messages/inbox/$to_agent/"
fi

# ステータス更新
echo "working" > "$to_agent/status.txt"
echo "✅ ステータス更新: $to_agent → working"