#!/bin/bash

# Railway環境アクセス解決スクリプト
# Worker1 緊急対応用

echo "🔍 Railway環境アクセス解決策実行中..."

# 1. 既知のRailway URLパターンをテスト
POSSIBLE_URLS=(
    "https://sns-video-generator-production.up.railway.app"
    "https://sns-video-generator.up.railway.app"
    "https://web-production-*.up.railway.app"
)

echo "📡 ヘルスチェックエンドポイントテスト開始..."

for url in "${POSSIBLE_URLS[@]}"; do
    echo "Testing: $url/api/health"
    
    # ヘルスチェック実行
    if curl -s --max-time 10 "$url/api/health" >/dev/null 2>&1; then
        echo "✅ $url - 応答OK"
        echo "詳細応答:"
        curl -s --max-time 10 "$url/api/health" | jq . 2>/dev/null || curl -s --max-time 10 "$url/api/health"
        echo ""
        WORKING_URL="$url"
        break
    else
        echo "❌ $url - 応答なし"
    fi
done

# 2. Railway CLI での代替アプローチ
echo "🚀 Railway CLI 代替コマンド実行..."

echo "利用可能なプロジェクト:"
railway projects 2>/dev/null | head -10

echo "認証状況:"
railway whoami 2>/dev/null

# 3. GitHub連携状況確認
echo "📊 GitHub連携状況確認..."
if [ -d "../.git" ]; then
    echo "✅ Git リポジトリ確認済み"
    echo "最新コミット:"
    git --git-dir=../.git log --oneline -3 2>/dev/null
    
    echo "リモートURL:"
    git --git-dir=../.git remote -v 2>/dev/null
else
    echo "❌ Gitリポジトリが見つかりません"
fi

# 4. 解決策提案
echo ""
echo "🎯 推奨解決アクション:"
echo "1. Railway Webダッシュボードでデプロイ状況確認"
echo "2. GitHub上での最新コミット→Railway自動デプロイ確認"
echo "3. 応答があったURL（${WORKING_URL:-なし}）での詳細テスト実施"
echo "4. Railway CLI project link の再実行"

echo "診断完了: $(date)"