#!/bin/bash
# team-task-manager.sh - 実用的なタスク管理システム

TASK_DIR="./tasks"
TASK_LOG="./tasks/task_log.md"

# タスクの作成
create_task() {
    local priority="$1"  # high, medium, low
    local category="$2"  # infrastructure, code, testing, documentation
    local description="$3"
    
    # タスク重複チェック
    if [ -f "./task-deduplication-system.sh" ]; then
        ./task-deduplication-system.sh check "$description"
        if [ $? -eq 0 ]; then
            echo "⚠️  タスク作成スキップ: 既に同じ内容のタスクが存在します"
            return 1
        fi
    fi
    
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
            echo "- デプロイメント設定の確認"
            echo "- 環境変数の管理"
            echo "- ビルドプロセスの最適化"
            ;;
        "開発者思考")
            echo "💻 コード品質とアーキテクチャの観点で分析..."
            echo "- コードの可読性と保守性"
            echo "- アーキテクチャパターンの適用"
            echo "- パフォーマンス最適化"
            ;;
        "QA思考")
            echo "🧪 テスト網羅性とエッジケースの観点で分析..."
            echo "- テストカバレッジの確認"
            echo "- エッジケースの特定"
            echo "- 統合テストの設計"
            ;;
        "技術ライター思考")
            echo "📝 明確性と完全性の観点で分析..."
            echo "- ドキュメントの構造化"
            echo "- 例とベストプラクティスの追加"
            echo "- 読者視点での改善"
            ;;
    esac
    
    # タスク開始
    update_task_status "$task_id" "in_progress"
}

# タスクステータス更新
update_task_status() {
    local task_id="$1"
    local new_status="$2"
    local task_file="$TASK_DIR/$task_id.task"
    
    if [ ! -f "$task_file" ]; then
        echo "❌ タスクが見つかりません: $task_id"
        return 1
    fi
    
    # jqがない場合の代替処理
    if command -v jq &> /dev/null; then
        jq ".status = \"$new_status\" | .updated = \"$(date)\"" "$task_file" > "$task_file.tmp"
        mv "$task_file.tmp" "$task_file"
    else
        # sedで簡易的に更新
        sed -i.bak "s/\"status\": \"[^\"]*\"/\"status\": \"$new_status\"/" "$task_file"
        rm "$task_file.bak"
    fi
    
    # ログに記録
    echo "- [$(date)] タスク $task_id: $new_status" >> "$TASK_LOG"
}

# タスクリスト表示
list_tasks() {
    echo "📋 現在のタスク一覧:"
    echo "========================================================================="
    printf "%-12s %-8s %-12s %-15s %s\n" "ID" "優先度" "ステータス" "役割" "説明"
    echo "-------------------------------------------------------------------------"
    
    for task_file in "$TASK_DIR"/*.task; do
        if [ -f "$task_file" ]; then
            if command -v jq &> /dev/null; then
                local id=$(jq -r '.id' "$task_file")
                local priority=$(jq -r '.priority' "$task_file")
                local status=$(jq -r '.status' "$task_file")
                local description=$(jq -r '.description' "$task_file")
                local role=$(jq -r '.assigned_role' "$task_file")
            else
                # grepで簡易的に抽出
                local id=$(grep -o '"id": "[^"]*"' "$task_file" | cut -d'"' -f4)
                local priority=$(grep -o '"priority": "[^"]*"' "$task_file" | cut -d'"' -f4)
                local status=$(grep -o '"status": "[^"]*"' "$task_file" | cut -d'"' -f4)
                local description=$(grep -o '"description": "[^"]*"' "$task_file" | cut -d'"' -f4)
                local role=$(grep -o '"assigned_role": "[^"]*"' "$task_file" | cut -d'"' -f4)
            fi
            
            # ステータスに応じて色付け
            case $status in
                "completed") status_color="\033[0;32m$status\033[0m" ;;
                "in_progress") status_color="\033[0;33m$status\033[0m" ;;
                "pending") status_color="\033[0;36m$status\033[0m" ;;
                *) status_color="$status" ;;
            esac
            
            printf "%-12s %-8s %-12b %-15s %s\n" \
                "$id" "$priority" "$status_color" "$role" "$description"
        fi
    done
}

# タスク完了
complete_task() {
    local task_id="$1"
    local notes="$2"
    
    update_task_status "$task_id" "completed"
    
    if [ -n "$notes" ]; then
        echo "📝 完了メモ: $notes" >> "$TASK_LOG"
    fi
    
    echo "✅ タスク $task_id を完了しました"
}

# メイン関数
main() {
    mkdir -p "$TASK_DIR"
    
    case "$1" in
        "create")
            if [ $# -lt 4 ]; then
                echo "使用方法: $0 create <priority> <category> <description>"
                echo "例: $0 create high infrastructure 'Dockerfileの最適化'"
                exit 1
            fi
            create_task "$2" "$3" "$4"
            ;;
        "execute")
            if [ $# -lt 2 ]; then
                echo "使用方法: $0 execute <task_id>"
                exit 1
            fi
            execute_task "$2"
            ;;
        "complete")
            if [ $# -lt 2 ]; then
                echo "使用方法: $0 complete <task_id> [notes]"
                exit 1
            fi
            complete_task "$2" "$3"
            ;;
        "list")
            list_tasks
            ;;
        "status")
            if [ $# -lt 3 ]; then
                echo "使用方法: $0 status <task_id> <new_status>"
                exit 1
            fi
            update_task_status "$2" "$3"
            ;;
        *)
            echo "🎯 チームタスク管理システム"
            echo ""
            echo "使用方法:"
            echo "  $0 create <priority> <category> <description>  - 新規タスク作成"
            echo "  $0 execute <task_id>                           - タスク実行開始"
            echo "  $0 complete <task_id> [notes]                  - タスク完了"
            echo "  $0 list                                        - タスク一覧表示"
            echo "  $0 status <task_id> <new_status>              - ステータス更新"
            echo ""
            echo "優先度: high, medium, low"
            echo "カテゴリ: infrastructure, code, testing, documentation"
            echo "ステータス: pending, in_progress, completed"
            ;;
    esac
}

main "$@"