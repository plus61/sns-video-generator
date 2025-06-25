# Railway Deployment チェックリスト
最終更新: 2025-06-25 17:20

## 🚀 デプロイ前チェック

### ローカル準備
- [x] Dockerfile.simple 更新完了（yt-dlp追加）
- [x] next.config.mjs CORS設定追加
- [x] railway.toml 確認（Dockerfile.simple使用）
- [x] APIエンドポイント文書化
- [x] git-commit-updated.sh 作成

### Railway設定確認
- [ ] 環境変数設定確認
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OPENAI_API_KEY
  - [ ] NEXTAUTH_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] FRONTEND_URL

## 📋 デプロイ実行

### Git操作
```bash
# 実行コマンド
chmod +x git-commit-updated.sh
./git-commit-updated.sh
```

### デプロイ監視
- [ ] Git push完了
- [ ] Railway自動デプロイ開始
- [ ] ビルドログ確認
- [ ] ビルド成功

## ✅ デプロイ後確認

### ヘルスチェック
- [ ] `https://[your-app].railway.app/api/health/simple-health` アクセス可能
- [ ] ステータス 200 OK

### API動作確認
- [ ] `/api/test-basic` 基本動作確認
- [ ] `/api/debug` システム情報取得
- [ ] CORSヘッダー確認（Vercelからのアクセス）

### エラー確認
- [ ] Railwayログでエラーなし
- [ ] YouTube download機能動作確認
- [ ] Supabase接続確認

## 🔗 連携確認

### Vercel Frontend連携
- [ ] Vercelアプリから Railway APIへのリクエスト成功
- [ ] CORS エラーなし
- [ ] 認証フロー動作確認

### Worker連携
- [ ] Worker2（Vercel担当）への連携情報共有
- [ ] Worker3（テスト担当）へのAPI URL共有

## 📝 完了報告

### BOSS報告内容
- [ ] デプロイURL
- [ ] 動作確認結果
- [ ] 残課題（あれば）
- [ ] 次のステップ提案

## ⚠️ トラブルシューティング

### よくある問題
1. **ビルド失敗**: package.json依存関係確認
2. **起動失敗**: 環境変数不足確認
3. **CORS エラー**: FRONTEND_URL設定確認
4. **YouTube DL失敗**: yt-dlpインストール確認

### 緊急時対応
- Railwayダッシュボードでロールバック
- 前回の安定版にリバート
- BOSSへ即時報告