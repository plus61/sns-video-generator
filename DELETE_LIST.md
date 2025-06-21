# 🗑️ 削除対象リスト - CI/CD革命

## ワークフロー（合計602行を削除）
- [ ] `.github/workflows/railway-deploy.yml` (237行)
- [ ] `.github/workflows/worker-collaboration.yml` (315行)
- [ ] `.github/workflows/pre-deploy-check.yml` (50行+)
- [ ] `.github/workflows/railway-progressive-deploy.yml` (50行+)

## Dockerfiles（全て削除）
- [ ] `Dockerfile.railway`
- [ ] `Dockerfile.canary`
- [ ] `Dockerfile.simple`
- [ ] `Dockerfile` (もし複雑なら)

## 不要な設定ファイル
- [ ] `minimal-server.js`
- [ ] `package-minimal.json`
- [ ] `package-express.json`
- [ ] `express-server.js`
- [ ] `next.config.static.ts`
- [ ] `railway-static.toml`

## テスト関連（シンプル化後は不要）
- [ ] 複雑なテスト設定
- [ ] 過度なモックファイル
- [ ] 不要なE2E設定

## 削除コマンド（一括実行用）
```bash
# ワークフロー削除
rm -f .github/workflows/railway-deploy.yml
rm -f .github/workflows/worker-collaboration.yml
rm -f .github/workflows/pre-deploy-check.yml
rm -f .github/workflows/railway-progressive-deploy.yml

# Dockerfile削除
rm -f Dockerfile*

# 不要ファイル削除
rm -f minimal-server.js package-minimal.json package-express.json
rm -f express-server.js next.config.static.ts railway-static.toml
```

## 削除後の効果
- **602行削除** → **7行で置換**
- **削減率: 98.8%**
- **複雑性: ゼロ**