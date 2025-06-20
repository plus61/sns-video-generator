# Railway デプロイ前チェックリスト

## 🧪 ローカルテストの実行方法

### 1. クイックテスト（推奨）
```bash
# プロジェクトルートで実行
./scripts/test-railway-build.sh
```

このスクリプトは以下を自動でチェック：
- Docker ビルドの成功確認
- ローカルビルドの成功確認
- 必要なファイルの存在確認
- 環境変数の設定確認

### 2. 手動テスト
```bash
# 1. ローカルビルドテスト
export NODE_ENV=production
export SKIP_ENV_VALIDATION=1
export DISABLE_BULLMQ=true
npm run build

# 2. Docker ビルドテスト
docker build -f Dockerfile.railway -t test .

# 3. Docker 実行テスト
docker run -p 3000:3000 test
```

## ✅ デプロイ前チェックリスト

### 必須ファイル
- [ ] `package.json` と `package-lock.json` が存在
- [ ] `Dockerfile.railway` が存在
- [ ] `railway.toml` が存在
- [ ] `server.js` が存在（カスタムサーバー使用時）
- [ ] `next.config.mjs` が存在

### 環境変数（Railway ダッシュボードで設定）
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `DATABASE_URL`（オプション）
- [ ] `REDIS_URL`（オプション）

### コード確認
- [ ] TypeScript エラーがない（または無視設定済み）
- [ ] ESLint エラーがない（または無視設定済み）
- [ ] 依存関係の競合がない

## 🚀 デプロイ手順

1. ローカルテストを実行
```bash
./scripts/test-railway-build.sh
```

2. 問題がなければコミット・プッシュ
```bash
git add -A
git commit -m "Deploy to Railway"
git push origin main
```

3. Railway ダッシュボードでビルドログを確認

## 🔧 トラブルシューティング

### npm ci エラー
- `package-lock.json` を削除して `npm install` を実行
- または `npm install --legacy-peer-deps` を使用

### ビルドエラー
- 環境変数 `SKIP_ENV_VALIDATION=1` を設定
- `DISABLE_BULLMQ=true` を設定
- ダミー環境ファイルを作成

### モジュール解決エラー
- `server.js` でカスタムサーバーを使用
- tsconfig.json の paths 設定を確認

## 📊 GitHub Actions

プッシュ時に自動でビルドチェックが実行されます：
- `.github/workflows/pre-deploy-check.yml`

これにより、Railway にデプロイする前に問題を検出できます。