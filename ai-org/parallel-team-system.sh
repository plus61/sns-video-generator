#!/bin/bash
# 並列開発のための組織駆動システム

# ディレクトリ構成
TEAM_DIR="$(dirname "$0")"
BOSS_DIR="$TEAM_DIR/boss1"
WORKER_DIRS=("$TEAM_DIR/worker1" "$TEAM_DIR/worker2" "$TEAM_DIR/worker3")
MESSAGE_DIR="$TEAM_DIR/messages"
LOG_FILE="$TEAM_DIR/logs/send_log.txt"

# 初期化
init_team_system() {
    echo "🚀 組織駆動システムを初期化..."
    
    # ディレクトリ作成
    mkdir -p "$BOSS_DIR" "${WORKER_DIRS[@]}"
    mkdir -p "$MESSAGE_DIR"/{inbox,outbox,processed}/{boss1,worker1,worker2,worker3,president}
    mkdir -p "$TEAM_DIR/logs"
    
    # タスクキュー初期化
    for dir in "$BOSS_DIR" "${WORKER_DIRS[@]}"; do
        mkdir -p "$dir/tasks"
        touch "$dir/status.txt"
        echo "idle" > "$dir/status.txt"
    done
    
    echo "✅ 初期化完了"
}

# メッセージ送信
send_message() {
    local from="$1"
    local to="$2"
    local message="$3"
    local timestamp=$(date +%s%N)
    local msg_file="$MESSAGE_DIR/outbox/$to/${from}_${timestamp}.msg"
    
    cat > "$msg_file" << EOF
From: $from
To: $to
Time: $(date '+%Y-%m-%d %H:%M:%S')
Message: $message
EOF
    
    # ログに記録
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $from -> $to: $message" >> "$LOG_FILE"
    
    # 受信ボックスにコピー
    cp "$msg_file" "$MESSAGE_DIR/inbox/$to/"
}

# タスク割り当て
assign_task() {
    local task_type="$1"
    local description="$2"
    local priority="${3:-medium}"
    
    case "$task_type" in
        "infrastructure")
            send_message "president" "worker1" "タスク: $description (優先度: $priority)"
            echo "$description" > "$TEAM_DIR/worker1/tasks/$(date +%s).task"
            ;;
        "code")
            send_message "president" "worker2" "タスク: $description (優先度: $priority)"
            echo "$description" > "$TEAM_DIR/worker2/tasks/$(date +%s).task"
            ;;
        "testing")
            send_message "president" "worker3" "タスク: $description (優先度: $priority)"
            echo "$description" > "$TEAM_DIR/worker3/tasks/$(date +%s).task"
            ;;
        "coordination")
            send_message "president" "boss1" "調整: $description (優先度: $priority)"
            echo "$description" > "$BOSS_DIR/tasks/$(date +%s).task"
            ;;
    esac
}

# Worker実行シミュレーション
simulate_worker() {
    local worker_id="$1"
    local worker_dir="$TEAM_DIR/$worker_id"
    
    echo "🤖 $worker_id 稼働開始..."
    echo "working" > "$worker_dir/status.txt"
    
    # タスク処理
    for task_file in "$worker_dir/tasks"/*.task; do
        if [ -f "$task_file" ]; then
            local task=$(cat "$task_file")
            echo "   処理中: $task"
            
            # 進捗報告
            send_message "$worker_id" "boss1" "進捗: $task を処理中"
            sleep 2  # 作業シミュレーション
            
            # 完了報告
            send_message "$worker_id" "boss1" "完了: $task"
            mv "$task_file" "$task_file.done"
        fi
    done
    
    echo "idle" > "$worker_dir/status.txt"
}

# BOSS調整機能
coordinate_boss() {
    echo "🧠 BOSS 調整開始..."
    echo "coordinating" > "$BOSS_DIR/status.txt"
    
    # 進捗集約
    local progress_report="進捗レポート:\n"
    
    for worker in worker1 worker2 worker3; do
        local status=$(cat "$TEAM_DIR/$worker/status.txt" 2>/dev/null || echo "unknown")
        local completed=$(find "$TEAM_DIR/$worker/tasks" -name "*.task.done" 2>/dev/null | wc -l)
        local pending=$(find "$TEAM_DIR/$worker/tasks" -name "*.task" ! -name "*.done" 2>/dev/null | wc -l)
        
        progress_report+="- $worker: 状態=$status, 完了=$completed, 保留=$pending\n"
    done
    
    # Presidentに報告
    send_message "boss1" "president" "$progress_report"
    
    echo "idle" > "$BOSS_DIR/status.txt"
}

# 並列実行
run_parallel() {
    echo "🚀 並列実行開始..."
    
    # Workerを並列起動
    simulate_worker "worker1" &
    local pid1=$!
    
    simulate_worker "worker2" &
    local pid2=$!
    
    simulate_worker "worker3" &
    local pid3=$!
    
    # BOSSも並列で調整
    coordinate_boss &
    local pid_boss=$!
    
    # 全プロセス待機
    wait $pid1 $pid2 $pid3 $pid_boss
    
    echo "✅ 並列実行完了"
}

# チーム状態表示
show_team_status() {
    echo "📊 チーム状態:"
    echo "============="
    
    echo "BOSS: $(cat "$BOSS_DIR/status.txt" 2>/dev/null || echo "offline")"
    for i in 1 2 3; do
        echo "Worker$i: $(cat "$TEAM_DIR/worker$i/status.txt" 2>/dev/null || echo "offline")"
    done
    
    echo ""
    echo "📬 未読メッセージ:"
    for agent in boss1 worker1 worker2 worker3 president; do
        local count=$(find "$MESSAGE_DIR/inbox/$agent" -name "*.msg" 2>/dev/null | wc -l)
        if [ $count -gt 0 ]; then
            echo "  $agent: $count 件"
        fi
    done
}

# メイン関数
main() {
    case "$1" in
        "init")
            init_team_system
            ;;
        "assign")
            if [ $# -lt 3 ]; then
                echo "使用方法: $0 assign <type> <description> [priority]"
                exit 1
            fi
            assign_task "$2" "$3" "$4"
            ;;
        "run")
            run_parallel
            ;;
        "status")
            show_team_status
            ;;
        "send")
            if [ $# -lt 4 ]; then
                echo "使用方法: $0 send <from> <to> <message>"
                exit 1
            fi
            send_message "$2" "$3" "$4"
            ;;
        *)
            echo "🏢 並列開発組織駆動システム"
            echo ""
            echo "使用方法:"
            echo "  $0 init                      - システム初期化"
            echo "  $0 assign <type> <desc> [pri] - タスク割り当て"
            echo "  $0 run                       - 並列実行"
            echo "  $0 status                    - チーム状態表示"
            echo "  $0 send <from> <to> <msg>    - メッセージ送信"
            echo ""
            echo "タイプ: infrastructure, code, testing, coordination"
            echo "優先度: high, medium, low"
            ;;
    esac
}

main "$@"