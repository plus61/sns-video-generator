# Railway Deployment - パラダイムシフト計画

## 現在までの試行錯誤
1. ❌ Docker multi-stage build
2. ❌ Docker simple build  
3. ❌ Nixpacks with railway.toml
4. ⏳ Nixpacks with nixpacks.toml (実行中)

## 次世代戦略（優先順位順）

### Plan A: 究極のシンプル化
```bash
# 全設定ファイル削除
rm railway.toml nixpacks.toml
# next.config.mjsからstandalone削除
# Railwayの自動検出に完全に任せる
```

### Plan B: 事前ビルドDocker Hub戦略
```bash
# ローカルでイメージビルド
docker build -t plus61/sns-video-generator:latest .
docker push plus61/sns-video-generator:latest
# RailwayでDocker Hubイメージを使用
```

### Plan C: カスタムNode.jsサーバー
```javascript
// custom-server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(process.env.PORT || 3000);
});
```

### Plan D: Vercel移行
- Next.jsの本家プラットフォーム
- ゼロコンフィグデプロイ
- 無料枠で十分な性能

## 判断基準
- 5分以内にデプロイ成功しない場合、次の戦略へ
- エラーパターンが変わらない場合、根本的転換へ