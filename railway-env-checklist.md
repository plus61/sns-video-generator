# Railway環境変数チェックリスト

## 📅 2025-06-23 月曜日 14:05

### ✅ 必須環境変数（Railway設定必要）

#### Supabase関連
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - 値: `https://mpviqmngxjcvvakylseg.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### OpenAI関連
- [ ] `OPENAI_API_KEY`
  - 値: `sk-proj-...`（セキュアに保管）

#### NextAuth関連
- [ ] `NEXTAUTH_URL`
  - 値: `https://your-app.up.railway.app`（Railway URL）
- [ ] `NEXTAUTH_SECRET`
  - 値: 本番用のランダム文字列生成

#### フラグ設定（重要）
- [ ] `DISABLE_BULLMQ`
  - 値: `true`（Redis不要）
- [ ] `USE_MOCK`
  - 値: `false`（実機能使用）
- [ ] `RAILWAY_ENVIRONMENT`
  - 値: `production`

### 🔧 オプション環境変数

#### YouTube関連
- [ ] `YOUTUBE_API_KEY`
  - 値: `AIzaSyBKJQpfTe_kiNZKAE2kB0Gdl8kubluCHVk`

#### パフォーマンス
- [ ] `ENABLE_METRICS`
  - 値: `true`
- [ ] `LOG_LEVEL`
  - 値: `info`

### ⚠️ 不要な環境変数（設定しない）

- ❌ `REDIS_URL`
- ❌ `REDIS_HOST`
- ❌ `REDIS_PORT`
- ❌ `REDIS_PASSWORD`
- ❌ OAuth関連（現時点では未使用）

### 📋 Railway設定手順

1. Railway ダッシュボードにログイン
2. プロジェクトの Variables タブを開く
3. 上記の必須環境変数を追加
4. Deploy タブで再デプロイ

### 🚀 デプロイ確認事項

- [ ] ヘルスチェック: `/api/health`
- [ ] シンプルUI: `/simple`
- [ ] API動作確認: `/api/process-simple`

### 💡 ポイント

- **シンプル化の徹底**: Redis/BullMQ無効化
- **実機能動作**: モック無効化
- **セキュリティ**: APIキーの適切な管理