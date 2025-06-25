# SNS Video Generator - Railway Deployment Guide
最終版: 2025-06-25

## 概要
このガイドでは、SNS Video GeneratorのRailwayへのデプロイ手順を説明します。

## 前提条件
- GitHubリポジトリへのアクセス権
- Railway アカウント
- 必要な環境変数の準備

## デプロイ手順

### 1. Railway プロジェクトのセットアップ
1. [Railway](https://railway.app)にログイン
2. "New Project" → "Deploy from GitHub repo"を選択
3. リポジトリ: `plus61/sns-video-generator`を選択
4. ブランチ: `main`を選択

### 2. 環境変数の設定
Railwayダッシュボードで以下の環境変数を設定:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_URL=https://your-project.railway.app
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth (オプション)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. ビルド設定
Railway は自動的に以下のファイルを検出します:

#### railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.simple"

[deploy]
healthcheckPath = "/api/health/simple-health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
port = 3000
```

#### Dockerfile.simple
単一ステージのDockerfileで、安定したビルドを実現:
- Node.js 18-slim ベース
- 必要最小限のシステム依存関係
- 本番環境用の最適化

### 4. デプロイの実行
1. GitHubへのプッシュで自動デプロイがトリガー
2. または Railway CLIを使用:
   ```bash
   railway up
   ```

### 5. デプロイの確認
- ビルドログの確認
- ヘルスチェック通過の確認
- アプリケーションの起動確認

## デプロイ後の確認事項

### ヘルスチェック
```bash
curl https://your-project.railway.app/api/health/simple-health
```

### 基本機能の確認
1. トップページアクセス
2. 認証機能（ログイン/ログアウト）
3. YouTube URL処理
4. 動画アップロード

## トラブルシューティング

### ビルドエラー
- `package.json`の依存関係を確認
- `NODE_ENV=production`が設定されているか確認

### 起動エラー
- 環境変数が正しく設定されているか確認
- ヘルスチェックエンドポイントが応答するか確認

### パフォーマンス問題
- メモリ使用量の確認（Railway ダッシュボード）
- 適切なインスタンスサイズの選択

## メンテナンス

### ログの確認
Railway ダッシュボード → Deployments → View Logs

### 環境変数の更新
1. Railway ダッシュボードで変更
2. 自動的に再デプロイされる

### スケーリング
Railway の自動スケーリング機能を利用

## 緊急時の対応

### ロールバック手順
1. Railway ダッシュボード → Deployments
2. 過去の安定版を選択
3. "Redeploy" をクリック

### サポート連絡先
- Railway サポート: support@railway.app
- プロジェクトチーム: Worker1 (技術サポート担当)