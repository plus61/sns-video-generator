# Boss1 → Worker1 明確な指示書

## 🚨 最重要：方向転換

**Render/Glitchは完全に忘れてください。Railwayのみに集中します。**

## 現状整理

### ❌ 中止する作業
- Glitchデプロイ（完全中止）
- Render関連の全作業（完全中止）
- express-api-simple.jsのCORS設定（Render/Glitch URL削除）

### ✅ Railwayで実施する作業

## 具体的タスク（優先順位順）

### 1. Railway環境変数の確認（15分以内）
```bash
# Railwayダッシュボードで確認
FFMPEG_PATH=/usr/bin/ffmpeg
OPENAI_API_KEY=sk-xxx...
NODE_ENV=production
EXPRESS_PORT=3002
```

### 2. FFmpegパス修正（30分以内）
```javascript
// src/lib/video-processor.ts を修正
const ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

// または条件分岐
const ffmpegPath = process.env.RAILWAY_ENVIRONMENT 
  ? '/usr/bin/ffmpeg'      // Railway環境
  : '/usr/local/bin/ffmpeg'; // ローカル環境
```

### 3. Express APIのRailway対応（必要な場合）
```javascript
// express-api-simple.js のCORS設定を元に戻す
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://sns-video-generator.up.railway.app',
  'https://sns-video-generator-production.up.railway.app'
  // Render/GlitchのURLは削除
];
```

### 4. Railwayでの動作確認
```bash
# ローカルでテスト
railway run npm run dev

# デプロイ
railway up
```

## 成功基準
1. Railway環境でFFmpegが動作する
2. YouTube動画ダウンロードが成功する
3. 動画分割が正常に実行される

## 報告方法
```
ai-org/worker1/railway-fix-report.txt に以下を記載：
1. 実施内容
2. 動作確認結果
3. 残課題（あれば）
```

## なぜRailwayに戻るのか
- プレジデントの明確な指示
- 既存のインフラを活用
- 追加コストを避ける
- 本番環境の一貫性

**Render/Glitchのことは完全に忘れて、Railwayでの動作に全力を注いでください。**