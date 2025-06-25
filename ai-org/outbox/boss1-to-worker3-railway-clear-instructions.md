# Boss1 → Worker3 明確な指示書

## 🚨 最重要：方向転換

**Render/Glitchテストは完全中止。Railway環境のテストのみ実施します。**

## 現状整理

### ❌ 中止する作業
- Glitch環境テストスクリプト（完全削除）
- Render環境テストスクリプト（完全削除）
- 2環境比較テスト（完全中止）

### ✅ Railwayで実施する作業

## 具体的タスク（優先順位順）

### 1. Railway環境E2Eテスト（30分以内）

**テスト対象URL**:
```javascript
const RAILWAY_URL = 'https://sns-video-generator.up.railway.app';
const RAILWAY_PROD_URL = 'https://sns-video-generator-production.up.railway.app';
```

**作成するテストスクリプト**:
```javascript
// test-railway-e2e.js
const testYouTubeURL = 'https://www.youtube.com/shorts/dDmRTLJiAiU';

async function testRailwayE2E() {
  console.log('=== Railway E2E テスト開始 ===');
  
  // 1. Health Check
  const health = await fetch(`${RAILWAY_URL}/health`);
  console.log('Health:', health.status);
  
  // 2. YouTube Download Test
  const downloadRes = await fetch(`${RAILWAY_URL}/api/upload-youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: testYouTubeURL })
  });
  console.log('Download:', downloadRes.status);
  
  // 3. エラー詳細の取得
  if (!downloadRes.ok) {
    const error = await downloadRes.text();
    console.log('Error details:', error);
  }
}
```

### 2. 問題点の詳細分析（30分以内）

**調査項目**:
- [ ] FFmpegパスエラーの詳細
- [ ] OpenAI APIキーの状態
- [ ] Redis接続エラーの有無
- [ ] メモリ/タイムアウト問題

**エラーログ収集**:
```javascript
// Railway特有のエラーパターン
const errorPatterns = {
  ffmpeg: /ffmpeg|FFmpeg|video processing/i,
  openai: /openai|API key|GPT/i,
  redis: /redis|Redis|queue/i,
  timeout: /timeout|timed out/i
};
```

### 3. 回避策の実装（45分以内）

**Plan A: 完全動作を目指す**
```javascript
// FFmpeg修正案
if (error.includes('ffmpeg')) {
  // 代替パスを試す
  const altPaths = ['/usr/bin/ffmpeg', '/app/.apt/usr/bin/ffmpeg'];
}
```

**Plan B: 部分動作でデモ**
```javascript
// モックレスポンスの準備
if (railwayError) {
  return mockSuccessResponse();
}
```

### 4. テスト結果レポート

```json
// ai-org/worker3/railway-test-report.json
{
  "timestamp": "2024-06-25T10:00:00Z",
  "environment": "Railway",
  "results": {
    "health": "ok/error",
    "youtube_download": "ok/error",
    "video_split": "ok/error",
    "error_details": {}
  },
  "recommendations": []
}
```

## 成功基準

1. Railway環境の問題点を完全に把握
2. 回避策または修正案を提示
3. 最低限のデモが可能な状態を作る

## なぜRailwayテストが重要か

- 既存の本番環境
- プレジデントの指示
- 追加コスト不要
- 即座に利用可能

**Render/Glitchのテストは一切不要です。Railway環境の安定化に全力を注いでください。**

## 緊急対応

もしRailwayが完全に動作しない場合：
1. 詳細なエラーログを収集
2. 具体的な修正提案を作成
3. 代替デモ方法を準備