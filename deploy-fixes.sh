#!/bin/bash

echo "🚀 Railway デプロイ修正を適用中..."

# Git操作
git add src/lib/queues/video-processing-queue-vercel.ts
git add railway.toml

git commit -m "Fix: MockWorker disconnect method and Railway Dockerfile builder

- Added disconnect() method to MockWorker for proper cleanup
- Specified DOCKERFILE builder in railway.toml
- Ensures Railway uses Docker build process correctly"

git push

echo "✅ 修正が完了し、Railwayへプッシュされました"
echo "📊 Railwayダッシュボードでデプロイ状況を確認してください"
echo "🔗 https://railway.app/dashboard"