#!/bin/bash
# API動作テストスクリプト - Worker2作成

echo "=== API動作テスト開始 ==="
echo "エンドポイント: /api/process-simple"
echo ""

# テスト1: 基本動作テスト（10秒動画）
echo "📹 テスト1: 基本動作テスト"
echo "URL: https://www.youtube.com/watch?v=aqz-KE-bpKQ"
curl -X POST http://localhost:3000/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}' \
  -w "\n\nHTTPステータス: %{http_code}\n処理時間: %{time_total}秒\n"

echo ""
echo "---"
echo ""

# テスト2: エラーハンドリングテスト
echo "❌ テスト2: エラーハンドリングテスト"
echo "URL: https://www.youtube.com/watch?v=invalid_video_id"
curl -X POST http://localhost:3000/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=invalid_video_id"}' \
  -w "\n\nHTTPステータス: %{http_code}\n処理時間: %{time_total}秒\n"

echo ""
echo "---"
echo ""

# テスト3: 日本語コンテンツテスト
echo "🇯🇵 テスト3: 日本語コンテンツテスト"
echo "URL: https://www.youtube.com/watch?v=FtutLA63Cp8"
curl -X POST http://localhost:3000/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=FtutLA63Cp8"}' \
  -w "\n\nHTTPステータス: %{http_code}\n処理時間: %{time_total}秒\n"

echo ""
echo "=== テスト完了 ==="
echo "詳細な結果は上記を確認してください"