#!/bin/bash

# APIエンドポイントテスト用スクリプト

echo "🔍 Testing API Endpoints..."
echo "=========================="

# Glitch環境（URL確定後に更新）
GLITCH_URL="${GLITCH_API_URL:-https://[待機].glitch.me}"
echo -e "\n📌 Glitch API: $GLITCH_URL"

if [[ "$GLITCH_URL" != *"[待機]"* ]]; then
  echo "Testing Glitch health..."
  curl -s "$GLITCH_URL/api/health" | jq . || echo "Failed"
else
  echo "⏳ Waiting for Glitch deployment..."
fi

# Render環境
RENDER_URL="${RENDER_API_URL:-https://sns-video-express-api.onrender.com}"
echo -e "\n📌 Render API: $RENDER_URL"

echo "Testing Render endpoints..."
echo -n "  /api/health: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/api/health")
echo "HTTP $STATUS"

echo -n "  / (root): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/")
echo "HTTP $STATUS"

# APIが存在するか確認
echo -e "\nChecking Render deployment status..."
RESPONSE=$(curl -s "$RENDER_URL")
if [[ "$RESPONSE" == *"Not Found"* ]]; then
  echo "❌ API not deployed yet"
elif [[ "$RESPONSE" == *"Express"* ]] || [[ "$RESPONSE" == *"api"* ]]; then
  echo "✅ API appears to be running"
  echo "Response preview: ${RESPONSE:0:100}..."
else
  echo "❓ Unknown response"
  echo "Response: $RESPONSE"
fi

echo -e "\n💡 Usage:"
echo "  GLITCH_API_URL=https://actual.glitch.me ./test-api-endpoints.sh"
echo "  RENDER_API_URL=https://actual.onrender.com ./test-api-endpoints.sh"