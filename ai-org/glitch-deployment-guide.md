# Glitch.com 即時デプロイガイド

## 5分デプロイ手順

### 1. プロジェクト作成（1分）
1. https://glitch.com にアクセス
2. "New Project" → "Import from GitHub"
3. リポジトリURL: `https://github.com/plus61/sns-video-generator`

### 2. 必須ファイル作成（2分）

**glitch.json作成**:
```json
{
  "install": {
    "include": [
      "^package\\.json$"
    ]
  },
  "start": {
    "include": [
      "^express-api-simple\\.js$"
    ]
  },
  "watch": {
    "throttle": 1000
  }
}
```

**package.json調整**:
```json
{
  "scripts": {
    "start": "node express-api-simple.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 3. 環境変数設定（1分）
`.env`ファイル:
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://sns-video-generator.up.railway.app,https://sns-video-generator-production.up.railway.app
```

### 4. 必須修正（1分）

**express-api-simple.js修正**:
```javascript
// CORS設定にGlitch URLを追加
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://sns-video-generator.up.railway.app',
  'https://sns-video-generator-production.up.railway.app',
  'https://*.glitch.me',  // Glitch用
  process.env.CORS_ORIGIN?.split(',') || []
].flat();
```

### 5. デプロイ確認
- プロジェクトURL: `https://[project-name].glitch.me`
- ヘルスチェック: `https://[project-name].glitch.me/health`

## トラブルシューティング

**FFmpegエラーの場合**:
```bash
# Glitchコンソールで実行
npm install ffmpeg-static --save
```

**メモリエラーの場合**:
```javascript
// express-api-simple.jsに追加
process.env.NODE_OPTIONS = '--max-old-space-size=512';
```

## 成功確認
```bash
curl https://[project-name].glitch.me/health
# {"status":"ok","message":"Express API Server Running"}
```