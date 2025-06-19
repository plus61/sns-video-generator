# Railway 環境変数設定ガイド

## 必須環境変数

Railway Dashboard > Variables で以下を設定:

### Supabase設定
```
NEXT_PUBLIC_SUPABASE_URL=https://mpviqmngxjcvvakylseg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmlxbW5neGpjdnZha3lsc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzE1MzMsImV4cCI6MjA2MzcwNzUzM30.2a-kxlhgjKMQhX1wC0NF7XTdROmwOnkgvV8J1Tq5l4w
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_FROM_ENV_LOCAL]
```

### OpenAI設定
```
OPENAI_API_KEY=[API_KEY_FROM_ENV_LOCAL]
```

### NextAuth設定
```
NEXTAUTH_URL=https://sns-video-generator-production.up.railway.app
NEXTAUTH_SECRET=[SECRET_FROM_ENV_LOCAL]
```

### Redis設定 (BullMQ用)
```
REDIS_URL=redis://default:password@redis-host:port
```

## オプション環境変数

### Production優化
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
USE_MOCK_DOWNLOADER=true
DISABLE_CANVAS=true
```

### ストレージ設定
```
RAILWAY_PUBLIC_URL=https://sns-video-generator-production.up.railway.app
```

### YouTube API (オプション)
```
YOUTUBE_API_KEY=[YOUR_YOUTUBE_API_KEY]
```

### Stripe (課金機能)
```
STRIPE_SECRET_KEY=[YOUR_STRIPE_SECRET_KEY]
STRIPE_WEBHOOK_SECRET=[YOUR_STRIPE_WEBHOOK_SECRET]
```

## Rails Service追加

1. Railway Dashboard > Services
2. "Add Service" > "Database" > "Redis"
3. Redis URLを上記のREDIS_URLに設定

## デプロイ確認手順

1. 環境変数設定完了後
2. GitHub Push (自動リビルド)
3. Railway Logs確認
4. Health Check: `/api/health`
5. CORS Test: Vercelからのアクセス確認