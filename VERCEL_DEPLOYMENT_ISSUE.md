# Vercelデプロイメント問題と解決策

## 🚨 問題の概要

GitHubには最新コードがプッシュされているが、Vercelのデプロイメントで401エラーが発生している。

## 📊 調査結果

### GitHub状態
- ✅ 最新コミット: `325e339` "Fix authentication redirect flow after sign-in"
- ✅ 認証フロー修正済み
- ✅ 環境変数設定ガイド作成済み

### Vercel状態
- ❌ 401 Unauthorized エラー
- ❌ 環境変数が未設定の可能性大

## 🔧 必要な対応

### 1. Vercel環境変数の設定（最優先）

Vercelダッシュボードで以下の環境変数を設定してください：

```bash
# 必須設定
NEXTAUTH_URL=https://sns-video-generator-burtegpwi-plus62s-projects.vercel.app
NEXTAUTH_SECRET=（32文字以上のランダムな文字列を生成）

# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=（Supabaseプロジェクトから取得）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabaseプロジェクトから取得）
SUPABASE_SERVICE_ROLE_KEY=（Supabaseプロジェクトから取得）

# OAuth設定（オプション - 使用する場合のみ）
GOOGLE_CLIENT_ID=（Google Cloud Consoleから取得）
GOOGLE_CLIENT_SECRET=（Google Cloud Consoleから取得）
GITHUB_ID=（GitHub OAuth Appから取得）
GITHUB_SECRET=（GitHub OAuth Appから取得）

# OpenAI設定（動画処理機能用）
OPENAI_API_KEY=（OpenAIから取得）
```

### 2. NEXTAUTH_SECRET生成方法

ターミナルで以下のコマンドを実行：
```bash
openssl rand -base64 32
```

### 3. Vercelでの設定手順

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクト `sns-video-generator` を選択
3. **Settings** タブをクリック
4. **Environment Variables** セクションを開く
5. 上記の環境変数を一つずつ追加
6. **Save** をクリック
7. **Deployments** タブから最新のデプロイメントを **Redeploy**

### 4. CORS設定の修正（実施済み）

✅ `vercel.json` のCORS設定を正しいURLに更新済み

## 🎯 期待される結果

環境変数設定後：
1. 401エラーが解消される
2. サインインページが正常に表示される
3. 認証後、ダッシュボードへ適切にリダイレクトされる

## ⚠️ 重要な注意点

- `NEXTAUTH_URL` は必ず完全なURLを設定（httpsから始まる）
- `NEXTAUTH_SECRET` は本番環境では必ず強力なランダム文字列を使用
- Supabase関連の環境変数はSupabaseダッシュボードの**Settings > API**から取得
- 環境変数設定後は必ず再デプロイが必要