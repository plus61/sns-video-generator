# 【緊急】Worker1 - Phase 4 YouTube実装

## タスク: ytdl-coreで実際のダウンロード（1時間）

### /api/download-video 実装要件
```typescript
// 実際の動画ダウンロード
const ytdl = require('ytdl-core');
const info = await ytdl.getInfo(url);
const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
```

### 必須実装
1. **進捗表示**
   - downloadProgress イベント
   - percentage, downloaded, total

2. **エラーハンドリング**
   - 地域制限: "Video unavailable in your region"
   - 年齢制限: "Sign in to confirm your age"
   - 無効URL: "Invalid YouTube URL"

3. **メタデータ取得**
   - title, duration, thumbnail
   - videoDetails から抽出

### テスト動画
https://www.youtube.com/watch?v=dQw4w9WgXcQ

1時間で完成させてください！