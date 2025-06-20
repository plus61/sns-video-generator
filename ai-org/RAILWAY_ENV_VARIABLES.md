# Railway 環境変数設定ガイド

## 必須環境変数（最小限の動作に必要）

### 1. Supabase（データベース・認証）
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. NextAuth（認証システム）
```bash
NEXTAUTH_URL=https://sns-video-generator-production.up.railway.app
NEXTAUTH_SECRET=your_nextauth_secret_key  # openssl rand -base64 32 で生成
```

### 3. OpenAI（AI機能）
```bash
OPENAI_API_KEY=sk-your_openai_api_key
```

### 4. Redis（キューシステム）
```bash
REDIS_URL=redis://default:password@host:6379
# またはRailwayのRedisアドオンを使用
```

### 5. 本番環境設定
```bash
NODE_ENV=production
```

## オプション環境変数（SNS連携用）

### Google OAuth（ログイン機能）
```bash
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### YouTube API（動画アップロード）
```bash
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CLIENT_ID=your_youtube_api_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_api_client_secret
```

### その他のSNS（将来の機能拡張用）
```bash
# TikTok
TIKTOK_CLIENT_ID=your_tiktok_api_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_api_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_api_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_api_client_secret

# Twitter/X
TWITTER_CLIENT_ID=your_twitter_api_client_id
TWITTER_CLIENT_SECRET=your_twitter_api_client_secret
```

## Railway での設定方法

1. Railway ダッシュボードにアクセス
2. サービスを選択
3. "Variables" タブをクリック
4. "RAW Editor" または個別に追加
5. "Deploy" ボタンで再デプロイ

## 優先順位

### Phase 1（基本動作）
1. Supabase関連（3つ）
2. NextAuth関連（2つ）
3. NODE_ENV=production

### Phase 2（AI機能）
1. OPENAI_API_KEY
2. REDIS_URL（または DISABLE_BULLMQ=true）

### Phase 3（SNS連携）
1. Google OAuth
2. YouTube API
3. その他SNS

## 注意事項

- NEXTAUTH_URLは必ずRailwayのURLに設定
- NEXTAUTH_SECRETは必ず強力なランダム文字列に
- APIキーは本番用を使用（無料枠に注意）
- Redisは Railway のアドオンを使うと簡単