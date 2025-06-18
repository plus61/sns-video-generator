# Railway デプロイメントガイド

## 🚀 修正完了項目

### Dockerfile修正
- ✅ TypeScript設定ファイルの明示的コピー追加
- ✅ 環境変数 `NEXT_TELEMETRY_DISABLED` 追加
- ✅ runtime用の設定ファイルコピー追加
- ✅ curlパッケージは既にインストール済み（50行目）

### 設定ファイル更新
- ✅ `.dockerignore` 作成（不要ファイルの除外）
- ✅ `railway.json` をDockerfileビルダーに変更

## 📝 Railway環境変数設定（必須）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your_nextauth_secret

# YouTube (オプション - モック使用可能)
YOUTUBE_API_KEY=your_youtube_api_key
USE_MOCK_DOWNLOADER=true

# Redis (BullMQ用)
REDIS_URL=${{REDIS_URL}}
```

## 🔧 Redisサービス追加手順

1. Railwayダッシュボードで「New Service」をクリック
2. 「Database」→「Redis」を選択
3. サービス名を「redis」に設定
4. 環境変数 `REDIS_URL` が自動的に利用可能に

## 🚀 デプロイ手順

1. GitHubにpush:
```bash
git add .
git commit -m "Fix Railway Dockerfile build configuration"
git push origin main
```

2. Railwayが自動的に再ビルド開始

3. ビルド成功後、環境変数を設定

4. デプロイ完了！

## 🔍 トラブルシューティング

### ビルドエラーが続く場合
1. Railwayのビルドログを確認
2. 特定のファイルが見つからない場合は、Dockerfileの COPY 命令を確認
3. node_modules関連のエラーは、package-lock.jsonの更新で解決することが多い

### ヘルスチェック失敗
- `/api/health` エンドポイントが正常に応答することを確認
- 環境変数が正しく設定されているか確認

## 📊 推奨リソース設定

- **CPU**: 2 vCPU
- **Memory**: 4GB RAM
- **Disk**: 10GB

動画処理の負荷に応じて調整してください。