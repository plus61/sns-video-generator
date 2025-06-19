#!/bin/bash
# demo-parallel-activity.sh - 並列活動の可視化デモ

# 初期化
echo "🚀 並列開発活動デモンストレーション開始..."
./parallel-team-system.sh init > /dev/null 2>&1

# リアルタイム活動シミュレーション
simulate_continuous_activity() {
    local duration=${1:-30}  # デフォルト30秒
    local end_time=$(($(date +%s) + duration))
    
    echo "📊 ${duration}秒間の並列活動をシミュレート..."
    echo "================================================"
    
    while [ $(date +%s) -lt $end_time ]; do
        # ランダムなタスク割り当て
        case $((RANDOM % 4)) in
            0)
                task="機能実装: $(date +%H:%M:%S)"
                ./parallel-team-system.sh assign code "$task" > /dev/null
                echo "[$(date +%H:%M:%S)] 📝 新規タスク割当: $task → Worker2"
                ;;
            1)
                task="インフラ調整: $(date +%H:%M:%S)"
                ./parallel-team-system.sh assign infrastructure "$task" > /dev/null
                echo "[$(date +%H:%M:%S)] 🔧 新規タスク割当: $task → Worker1"
                ;;
            2)
                task="テスト作成: $(date +%H:%M:%S)"
                ./parallel-team-system.sh assign testing "$task" > /dev/null
                echo "[$(date +%H:%M:%S)] 🧪 新規タスク割当: $task → Worker3"
                ;;
            3)
                task="進捗調整: $(date +%H:%M:%S)"
                ./parallel-team-system.sh assign coordination "$task" high > /dev/null
                echo "[$(date +%H:%M:%S)] 📋 調整タスク: $task → BOSS"
                ;;
        esac
        
        # 並列実行（バックグラウンド）
        (./parallel-team-system.sh run > /tmp/parallel_output_$$.txt 2>&1) &
        
        # 現在の状態を表示
        sleep 2
        echo -n "[$(date +%H:%M:%S)] 状態: "
        echo -n "BOSS=$(cat boss1/status.txt 2>/dev/null || echo 'offline') "
        echo -n "W1=$(cat worker1/status.txt 2>/dev/null || echo 'offline') "
        echo -n "W2=$(cat worker2/status.txt 2>/dev/null || echo 'offline') "
        echo "W3=$(cat worker3/status.txt 2>/dev/null || echo 'offline')"
        
        sleep 3
    done
    
    echo "================================================"
    echo "✅ デモンストレーション完了"
    
    # 最終統計
    echo ""
    echo "📈 活動統計:"
    echo "- 通信ログ: $(wc -l < logs/send_log.txt) 件"
    echo "- 完了タスク: $(find . -name "*.task.done" | wc -l) 件"
}

# メイン実行
case "$1" in
    "quick")
        simulate_continuous_activity 10
        ;;
    "full")
        simulate_continuous_activity 60
        ;;
    *)
        echo "使用方法: $0 [quick|full]"
        echo "  quick - 10秒間のデモ"
        echo "  full  - 60秒間のデモ"
        simulate_continuous_activity 20
        ;;
esac

# 最終レポート
echo ""
echo "📊 最終チーム状態:"
./parallel-team-system.sh status