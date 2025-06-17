# Vercel環境変数設定ガイド

## 認証問題解決のための重要な環境変数

以下の環境変数をVercelのプロジェクト設定で追加してください：

### 1. NextAuth.js設定（必須）
```
NEXTAUTH_URL=https://sns-video-generator-burtegpwi-plus62s-projects.vercel.app
NEXTAUTH_SECRET=（32文字以上のランダムな文字列）
```

**NEXTAUTH_SECRET生成方法:**
```bash
openssl rand -base64 32
```

### 2. Supabase設定（必須）
```
NEXT_PUBLIC_SUPABASE_URL=（Supabaseプロジェクトのプロジェクト）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabaseのanonキー）
SUPABASE_SERVICE_ROLE_KEY=（Supabaseのservice_roleキー）
```

### 3. OAuth設定（オプション）
```
GOOGLE_CLIENT_ID=（GoogleのOAuth Client ID）
GOOGLE_CLIENT_SECRET=（GoogleのOAuth Client Secret）
GITHUB_ID=（GitHubのOAuth App ID）
GITHUB_SECRET=（GitHubのOAuth App Secret）
```

### 4. OpenAI設定（動画処理に必要）
```
OPENAI_API_KEY=（OpenAIのAPIキー）
```

## Vercelでの設定手順

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 上記の環境変数を追加
5. デプロイを再実行

## 重要な注意点

- `NEXTAUTH_URL` は必ずデプロイされたURLを正確に設定すること
- プレビューデプロイとプロダクションで異なるURLになる場合があるので注意
- `NEXTAUTH_SECRET` は本番環境では必ず強力なランダム文字列を使用すること

## トラブルシューティング

もし認証が正常に動作しない場合：

1. ブラウザのDevToolsでコンソールエラーを確認
2. Network タブで `/api/auth/session` のレスポンスを確認
3. Vercelのファンクションログを確認