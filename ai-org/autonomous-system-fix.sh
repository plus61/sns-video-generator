#!/bin/bash

# 自律システム修復スクリプト

echo "🔧 自律システムの修復を開始します"

# 1. ステータスファイルの初期化
echo "📝 ステータスファイルを初期化中..."
echo "idle" > boss1/status.txt
echo "idle" > worker1/status.txt
echo "idle" > worker2/status.txt
echo "idle" > worker3/status.txt

# 2. メッセージディレクトリの作成
echo "📁 メッセージディレクトリを作成中..."
mkdir -p messages/inbox/{boss1,worker1,worker2,worker3}
mkdir -p messages/outbox
mkdir -p messages/processed

# 3. シンプルな監視スクリプトの作成
cat > monitor-simple.sh << 'EOF'
#!/bin/bash

# シンプルな自律実行監視

while true; do
    # Boss1のインボックスを監視
    for msg in messages/inbox/boss1/*.msg 2>/dev/null; do
        if [ -f "$msg" ]; then
            echo "📨 Boss1: 新規メッセージ検出"
            message=$(cat "$msg")
            echo "Boss1が処理: $message"
            
            # Boss1のステータスを更新
            echo "coordinating" > boss1/status.txt
            
            # ワーカーに指示を転送（例）
            if [[ "$message" =~ "Railway" ]]; then
                echo "Railway統合タスクを実行してください" > messages/inbox/worker1/$(date +%s).msg
                echo "working" > worker1/status.txt
            fi
            
            # 処理済みに移動
            mv "$msg" messages/processed/
        fi
    done
    
    # 各ワーカーのインボックスを監視
    for worker in worker1 worker2 worker3; do
        for msg in messages/inbox/$worker/*.msg 2>/dev/null; do
            if [ -f "$msg" ]; then
                echo "📨 $worker: 新規タスク受信"
                task=$(cat "$msg")
                echo "$worker が実行: $task"
                echo "working" > $worker/status.txt
                
                # 完了報告を作成（デモ用）
                sleep 2
                echo "タスク完了: $task" > messages/outbox/${worker}-completion-$(date +%s).md
                echo "idle" > $worker/status.txt
                
                mv "$msg" messages/processed/
            fi
        done
    done
    
    sleep 1
done
EOF

chmod +x monitor-simple.sh

echo "✅ 修復完了"
echo ""
echo "使用方法:"
echo "1. 監視開始: ./monitor-simple.sh &"
echo "2. メッセージ送信: echo 'タスク内容' > messages/inbox/boss1/test.msg"
echo "3. ステータス確認: cat */status.txt"