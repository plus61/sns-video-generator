# Render.com Express API デプロイメントガイド

## デプロイメント準備完了

### GitHubプッシュ済み
- commit ac075b8: Express API and Render deployment configuration
- render.yaml: 自動検出される設定ファイル
- express-api-simple.js: Express APIサーバー

## Render.comでの手順

### 1. アカウント作成
- https://render.com でサインアップ
- GitHubアカウントで連携

### 2. 新規Webサービス作成
1. "New +" → "Web Service"をクリック
2. GitHubリポジトリ "plus61/sns-video-generator" を選択
3. render.yamlが自動検出される

### 3. 環境変数設定（重要）
Render Dashboardで以下を追加：
```
CORS_ORIGIN=https://sns-video-generator.up.railway.app
```

### 4. デプロイ
- "Create Web Service"をクリック
- 自動的にビルド・デプロイ開始
- 完了まで約5-10分

### 5. 確認事項
デプロイ完了後：
- URL例: https://sns-video-express-api.onrender.com
- ヘルスチェック: https://sns-video-express-api.onrender.com/health

## Railway環境変数更新
デプロイ完了後、Railway Dashboardで：
```
NEXT_PUBLIC_API_URL=https://sns-video-express-api.onrender.com
```

## 注意事項
- 無料プランは初回デプロイ後15分でスリープ
- 初回アクセス時に起動に30秒程度かかる場合あり

Worker1: Render.comデプロイメント準備完了