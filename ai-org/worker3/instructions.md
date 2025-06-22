# Worker3 作業手順

## 3. YouTube取得機能のテスト手順（5分以内）

### 前提条件
- Worker2の開発環境修復が完了
- 開発サーバーが起動可能

### 手順

#### Step 1: モックモードでの動作確認（2分）
```bash
# プロジェクトディレクトリに移動
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace

# 環境変数でモックモードを有効化
export MOCK_YOUTUBE_DOWNLOAD=true

# 開発サーバーを起動
npm run dev
```

別のターミナルで以下を実行：
```bash
# モックモードでYouTube URLをテスト
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 期待される応答:
# {
#   "success": true,
#   "videoId": "mock-video-...",
#   "title": "Mock Video Title",
#   "duration": 180,
#   "message": "Using mock YouTube download (development mode)"
# }
```

#### Step 2: 実際のYouTube URLでのテスト（2分）
```bash
# モックモードを無効化
unset MOCK_YOUTUBE_DOWNLOAD

# 短い動画（30秒以内）でテスト
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'

# 期待される応答（例）:
# {
#   "success": true,
#   "videoId": "generated-id",
#   "title": "Me at the zoo",
#   "duration": 19,
#   "thumbnail": "https://..."
# }
```

#### Step 3: エラーハンドリングの確認（1分）
```bash
# 無効なURLでテスト
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://invalid-url.com"}'

# 期待されるエラー応答:
# {
#   "error": "Invalid YouTube URL"
# }

# 空のリクエストでテスト
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{}'

# 期待されるエラー応答:
# {
#   "error": "URL is required"
# }
```

### 確認コマンド
```bash
# APIエンドポイントの存在確認
test -f src/app/api/youtube/download/route.ts && echo "✅ YouTube API endpoint exists" || echo "❌ YouTube API endpoint missing"

# モックモードの動作確認
MOCK_YOUTUBE_DOWNLOAD=true curl -s -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=test"}' | \
  grep -q "mock" && echo "✅ Mock mode working" || echo "❌ Mock mode not working"

# エラーハンドリングの確認
curl -s -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid"}' | \
  grep -q "error" && echo "✅ Error handling working" || echo "❌ Error handling not working"
```

### トラブルシューティング
- APIエンドポイントが見つからない：`src/app/api/youtube/download/route.ts`の存在確認
- CORS エラー：開発サーバーのCORS設定を確認
- タイムアウト：より短い動画でテスト（10秒以内）
- 認証エラー：公開動画でテスト

### 完了報告
```bash
echo "✅ YouTube download feature tested - Mock and real modes working" > /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace/ai-org/worker3/status.txt
```

### 次のステップ
全ての作業が完了したら、以下を実行：
```bash
# 全ワーカーのステータス確認
cat ai-org/worker1/status.txt
cat ai-org/worker2/status.txt
cat ai-org/worker3/status.txt

# 統合テスト
npm run test:e2e:local
```