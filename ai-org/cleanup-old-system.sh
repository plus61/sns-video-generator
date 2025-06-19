#!/bin/bash
# 古いチームシステムのクリーンアップスクリプト

echo "🧹 古いチームシステムのクリーンアップを開始..."

# バックアップディレクトリ作成
BACKUP_DIR="./old-team-system-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 削除対象のファイル
OLD_FILES=(
    "boss-brain.sh"
    "boss-brain-demo.md"
    "BOSS_BRAIN_GUIDE.md"
    "quick-response-setup.sh"
    "response-monitor.sh"
    "response-monitor-v2.sh"
    "response-monitor.pid"
    "send-response.sh"
    "RESPONSE_GUIDE.md"
    "agent-send.sh"
    "BIDIRECTIONAL_COMMUNICATION_DESIGN.md"
    "emergency-backup-*.txt"
)

# 削除対象のディレクトリ
OLD_DIRS=(
    "messages/outbox"
    "messages/processed"
    "messages/inbox"
    "boss1"
    "worker1"
    "worker2"
    "worker3"
    "president"
)

# ファイルのバックアップと削除
for file in "${OLD_FILES[@]}"; do
    if ls $file 1> /dev/null 2>&1; then
        echo "📦 バックアップ: $file"
        mv $file "$BACKUP_DIR/" 2>/dev/null
    fi
done

# ディレクトリのバックアップと削除
for dir in "${OLD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "📦 バックアップ: $dir"
        mv "$dir" "$BACKUP_DIR/" 2>/dev/null
    fi
done

# 保持するファイル
echo ""
echo "✅ 以下のファイルは保持されます:"
echo "  - team-task-manager.sh (新システム)"
echo "  - TEAM_SYSTEM_REDESIGN.md (設計書)"
echo "  - logs/send_log.txt (履歴として)"
echo "  - progress-monitor.sh (プロジェクト進捗管理)"
echo "  - build-monitor.sh (ビルド監視)"
echo "  - verify-fix.sh (検証スクリプト)"

echo ""
echo "🗄️ バックアップ完了: $BACKUP_DIR"
echo "⚠️  不要と判断したら以下で削除できます:"
echo "    rm -rf $BACKUP_DIR"