# Worker1 作業手順

## 1. Supabase ストレージバケット作成手順（5分以内）

### 前提条件
- Supabaseプロジェクトにアクセス可能
- 管理者権限を持つアカウント

### 手順

#### Step 1: Supabase管理画面でSQL実行（3分）
1. Supabaseダッシュボードにログイン
2. 左側メニューから「SQL Editor」を選択
3. 新しいクエリを作成
4. 以下のコマンドで`create-storage-bucket.sql`の内容をコピー：
   ```bash
   cat /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace/create-storage-bucket.sql
   ```
5. SQLエディタに貼り付けて実行
6. 実行結果に以下のメッセージが表示されることを確認：
   - "Videos storage bucket created successfully!"
   - "RLS policies applied for user-specific folder access"

#### Step 2: バケット設定確認（2分）
1. 左側メニューから「Storage」を選択
2. 「videos」バケットが表示されることを確認
3. バケットの設定を確認：
   - Public: Yes
   - RLS Enabled: Yes
4. Policies タブで以下の4つのポリシーが存在することを確認：
   - Users can upload videos to own folder
   - Users can view own videos
   - Users can update own videos
   - Users can delete own videos

### 確認コマンド
```bash
# 環境変数の確認
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "Supabase URL is configured: $(test -n "$NEXT_PUBLIC_SUPABASE_URL" && echo "YES" || echo "NO")"
```

### トラブルシューティング
- バケットが既に存在する場合：エラーは無視して続行
- RLSポリシーのエラー：既存のポリシーを削除してから再実行
- 権限エラー：プロジェクトオーナーアカウントで実行

### 完了報告
```bash
echo "✅ Supabase storage bucket 'videos' created and configured" > /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace/ai-org/worker1/status.txt
```