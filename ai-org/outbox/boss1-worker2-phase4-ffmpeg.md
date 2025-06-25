# 【緊急】Worker2 - Phase 4 FFmpeg統合

## タスク: fluent-ffmpegでセグメント切り出し（1.5時間）

### /api/split-simple 実装要件
```typescript
const ffmpeg = require('fluent-ffmpeg');
ffmpeg(inputPath)
  .setStartTime(startTime)
  .setDuration(10)
  .output(outputPath)
  .on('progress', (progress) => {
    // 進捗更新
  })
```

### 必須実装
1. **セグメント切り出し**
   - 10秒ごとの正確な分割
   - 品質保持（-c copy）
   - 非同期処理対応

2. **一時ファイル管理**
   - /tmp ディレクトリ使用
   - 処理後の自動削除
   - ディスク容量チェック

3. **エラーハンドリング**
   - FFmpeg未インストール
   - メモリ不足
   - 無効な動画形式

### パフォーマンス要件
- 1分動画を6セグメントに10秒以内で分割

1.5時間で完成させてください！