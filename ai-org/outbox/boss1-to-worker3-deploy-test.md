# Boss1 → Worker3 指示

## デプロイ環境テスト準備

### タスク内容

1. **Glitchテストスクリプト準備**
   ```javascript
   // test-glitch-api.js
   const API_URL = 'https://[project-name].glitch.me';
   
   // 1. Health check
   // 2. YouTube download test
   // 3. Video split test
   // 4. ZIP download test
   ```

2. **Renderテストスクリプト準備**
   ```javascript
   // test-render-api.js
   const API_URL = 'https://sns-video-express-api.onrender.com';
   // 同様のテスト
   ```

3. **CORS検証**
   - Railway UIからのアクセステスト
   - ブラウザコンソールでのエラー確認

### テスト準備
- テストYouTube URL準備
- 結果記録フォーマット準備
- エラーハンドリング確認

**開始時期**: GlitchのURL判明後即座に
**報告先**: ai-org/worker3/deployment-test-results.json