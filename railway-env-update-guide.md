# Railway UI 環境変数更新ガイド

## 1. Railway Dashboard アクセス
1. https://railway.app にログイン
2. "sns-video-generator" プロジェクトを選択
3. Settings タブを開く

## 2. 環境変数の追加
以下の環境変数を追加：

```bash
NEXT_PUBLIC_API_URL=https://sns-video-express-api.onrender.com
```

**重要**: Worker1のRenderデプロイ完了後、実際のURLに更新してください。

## 3. 再デプロイ
1. 環境変数を保存
2. Deployments タブで "Redeploy" をクリック
3. デプロイ完了を待つ（約2-3分）

## 4. 動作確認
```bash
# Railway URLにアクセス
https://sns-video-generator.up.railway.app/simple

# APIヘルスチェック
curl https://sns-video-express-api.onrender.com/health
```

## トラブルシューティング
- **環境変数が反映されない**: 再デプロイが必要
- **CORS エラー**: Express API側の allowedOrigins を確認
- **タイムアウト**: Renderの無料プランは15分制限あり