# Railway Deployment - 全変更内容
実施日: 2025-06-25

## 変更ファイル一覧

### 1. Dockerfile.simple (修正)
- **変更内容**: yt-dlpのインストールを追加
- **理由**: YouTube動画ダウンロード機能の修復
```dockerfile
RUN apt-get install -y python3-pip && pip3 install yt-dlp
```

### 2. next.config.mjs (修正)
- **変更内容**: CORS headers設定を追加
- **理由**: Vercelフロントエンドからのアクセス許可
```javascript
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL || 'https://sns-video-generator.vercel.app' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
      { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
    ],
  }];
}
```

### 3. railway.toml (既存)
- **内容**: Dockerfile.simpleを使用するよう設定済み
- **ヘルスチェック**: /api/health/simple-health

### 4. nixpacks.toml (既存)
- **内容**: Standalone buildの設定済み
- **注**: 現在はDockerfile.simpleを使用

### 5. glitch.json (新規)
- **内容**: Glitchデプロイ用設定
- **用途**: 代替デプロイオプション

### 6. railway-api.config.js (新規)
- **内容**: Railway API専用設定
- **用途**: API-onlyサーバーとしての最適化

### 7. api-endpoints-normalized.md (新規)
- **内容**: 全APIエンドポイントのドキュメント
- **用途**: API仕様の明確化

## 環境変数要件

```bash
# 必須
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXTAUTH_URL=https://[your-project].railway.app
NEXTAUTH_SECRET=

# CORS用
FRONTEND_URL=https://sns-video-generator.vercel.app
```

## デプロイアーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Railway     │
│   (Frontend)    │     │   (API Server)  │
└─────────────────┘     └─────────────────┘
        │                        │
        └────────┬───────────────┘
                 │
         ┌───────▼────────┐
         │    Supabase    │
         │   (Database)   │
         └────────────────┘
```

## 解決された問題

1. **YouTube Download Error (ENOENT)**
   - 原因: yt-dlpバイナリ不在
   - 解決: Dockerfileにyt-dlpインストール追加

2. **CORS Error**
   - 原因: Cross-originリクエストのブロック
   - 解決: next.config.mjsにCORS headers追加

3. **Docker Build Error**
   - 原因: 複雑なmulti-stage build
   - 解決: シンプルなsingle-stage Dockerfile使用

## デプロイ手順

1. Git commit & push (git-commit-updated.sh実行)
2. Railway自動デプロイ待機
3. ヘルスチェック確認
4. Vercel frontendとの連携テスト