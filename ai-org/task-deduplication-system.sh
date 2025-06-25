#!/bin/bash

# タスク重複防止システム
# 完了済みタスクの再実行を防ぎ、効率的なタスク管理を実現

TASK_DB_DIR="./task-database"
COMPLETED_TASKS_DB="$TASK_DB_DIR/completed-tasks.json"
ACTIVE_TASKS_DB="$TASK_DB_DIR/active-tasks.json"
TASK_HASH_DB="$TASK_DB_DIR/task-hashes.txt"

# 初期化
initialize_task_db() {
    mkdir -p "$TASK_DB_DIR"
    
    # 初期JSONファイル作成
    [ ! -f "$COMPLETED_TASKS_DB" ] && echo '[]' > "$COMPLETED_TASKS_DB"
    [ ! -f "$ACTIVE_TASKS_DB" ] && echo '[]' > "$ACTIVE_TASKS_DB"
    [ ! -f "$TASK_HASH_DB" ] && touch "$TASK_HASH_DB"
    
    echo "✅ タスクデータベース初期化完了"
}

# タスクハッシュ生成（内容ベース）
generate_task_hash() {
    local task_content="$1"
    # タスク内容から空白と改行を除去してハッシュ生成
    echo "$task_content" | tr -d ' \n' | shasum -a 256 | cut -d' ' -f1
}

# タスクの重複チェック
is_duplicate_task() {
    local task_content="$1"
    local task_hash=$(generate_task_hash "$task_content")
    
    # ハッシュデータベースで確認
    if grep -q "^$task_hash" "$TASK_HASH_DB"; then
        echo "⚠️  重複タスク検出: $task_hash"
        return 0  # 重複あり
    fi
    
    return 1  # 重複なし
}

# タスクを完了済みとして記録
mark_task_completed() {
    local task_id="$1"
    local task_content="$2"
    local worker="$3"
    local completion_time=$(date '+%Y-%m-%d %H:%M:%S')
    local task_hash=$(generate_task_hash "$task_content")
    
    # 完了タスクをJSONに追加
    local completed_task=$(cat <<EOF
{
    "id": "$task_id",
    "hash": "$task_hash",
    "content": "$task_content",
    "worker": "$worker",
    "completed_at": "$completion_time"
}
EOF
)
    
    # 完了タスクDBに追加
    jq ". += [$completed_task]" "$COMPLETED_TASKS_DB" > "$COMPLETED_TASKS_DB.tmp"
    mv "$COMPLETED_TASKS_DB.tmp" "$COMPLETED_TASKS_DB"
    
    # ハッシュDBに追加
    echo "$task_hash|$task_id|$completion_time" >> "$TASK_HASH_DB"
    
    # アクティブタスクから削除
    jq "map(select(.id != \"$task_id\"))" "$ACTIVE_TASKS_DB" > "$ACTIVE_TASKS_DB.tmp"
    mv "$ACTIVE_TASKS_DB.tmp" "$ACTIVE_TASKS_DB"
    
    echo "✅ タスク完了記録: $task_id"
}

# 新規タスク作成（重複チェック付き）
create_task_safe() {
    local task_content="$1"
    local assignee="$2"
    local priority="${3:-medium}"
    
    # 重複チェック
    if is_duplicate_task "$task_content"; then
        echo "❌ タスク作成失敗: 既に同じ内容のタスクが存在します"
        return 1
    fi
    
    # タスクID生成
    local task_id="task_$(date +%s%N)"
    local task_hash=$(generate_task_hash "$task_content")
    
    # アクティブタスクに追加
    local new_task=$(cat <<EOF
{
    "id": "$task_id",
    "hash": "$task_hash",
    "content": "$task_content",
    "assignee": "$assignee",
    "priority": "$priority",
    "status": "pending",
    "created_at": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
)
    
    jq ". += [$new_task]" "$ACTIVE_TASKS_DB" > "$ACTIVE_TASKS_DB.tmp"
    mv "$ACTIVE_TASKS_DB.tmp" "$ACTIVE_TASKS_DB"
    
    echo "✅ 新規タスク作成: $task_id → $assignee"
    echo "$task_id"
}

# 既存タスクの移行
migrate_existing_tasks() {
    echo "🔄 既存タスクの移行開始..."
    
    # 各ワーカーディレクトリのタスクを確認
    for worker_dir in boss1 worker1 worker2 worker3; do
        if [ -d "$worker_dir/tasks" ]; then
            for task_file in "$worker_dir/tasks"/*.task.done; do
                if [ -f "$task_file" ]; then
                    local task_content=$(cat "$task_file" 2>/dev/null | jq -r '.description // .task // empty' 2>/dev/null)
                    if [ -n "$task_content" ]; then
                        local task_id=$(basename "$task_file" .task.done)
                        mark_task_completed "$task_id" "$task_content" "$worker_dir"
                    fi
                fi
            done
        fi
    done
    
    echo "✅ 既存タスクの移行完了"
}

# タスク統計情報
show_task_stats() {
    local completed_count=$(jq 'length' "$COMPLETED_TASKS_DB")
    local active_count=$(jq 'length' "$ACTIVE_TASKS_DB")
    local unique_hashes=$(cut -d'|' -f1 "$TASK_HASH_DB" | sort -u | wc -l)
    
    echo "📊 タスク統計情報"
    echo "  完了タスク数: $completed_count"
    echo "  アクティブタスク数: $active_count"
    echo "  ユニークタスク数: $unique_hashes"
}

# Boss/Worker統合関数
safe_assign_task() {
    local worker="$1"
    local task_content="$2"
    local priority="${3:-medium}"
    
    # 重複チェック付きでタスク作成
    local task_id=$(create_task_safe "$task_content" "$worker" "$priority")
    
    if [ -n "$task_id" ]; then
        # 実際のタスク送信
        ./agent-send.sh "$worker" "$task_content"
        return 0
    else
        echo "⚠️  タスク割り当てスキップ: 重複または既に完了済み"
        return 1
    fi
}

# メイン処理
case "$1" in
    "init")
        initialize_task_db
        migrate_existing_tasks
        ;;
    "check")
        is_duplicate_task "$2"
        ;;
    "complete")
        mark_task_completed "$2" "$3" "$4"
        ;;
    "create")
        create_task_safe "$2" "$3" "$4"
        ;;
    "assign")
        safe_assign_task "$2" "$3" "$4"
        ;;
    "stats")
        show_task_stats
        ;;
    *)
        echo "使用方法:"
        echo "  $0 init                     - データベース初期化"
        echo "  $0 check <task_content>     - タスク重複チェック"
        echo "  $0 complete <id> <content> <worker> - タスク完了記録"
        echo "  $0 create <content> <assignee> [priority] - タスク作成"
        echo "  $0 assign <worker> <content> [priority] - 安全なタスク割り当て"
        echo "  $0 stats                    - 統計情報表示"
        ;;
esac