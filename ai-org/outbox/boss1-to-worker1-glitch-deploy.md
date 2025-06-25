# Boss1 → Worker1 緊急指示

## Glitch即時デプロイ（5分チャレンジ）

CORS修正お疲れ様でした！次は**Glitchデプロイ**です。

### 実施手順

1. **Glitchプロジェクト作成**（1分）
   - https://glitch.com にアクセス
   - "New Project" → "Import from GitHub"
   - URL: `https://github.com/plus61/sns-video-generator`

2. **必須ファイル追加**（2分）
   ```json
   // glitch.json
   {
     "install": {
       "include": ["^package\\.json$"]
     },
     "start": {
       "include": ["^express-api-simple\\.js$"]
     },
     "watch": {
       "throttle": 1000
     }
   }
   ```

3. **環境変数設定**（30秒）
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **動作確認**（1分）
   - プロジェクトURL確認
   - /healthエンドポイントテスト
   - URLを報告

### 成功基準
- デプロイ時間：5分以内
- ヘルスチェック：200 OK
- CORS：Railway UIからアクセス可能

**期限**: 即時開始
**報告先**: ai-org/worker1/glitch-deploy-success.txt