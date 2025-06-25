#!/bin/bash

# Boss1のインボックスを監視してメッセージを処理するスクリプト

echo "🚀 Boss1メッセージ監視システム起動"
echo "📁 監視ディレクトリ: messages/inbox/boss1/"

# 処理済みディレクトリの作成
mkdir -p messages/processed

while true; do
    for msg in messages/inbox/boss1/*.msg; do
        if [ -f "$msg" ]; then
            echo ""
            echo "📨 新規メッセージ検出: $(basename "$msg")"
            
            # メッセージ内容を読み取り
            message=$(cat "$msg")
            echo "📝 内容: $message"
            
            # Boss1として処理を実行
            echo "🤖 Boss1自律処理開始..."
            
            # タスク重複チェックを実行
            if [ -f "./task-deduplication-system.sh" ]; then
                ./task-deduplication-system.sh check "$message"
                if [ $? -eq 0 ]; then
                    echo "⚠️  重複タスク検出 - スキップ"
                else
                    # 新規タスクとして記録
                    task_id=$(./task-deduplication-system.sh create "$message" "boss1" "high")
                fi
            fi
            
            # agent-send.shを使用してBoss1に直接メッセージを送信
            ./agent-send.sh boss1 "$message"
            
            # 処理済みディレクトリに移動
            mv "$msg" "messages/processed/$(basename "$msg")"
            echo "✅ メッセージ処理完了"
        fi
    done
    
    # 1秒待機
    sleep 1
done