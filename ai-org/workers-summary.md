# ワーカー作業手順まとめ

## 概要
3つのワーカーが並行して以下の作業を実行します。各作業は5分以内で完了可能です。

## Worker1: Supabaseストレージバケット作成
**目的**: 動画ファイルを保存するためのストレージバケットを作成

**作業内容**:
1. Supabase SQL Editorで`create-storage-bucket.sql`を実行
2. videosバケットとRLSポリシーの作成確認
3. ユーザー別フォルダアクセス制御の設定

**成果物**: 
- videosストレージバケット（公開、RLS有効）
- 4つのアクセス制御ポリシー

## Worker2: 開発環境の修復
**目的**: TypeScript依存関係の解決とビルドエラーの修正

**作業内容**:
1. TypeScript関連パッケージのインストール
2. ビルドプロセスの検証
3. 開発サーバーの起動確認

**成果物**:
- TypeScript開発環境の復旧
- エラーなしのビルド成功
- localhost:3000での開発サーバー起動

## Worker3: YouTube取得機能のテスト
**目的**: YouTube動画取得APIの動作確認

**作業内容**:
1. モックモードでの基本動作確認
2. 実際のYouTube URLでの取得テスト
3. エラーハンドリングの検証

**成果物**:
- YouTube API エンドポイントの動作確認
- モック/実環境両方での成功確認
- 適切なエラーレスポンスの確認

## 実行コマンド

### 各ワーカーの作業開始
```bash
# Worker1
cat ai-org/worker1/instructions.md

# Worker2
cat ai-org/worker2/instructions.md

# Worker3
cat ai-org/worker3/instructions.md
```

### 進捗確認
```bash
# 各ワーカーのステータス確認
watch -n 5 'echo "=== Worker Status ===" && \
  echo -n "Worker1: " && cat ai-org/worker1/status.txt && \
  echo -n "Worker2: " && cat ai-org/worker2/status.txt && \
  echo -n "Worker3: " && cat ai-org/worker3/status.txt'
```

### 完了確認
```bash
# 全作業の完了確認
if grep -q "✅" ai-org/worker1/status.txt && \
   grep -q "✅" ai-org/worker2/status.txt && \
   grep -q "✅" ai-org/worker3/status.txt; then
  echo "🎉 All workers completed successfully!"
else
  echo "⏳ Workers still in progress..."
fi
```

## 依存関係
- Worker3はWorker2の完了を待つ必要があります（開発環境が必要）
- Worker1は独立して実行可能です

## トラブルシューティング
各作業手順書の「トラブルシューティング」セクションを参照してください。