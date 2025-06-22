#!/bin/bash

echo "🚀 Railway起動エラーを修正中..."

# Git操作
git add railway.toml

git commit -m "Fix: Railway start command for standalone build

- Removed explicit startCommand from railway.toml
- Let Docker use CMD from Dockerfile (node server-wrapper.js)
- Fixes 'next: not found' error in Railway deployment"

git push

echo "✅ 修正が完了し、Railwayへプッシュされました"
echo ""
echo "📝 修正内容:"
echo "- railway.tomlからstartCommandを削除"
echo "- DockerfileのCMD（node server-wrapper.js）を使用"
echo "- standaloneビルドに対応"
echo ""
echo "📊 Railwayダッシュボードで再デプロイを確認してください"
echo "🔗 https://railway.app/dashboard"