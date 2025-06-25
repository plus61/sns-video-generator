# 自律システム改善計画

## 🔍 拡張思考による問題診断

### 現在の問題点

1. **複雑化による機能不全**
   - agent-send.shが1300行以上の巨大スクリプト
   - TMux、ファイル、複数の通信方式が混在
   - 自律判断ロジックが複雑すぎて基本動作を阻害

2. **ステータス管理の不安定性**
   - status.txtが頻繁に空になる
   - 複数のプロセスが同じファイルを更新
   - 同期メカニズムの欠如

3. **監視システムの停止**
   - monitor-boss-inbox.shが実行されていない
   - TMuxセッションの状態が不明
   - 自律実行のトリガーが機能していない

## 🛠️ シンプルな改善策

### Phase 1: 基本機能の復活（即座）

```bash
# 1. ステータス初期化
echo "idle" > boss1/status.txt
echo "idle" > worker1/status.txt
echo "idle" > worker2/status.txt
echo "idle" > worker3/status.txt

# 2. シンプルなメッセージ送信
echo "Railway統合タスク" > messages/inbox/worker1/task.msg
```

### Phase 2: 監視システムの簡素化

1. **単一の監視プロセス**
   - ファイルベース通信に統一
   - TMux依存を削除
   - シンプルなポーリング方式

2. **明確な実行フロー**
   ```
   President → Boss1 → Worker
   ↓           ↓        ↓
   指示      分配     実行
   ↓           ↓        ↓
   報告 ← 統括 ← 完了報告
   ```

### Phase 3: 実装提案

```bash
#!/bin/bash
# ultra-simple-monitor.sh

while true; do
    # Boss1のタスクをチェック
    if [ -f "inbox/boss1/task.msg" ]; then
        task=$(cat inbox/boss1/task.msg)
        
        # ワーカーに振り分け
        if [[ "$task" =~ "Railway" ]]; then
            echo "$task" > inbox/worker1/task.msg
        elif [[ "$task" =~ "UI" ]]; then
            echo "$task" > inbox/worker2/task.msg
        else
            echo "$task" > inbox/worker3/task.msg
        fi
        
        rm inbox/boss1/task.msg
    fi
    
    sleep 1
done
```

## 📊 期待される効果

1. **即座の動作回復**
   - 基本的な指示→実行フローの復活
   - 確実なタスク配信

2. **保守性の向上**
   - シンプルなコードで理解容易
   - デバッグが簡単

3. **拡張性の確保**
   - 必要に応じて機能追加可能
   - 段階的な改善が可能

## 🎯 実行計画

1. **即時対応（5分）**
   - ステータスファイル初期化
   - シンプル監視スクリプト作成
   - テストメッセージ送信

2. **短期改善（30分）**
   - agent-send.shの簡素版作成
   - 統一された通信方式実装
   - 基本的な自律実行確認

3. **長期計画（将来）**
   - 必要最小限の機能のみ実装
   - KISS原則の徹底
   - 段階的な機能追加