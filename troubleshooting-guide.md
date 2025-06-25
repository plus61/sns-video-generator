# SNS Video Generator トラブルシューティングガイド

## 🚨 よくある問題と解決策

### 1. CORS エラー
**症状**: 
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**解決策**:
- render.yaml の CORS 設定確認
- Express API の allowedOrigins に Railway URL を追加
```javascript
const allowedOrigins = [
  'https://sns-video-generator.up.railway.app',
  'https://sns-video-generator-production.up.railway.app'
]
```

### 2. API タイムアウト
**症状**: 
- 処理が長時間かかる
- "Request timeout" エラー

**解決策**:
- Render 無料プランは15分制限
- 大きな動画は分割してアップロード
- 有料プランへのアップグレード検討

### 3. 環境変数が反映されない
**症状**:
- API URLが localhost のまま
- 本番環境でも開発用URLを参照

**解決策**:
1. Railway Dashboard で環境変数確認
2. 再デプロイを実行
```bash
# Railway CLI
railway redeploy
```

### 4. YouTube ダウンロードエラー
**症状**:
- 「動画が見つかりません」
- 403 Forbidden エラー

**解決策**:
- 公開動画のURLか確認
- 地域制限がないか確認
- URLフォーマットが正しいか確認
```
正しい: https://www.youtube.com/watch?v=VIDEO_ID
間違い: https://youtu.be/VIDEO_ID
```

### 5. FFmpeg エラー
**症状**:
- 動画分割が失敗
- "ffmpeg not found" エラー

**解決策**:
- Dockerfileで ffmpeg インストール確認
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```
- render.yaml の buildCommand 確認

### 6. メモリ不足
**症状**:
- "Out of memory" エラー
- プロセスが強制終了

**解決策**:
- 動画サイズを制限（100MB以下）
- 処理を分割実行
- 有料プランでメモリ増量

## 🔧 デバッグ方法

### ログ確認
```bash
# Railway ログ
railway logs

# Render ログ
# Dashboard > Logs タブ
```

### ヘルスチェック
```bash
# API ヘルスチェック
curl https://sns-video-express-api.onrender.com/health

# UI アクセス確認
curl -I https://sns-video-generator.up.railway.app
```

### ローカルテスト
```bash
# 環境変数設定
export NEXT_PUBLIC_API_URL=http://localhost:3002

# サーバー起動
npm run dev
```

## 📞 エスカレーション

解決できない場合：
1. エラーログを収集
2. 再現手順を記録
3. Boss1 に報告

## 🎯 予防策

1. **定期的なヘルスチェック**
   - 5分ごとにAPIステータス確認
   - エラー率の監視

2. **キャパシティプランニング**
   - 同時接続数の制限
   - レート制限の実装

3. **フォールバック機能**
   - API エラー時はモックデータ表示
   - 部分的な機能提供を継続