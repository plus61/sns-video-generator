# Boss1 → Worker1 緊急指示

## CORS設定修正

express-api-simple.jsのallowedOriginsに以下を追加:

```javascript
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://sns-video-generator.up.railway.app',
  'https://sns-video-generator-production.up.railway.app',
  // 追加必要:
  'https://sns-video-express-api.onrender.com',
  'https://*.glitch.me',  // Glitch用ワイルドカード
  'https://sns-video-generator.glitch.me'  // 具体的なGlitch URL
];
```

## render.yaml修正

EXPRESS_PORT環境変数を削除（不要）:

```yaml
services:
  - type: web
    name: sns-video-express-api
    runtime: node
    buildCommand: npm install
    startCommand: node express-api-simple.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        sync: false # Set in Render dashboard
    healthCheckPath: /health
    autoDeploy: false
```

**実行期限**: 即時対応
**優先度**: 最高