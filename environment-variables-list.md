# SNS Video Generator - 環境変数リスト

## 必須環境変数

### Supabase
```bash
# Supabase プロジェクトURL（公開可能）
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co

# Supabase 匿名キー（公開可能）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase サービスロールキー（秘密）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OpenAI
```bash
# OpenAI API キー（秘密）
OPENAI_API_KEY=sk-...
```

### NextAuth
```bash
# 本番環境のURL
NEXTAUTH_URL=https://your-project.railway.app

# NextAuth シークレット（秘密）
# 生成方法: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key-here
```

## オプション環境変数

### OAuth プロバイダー
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

### アプリケーション設定
```bash
# Node.js 環境
NODE_ENV=production

# アプリケーションポート
PORT=3000

# ホストネーム（Railway用）
HOSTNAME=0.0.0.0
```

### 開発環境用
```bash
# Next.js テレメトリー無効化
NEXT_TELEMETRY_DISABLED=1

# デバッグモード
DEBUG=false
```

## Railway 固有の環境変数

Railway が自動的に提供する環境変数：
```bash
# Railway プロジェクトID
RAILWAY_PROJECT_ID

# Railway 環境
RAILWAY_ENVIRONMENT

# デプロイメントID
RAILWAY_DEPLOYMENT_ID

# サービス名
RAILWAY_SERVICE_NAME

# 動的ポート（Railwayが自動設定）
PORT=${PORT}
```

## 環境変数の設定方法

### Railway ダッシュボード
1. プロジェクトを選択
2. "Variables" タブをクリック
3. "New Variable" で追加
4. 自動的に再デプロイ

### Railway CLI
```bash
railway variables set VARIABLE_NAME=value
```

### .env.local（開発用）
```bash
# .env.local ファイルに記載
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
# ... その他の変数
```

## セキュリティ注意事項

### 公開可能な変数
- `NEXT_PUBLIC_*` プレフィックスの変数
- これらはクライアントサイドでも使用される

### 秘密にすべき変数
- API キー（OpenAI, サービスロールキーなど）
- OAuth シークレット
- データベース認証情報
- JWT シークレット

### ベストプラクティス
1. 本番環境の秘密情報は Railway の環境変数で管理
2. 開発環境では `.env.local` を使用（gitignore に追加）
3. デフォルト値は設定しない（セキュリティリスク）
4. 定期的にキーをローテーション

## トラブルシューティング

### 環境変数が認識されない
1. Railway ダッシュボードで設定を確認
2. 変数名のタイポをチェック
3. 再デプロイを実行

### ビルド時エラー
- `NEXT_PUBLIC_*` 変数はビルド時に必要
- ダミー値でもビルドは可能（実行時に正しい値を設定）

### 実行時エラー
- サーバーサイドの変数が正しく設定されているか確認
- Railway ログで環境変数の読み込みを確認