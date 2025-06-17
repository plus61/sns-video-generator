# 🚨 Vercel ビルドエラー緊急修正計画

## エラー原因

1. **youtube-dl-exec の非互換性**
   - Vercelのサーバーレス環境では動作しない
   - Node.jsバイナリが必要だが、Vercelでは使用不可

2. **ファイルシステム制限**
   - `/tmp`以外は読み取り専用
   - 最大512MB制限
   - リクエスト終了後に削除

3. **実行時間制限**
   - 無料プラン: 10秒
   - Proプラン: 60秒
   - YouTube動画ダウンロードには不十分

## 緊急修正案

### Option 1: 外部APIサービスの利用（推奨）

```typescript
// src/lib/youtube-api-service.ts
export class YouTubeAPIService {
  async getVideoInfo(youtubeUrl: string) {
    // YouTube Data API v3を使用
    const videoId = this.extractVideoId(youtubeUrl)
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`
    )
    return response.json()
  }
  
  // 実際のダウンロードは外部サービスに委託
  async requestDownload(videoId: string, youtubeUrl: string) {
    // Option: RapidAPI, Cloudinary, または自前のVPSサーバー
    return { status: 'queued', jobId: videoId }
  }
}
```

### Option 2: モック実装に戻す（即座の修正）

```typescript
// src/lib/youtube-downloader-mock.ts
export class YouTubeDownloader {
  async processYouTubeVideo(videoId: string, youtubeUrl: string) {
    // モック実装で基本機能を維持
    await supabaseAdmin
      .from('video_uploads')
      .update({
        status: 'ready_for_analysis',
        original_filename: 'Sample Video.mp4',
        file_size: 50 * 1024 * 1024, // 50MB
        duration: 300, // 5 minutes
        public_url: `https://example.com/videos/${videoId}.mp4`
      })
      .eq('id', videoId)
    
    return { success: true }
  }
}
```

### Option 3: Edge Functionへの移行

```typescript
// supabase/functions/youtube-download/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { videoId, youtubeUrl } = await req.json()
  
  // Deno環境でyoutube-dlを実行
  const process = Deno.run({
    cmd: ['yt-dlp', youtubeUrl, '-o', `/tmp/${videoId}.mp4`]
  })
  
  await process.status()
  
  // Supabase Storageにアップロード
  // ...
})
```

## 即座の対応手順

1. **youtube-dl-execの削除**
   ```bash
   npm uninstall youtube-dl-exec
   ```

2. **モック実装への切り替え**
   - `youtube-downloader.ts` → `youtube-downloader-vercel.ts`（モック版）
   - 本番環境では外部APIを使用

3. **環境変数の追加**
   ```
   YOUTUBE_API_KEY=your_youtube_data_api_key
   USE_MOCK_DOWNLOADER=true
   ```

## Boss1への実行指示

### Phase 1: 即座の修正（10分以内）
1. youtube-dl-exec関連のコードを全てコメントアウト
2. モック実装に差し替え
3. ビルドエラーの解消確認

### Phase 2: 本格的な解決（1時間以内）
1. YouTube Data API v3の統合
2. 外部ダウンロードサービスの選定
3. Webhook経由での非同期処理実装

### Phase 3: 長期的な解決（今週中）
1. Supabase Edge Functionsへの移行
2. 専用VPSサーバーの構築
3. ジョブキューシステムの実装