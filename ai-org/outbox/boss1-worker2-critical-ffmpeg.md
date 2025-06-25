# 【最重要】Worker2 - FFmpeg実装緊急要請

## チーム全体がWorker2を待っています

### 現在の危機的状況
- Worker1: ✅ 完了（YouTube動画ダウンロード）
- Worker3: ✅ 完了（OpenAI統合、テスト環境）
- **Worker2: ❌ 未完了（FFmpeg統合）**

### 必要な実装（シンプルに）
```javascript
// /api/split-simple の実装
const ffmpeg = require('fluent-ffmpeg');

// 動画を10秒ごとに分割
ffmpeg(inputPath)
  .setStartTime(0)
  .setDuration(10)
  .output('segment1.mp4')
  .run();
```

### 最小限の要件
1. 動画を10秒単位で分割
2. 3つのセグメントを生成（0-10秒、10-20秒、20-30秒）
3. エラー時は空配列を返す

### 緊急度：最高
**残り3時間でデモ**。Worker2の実装なしでは統合テスト不可。

### アクション
1. 現在の進捗を即座に報告
2. 困っている点があれば共有
3. 30分以内に最小限の動作を実現

他のワーカーは完了済み。Worker2の成功がチーム成功の鍵です！

Boss1