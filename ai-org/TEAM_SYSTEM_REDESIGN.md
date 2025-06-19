# チームシステム再設計計画

## 現状の問題点

### 1. 疑似的な通信
- 実際のプロセス間通信なし
- 単なるログファイルへの書き込み
- AIエージェントの実体なし

### 2. 複雑すぎる構造
- boss-brain.sh: 200行以上の複雑なスクリプト
- 多数の監視スクリプトが存在するが機能していない
- tmuxセッションベースの通信（実際には動作せず）

### 3. 実用性の欠如
- 実際の作業は全てPresidentが実行
- チーム通信のオーバーヘッドが大きい
- 価値を生まない複雑性

## 新しい設計：実用的なタスク管理システム

### コンセプト
**「チーム」ではなく「役割ベースの思考フレームワーク」**

### 実装案

```bash
#!/bin/bash
# team-task-manager.sh - 実用的なタスク管理システム

TASK_DIR="./tasks"
TASK_LOG="./tasks/task_log.md"

# タスクの作成
create_task() {
    local priority="$1"  # high, medium, low
    local category="$2"  # infrastructure, code, testing, documentation
    local description="$3"
    local task_id=$(date +%s)
    
    cat > "$TASK_DIR/$task_id.task" << EOF
{
    "id": "$task_id",
    "priority": "$priority",
    "category": "$category",
    "description": "$description",
    "status": "pending",
    "created": "$(date)",
    "assigned_role": "$(assign_role $category)"
}
EOF
    
    echo "✅ タスク作成: $task_id - $description"
}

# 役割に基づく自動割り当て
assign_role() {
    local category="$1"
    case $category in
        "infrastructure") echo "DevOps思考" ;;
        "code") echo "開発者思考" ;;
        "testing") echo "QA思考" ;;
        "documentation") echo "技術ライター思考" ;;
        *) echo "総合思考" ;;
    esac
}

# タスクの実行（役割ベースの思考）
execute_task() {
    local task_id="$1"
    local task_file="$TASK_DIR/$task_id.task"
    
    if [ ! -f "$task_file" ]; then
        echo "❌ タスクが見つかりません: $task_id"
        return 1
    fi
    
    local role=$(jq -r '.assigned_role' "$task_file")
    local description=$(jq -r '.description' "$task_file")
    
    echo "🎭 $role モードで実行: $description"
    
    # 実際の作業はPresidentが役割を意識して実行
    case $role in
        "DevOps思考")
            echo "📦 インフラ最適化の観点で分析..."
            ;;
        "開発者思考")
            echo "💻 コード品質とアーキテクチャの観点で分析..."
            ;;
        "QA思考")
            echo "🧪 テスト網羅性とエッジケースの観点で分析..."
            ;;
        "技術ライター思考")
            echo "📝 明確性と完全性の観点で分析..."
            ;;
    esac
    
    # タスク完了
    update_task_status "$task_id" "completed"
}

# タスクステータス更新
update_task_status() {
    local task_id="$1"
    local new_status="$2"
    local task_file="$TASK_DIR/$task_id.task"
    
    jq ".status = \"$new_status\" | .updated = \"$(date)\"" "$task_file" > "$task_file.tmp"
    mv "$task_file.tmp" "$task_file"
    
    # ログに記録
    echo "- [$(date)] タスク $task_id: $new_status" >> "$TASK_LOG"
}

# タスクリスト表示
list_tasks() {
    echo "📋 現在のタスク一覧:"
    echo "========================"
    
    for task_file in "$TASK_DIR"/*.task 2>/dev/null; do
        if [ -f "$task_file" ]; then
            local id=$(jq -r '.id' "$task_file")
            local priority=$(jq -r '.priority' "$task_file")
            local status=$(jq -r '.status' "$task_file")
            local description=$(jq -r '.description' "$task_file")
            local role=$(jq -r '.assigned_role' "$task_file")
            
            printf "%-10s %-8s %-10s %-15s %s\n" \
                "$id" "$priority" "$status" "$role" "$description"
        fi
    done
}

# メイン関数
main() {
    mkdir -p "$TASK_DIR"
    
    case "$1" in
        "create")
            create_task "$2" "$3" "$4"
            ;;
        "execute")
            execute_task "$2"
            ;;
        "list")
            list_tasks
            ;;
        "status")
            update_task_status "$2" "$3"
            ;;
        *)
            echo "使用方法:"
            echo "  $0 create <priority> <category> <description>"
            echo "  $0 execute <task_id>"
            echo "  $0 list"
            echo "  $0 status <task_id> <new_status>"
            ;;
    esac
}

main "$@"
```

## 利点

1. **シンプル**: 複雑な通信システムなし
2. **実用的**: 実際のタスク管理に焦点
3. **柔軟**: 役割ベースの思考フレームワーク
4. **追跡可能**: タスクの履歴とステータス管理

## 移行計画

1. 既存の複雑なスクリプトを段階的に廃止
2. team-task-manager.shを中心とした運用に移行
3. 役割ベースの思考を明確化
4. タスクの自動化と効率化を進める