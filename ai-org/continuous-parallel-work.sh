#!/bin/bash
# continuous-parallel-work.sh - 継続的な並列作業シミュレーション

# バックグラウンドでWorkerを継続的に動作させる
start_continuous_workers() {
    echo "🚀 継続的な並列作業を開始..."
    
    # Worker1: インフラ監視
    (
        while true; do
            echo "working" > worker1/status.txt
            echo "[Worker1] Railway環境を監視中..." >> logs/worker1_activity.log
            sleep 5
            echo "[Worker1] ヘルスチェック完了" >> logs/worker1_activity.log
            echo "idle" > worker1/status.txt
            sleep 3
        done
    ) &
    echo $! > worker1/pid
    
    # Worker2: コード開発
    (
        while true; do
            echo "working" > worker2/status.txt
            echo "[Worker2] 動画アップロード機能を実装中..." >> logs/worker2_activity.log
            sleep 7
            echo "[Worker2] コンポーネント作成完了" >> logs/worker2_activity.log
            echo "idle" > worker2/status.txt
            sleep 2
        done
    ) &
    echo $! > worker2/pid
    
    # Worker3: テスト実行
    (
        while true; do
            echo "working" > worker3/status.txt
            echo "[Worker3] テストスイートを実行中..." >> logs/worker3_activity.log
            sleep 6
            echo "[Worker3] テスト完了 (全パス)" >> logs/worker3_activity.log
            echo "idle" > worker3/status.txt
            sleep 4
        done
    ) &
    echo $! > worker3/pid
    
    # BOSS: 調整役
    (
        while true; do
            echo "coordinating" > boss1/status.txt
            echo "[BOSS] チーム進捗を集約中..." >> logs/boss1_activity.log
            
            # 各Workerの状態チェック
            for worker in worker1 worker2 worker3; do
                status=$(cat $worker/status.txt 2>/dev/null || echo "unknown")
                echo "[BOSS] $worker: $status" >> logs/boss1_activity.log
            done
            
            sleep 10
            echo "idle" > boss1/status.txt
            sleep 5
        done
    ) &
    echo $! > boss1/pid
    
    echo "✅ 全エージェントが稼働開始しました"
    echo ""
    echo "PIDファイル:"
    ls -la */pid
}

# 駆動状態の表示
show_live_status() {
    echo "📊 リアルタイム駆動状態:"
    echo "========================"
    
    for i in {1..10}; do
        clear
        echo "📊 リアルタイム駆動状態 ($(date +%H:%M:%S))"
        echo "========================"
        
        for agent in boss1 worker1 worker2 worker3; do
            status=$(cat $agent/status.txt 2>/dev/null || echo "offline")
            pid=$(cat $agent/pid 2>/dev/null || echo "none")
            
            # 状態に応じた絵文字
            case $status in
                "working"|"coordinating") emoji="🟢" ;;
                "idle") emoji="🟡" ;;
                *) emoji="🔴" ;;
            esac
            
            printf "%-10s %s %-12s (PID: %s)\n" "$agent:" "$emoji" "$status" "$pid"
        done
        
        echo ""
        echo "最新のアクティビティ:"
        echo "-------------------"
        tail -n 4 logs/*_activity.log 2>/dev/null | tail -n 4
        
        sleep 2
    done
}

# 停止処理
stop_all() {
    echo "🛑 全エージェントを停止中..."
    
    for agent in boss1 worker1 worker2 worker3; do
        if [ -f "$agent/pid" ]; then
            pid=$(cat "$agent/pid")
            kill $pid 2>/dev/null && echo "- $agent (PID: $pid) を停止"
            rm -f "$agent/pid"
            echo "offline" > "$agent/status.txt"
        fi
    done
    
    echo "✅ 停止完了"
}

# メイン処理
case "$1" in
    "start")
        mkdir -p logs
        start_continuous_workers
        ;;
    "status")
        show_live_status
        ;;
    "stop")
        stop_all
        ;;
    *)
        echo "使用方法: $0 [start|status|stop]"
        echo "  start  - 継続的な並列作業を開始"
        echo "  status - リアルタイム状態を表示"
        echo "  stop   - 全エージェントを停止"
        ;;
esac