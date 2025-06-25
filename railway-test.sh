#!/bin/bash
echo "=== Railway Production Test ==="
URL="https://sns-video-generator-production.up.railway.app"

# 1. Health check
echo "1. Health check..."
curl -s $URL/api/health/simple-health | jq .

# 2. Simple page check
echo "2. Simple page check..."
curl -s -o /dev/null -w "%{http_code}" $URL/simple

# 3. API test
echo "3. API test..."
curl -X POST $URL/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=jNQXAC9IVRw"}' \
  -w "\nStatus: %{http_code}\n"