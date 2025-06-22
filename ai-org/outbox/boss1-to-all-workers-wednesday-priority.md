# 【Boss1→全ワーカー】水曜日優先タスク - 最初のデモ実現へ

プレジデントから戦略的決定が下されました。本日中に最初のデモを実現します！

## 🎯 最優先タスク（シンプル実装）

### Worker1: YouTube APIキー設定と基本テスト
```bash
# 1. YouTube Data API v3 キーを取得
# 2. .env.localに設定
YOUTUBE_API_KEY=実際のAPIキー

# 3. 動作確認
npm run dev
# http://localhost:3000 でYouTube URL入力テスト
```

### Worker2: 固定時間分割実装（超シンプル版）
```typescript
// src/lib/simple-video-splitter.ts
export async function splitVideoFixed(inputPath: string) {
  // 10秒×3クリップに固定分割
  const segments = [
    { start: 0, end: 10 },
    { start: 10, end: 20 },
    { start: 20, end: 30 }
  ];
  
  // FFmpegで切り出し
  for (const seg of segments) {
    await ffmpeg.extractSegment(inputPath, seg.start, seg.end);
  }
}
```

### Worker3: ダウンロード機能実装
```typescript
// src/app/api/download-segments/route.ts
export async function GET(request: Request) {
  // 分割済みファイルをZIPにまとめて返す
  const zip = new JSZip();
  zip.file("clip1.mp4", clip1Buffer);
  zip.file("clip2.mp4", clip2Buffer);
  zip.file("clip3.mp4", clip3Buffer);
  
  return new Response(await zip.generateAsync({ type: "blob" }));
}
```

## 📋 本日の成功基準
1. YouTube URLを入力
2. 動画をダウンロード
3. 10秒×3に分割
4. ZIPでダウンロード

**AI分析は明日！今日は「動く」ことが最優先！**

## ⏰ タイムライン
- 10:00-11:00: YouTube APIキー設定
- 11:00-13:00: 固定分割実装
- 13:00-14:00: ダウンロード機能
- 14:00-15:00: 統合テスト
- 15:00: デモ準備完了

Let's make it work! 🚀