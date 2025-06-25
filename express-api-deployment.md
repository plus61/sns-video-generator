# Express API デプロイメントガイド

## Render.com へのデプロイ手順

### 1. 準備
```bash
# package-express.json を package.json としてコピー
cp package-express.json package.json

# 必要なファイルのみを含む新しいGitリポジトリを作成
git init express-api
cd express-api
cp ../express-api-simple.js .
cp ../package.json .
cp ../render.yaml .
```

### 2. Render.com でのセットアップ
1. https://render.com でアカウント作成
2. New > Web Service を選択
3. GitHubリポジトリを接続
4. 以下の設定を適用:
   - Name: sns-video-express-api
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node express-api-simple.js`

### 3. 環境変数の設定
Render Dashboard で以下を設定:
```
NODE_ENV=production
EXPRESS_PORT=3002
CORS_ORIGIN=https://sns-video-generator.up.railway.app,https://sns-video-generator-production.up.railway.app
```

### 4. ヘルスチェック
デプロイ後、以下のURLでヘルスチェック:
```
https://your-app.onrender.com/health
```

## Railway へのデプロイ手順（代替案）

### 1. Railway CLI インストール
```bash
npm install -g @railway/cli
railway login
```

### 2. プロジェクト作成
```bash
railway init
railway add
```

### 3. デプロイ
```bash
railway up
```

### 4. 環境変数設定
```bash
railway variables set NODE_ENV=production
railway variables set EXPRESS_PORT=3002
```

## ローカルテスト

### 1. Express API 起動
```bash
EXPRESS_PORT=3002 node express-api-simple.js
```

### 2. 動作確認
```bash
# ヘルスチェック
curl http://localhost:3002/health

# YouTube ダウンロードテスト
curl -X POST http://localhost:3002/api/youtube-download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## トラブルシューティング

### CORS エラーが発生する場合
`express-api-simple.js` の `allowedOrigins` に本番URLを追加:
```javascript
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://your-frontend-url.com'
];
```

### メモリ不足エラー
Render.com の無料プランは512MBメモリ制限があります。
大きな動画を処理する場合は有料プランへのアップグレードを検討してください。

### FFmpeg エラー
Render.com では ffmpeg のインストールが必要です。
`render.yaml` に以下を追加:
```yaml
buildCommand: apt-get update && apt-get install -y ffmpeg && npm install
```