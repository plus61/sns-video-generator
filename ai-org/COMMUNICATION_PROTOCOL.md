# 📡 President-BOSS 通信プロトコル

## 目的
President と BOSS 間の連携齟齬を防ぎ、円滑なコミュニケーションを確保する

## 通信フロー

### 1. President → BOSS（指示）
```
1. President が指示を送信
2. BOSS が受信確認を返信（30秒以内）
3. BOSS が理解内容の要約を返信
4. President が承認/修正
```

### 2. BOSS → President（レポート）
```
1. BOSS がレポートを送信
2. President が受信確認（必須）
3. President がフィードバックを送信（2分以内）
4. BOSS が次のアクションを開始
```

## レポートタイプと対応

### 進捗レポート
- **内容**: Worker状態、完了タスク数
- **President対応**: 承認メッセージ + 継続指示

### 完了レポート
- **内容**: タスク完了、成果物
- **President対応**: 評価 + 次タスクの指示

### エラーレポート
- **内容**: 問題発生、対応策提案
- **President対応**: 判断 + 具体的指示

### 提案レポート
- **内容**: 新アイデア、改善案
- **President対応**: 承認/却下 + 理由

## タイムアウト対策

- BOSS待機時間: 最大5分
- 5分経過後: BOSS は自律判断で次へ進む
- President は後追いでフィードバック可能

## ステータス管理

### BOSS ステータス
- `idle`: 待機中
- `coordinating`: 調整中
- `waiting_feedback`: フィードバック待ち
- `executing`: 実行中

### 自動遷移
- `waiting_feedback` → 5分後 → `executing`（自律実行）

## 実装例

```bash
# President がレポート受信時
./agent-send.sh boss1 "レポート確認。[具体的フィードバック]。継続してください。"

# BOSS が待機タイムアウト時
echo "President応答なし。自律判断で継続。" >> boss_decision.log
```