#!/bin/bash

echo "========================================="
echo "Railway E2E テスト実行"
echo "========================================="
echo ""

# 1. ヘルスチェックエンドポイントのテスト
echo "1. ヘルスチェックエンドポイント (/api/health)"
echo "-------------------------------------------"
echo "URL: https://cooperative-wisdom.railway.app/api/health"
echo ""

# curlコマンドでステータスコードを取得
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cooperative-wisdom.railway.app/api/health)
echo "HTTPステータスコード: $HTTP_STATUS"

# レスポンスボディを取得
echo ""
echo "レスポンスボディ:"
curl -s https://cooperative-wisdom.railway.app/api/health | jq . 2>/dev/null || curl -s https://cooperative-wisdom.railway.app/api/health

# レスポンスタイムを測定
echo ""
echo "レスポンスタイム:"
curl -s -o /dev/null -w "Total time: %{time_total}s\nConnect time: %{time_connect}s\nStart transfer: %{time_starttransfer}s\n" https://cooperative-wisdom.railway.app/api/health

echo ""
echo ""

# 2. ホームページのテスト
echo "2. ホームページ (/)"
echo "-------------------------------------------"
echo "URL: https://cooperative-wisdom.railway.app/"
echo ""

# ステータスコード
HTTP_STATUS_HOME=$(curl -s -o /dev/null -w "%{http_code}" https://cooperative-wisdom.railway.app/)
echo "HTTPステータスコード: $HTTP_STATUS_HOME"

# レスポンスタイム
echo ""
echo "レスポンスタイム:"
curl -s -o /dev/null -w "Total time: %{time_total}s\nConnect time: %{time_connect}s\nStart transfer: %{time_starttransfer}s\n" https://cooperative-wisdom.railway.app/

echo ""
echo ""

# 3. その他の主要APIエンドポイント
echo "3. その他の主要APIエンドポイント"
echo "-------------------------------------------"

# 各エンドポイントをテスト
endpoints=(
    "/api/video-uploads"
    "/api/video-projects"
    "/api/video-templates"
    "/api/audio-library"
)

for endpoint in "${endpoints[@]}"; do
    echo ""
    echo "Testing: https://cooperative-wisdom.railway.app$endpoint"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://cooperative-wisdom.railway.app$endpoint")
    echo "HTTPステータスコード: $HTTP_STATUS"
    
    # レスポンスタイム
    curl -s -o /dev/null -w "Response time: %{time_total}s\n" "https://cooperative-wisdom.railway.app$endpoint"
done

echo ""
echo "========================================="
echo "E2Eテスト完了"
echo "========================================="