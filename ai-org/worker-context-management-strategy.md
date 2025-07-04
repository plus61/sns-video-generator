# ワーカー コンテキスト管理戦略

## 問題認識
- ワーカーの指示理解が低下
- 過去のコンテキストが混在し、現在のタスクに集中できない
- 複雑な指示が効果的に実行されない

## 推奨戦略：クリーンスレート方式

### ワーカーの理想的な動作モデル
```
Worker = 単一タスク処理装置
- 入力: 明確な単一タスク
- 処理: 集中的実行
- 出力: 完了報告
- リセット: 次のタスクへ
```

### 実装方法

#### 1. タスク指示の構造化
```bash
# 良い例：単一明確タスク
"Worker1: /simple ページにローディング表示を実装してください。
具体的には：
- .animate-spin クラスのスピナー追加
- 処理中は「処理中...」テキスト表示
- 完了後は自動的に非表示
ファイル: src/app/simple/page.tsx"

# 悪い例：複雑な背景説明
"Phase 2の一環として、ユーザー体験向上のため、
klap.appを超える製品を作るという目標の下で..."
```

#### 2. Boss1の役割強化
- 大きなビジョンをBoss1が保持
- ワーカーには具体的なタスクのみ伝達
- コンテキストはBoss1レベルで管理

#### 3. タスク完了後のリセット
- 各タスク完了後、ワーカーのコンテキストをクリア
- 新しいタスクは完全に独立した指示として送信

## 提案する運用フロー

```
President → Boss1: ビジョン・戦略
Boss1 → Worker: 単一明確タスク
Worker: 実行・完了報告
Boss1: 次のタスクを新規として送信
```

## メリット
1. **高い実行精度**: 単純明快な指示
2. **迅速な実行**: 迷いがない
3. **品質向上**: 一つのことに集中
4. **スケーラビリティ**: 並列処理可能

## デメリットと対策
- **デメリット**: 全体像の喪失
- **対策**: Boss1が全体像を管理し、適切に分解

## 即座の改善案

### Phase 2タスクの再構成
```
# Worker1向け
"src/app/simple/page.tsx にローディング表示を追加。
animate-spinクラスでスピナー実装。"

# Worker2向け  
"エラーメッセージを改善。
'処理に失敗しました' → '有効なYouTube URLを入力してください'"

# Worker3向け
"package.jsonのdevスクリプトに -p 3001 を追加"
```

各タスクは独立して実行可能で、前後の文脈不要。