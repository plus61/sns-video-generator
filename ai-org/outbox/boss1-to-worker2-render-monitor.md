# Boss1 → Worker2 指示

## Render.comデプロイ監視

### 実施タスク

1. **Render.comステータス確認**
   - https://dashboard.render.com
   - sns-video-express-apiサービスの状態
   - ビルドログ確認

2. **環境変数設定**
   ```
   CORS_ORIGIN=https://sns-video-generator.up.railway.app,https://sns-video-generator-production.up.railway.app
   ```

3. **UI側環境変数準備**
   - GlitchのAPI URL判明後
   - RenderのAPI URL判明後
   - Railway UIの環境変数更新リスト作成

### 監視ポイント
- ビルド成功/失敗
- デプロイ時間
- ヘルスチェック状態

**報告**: 10分ごとに状況更新
**報告先**: ai-org/worker2/render-monitor-status.txt