# 【Worker1専用】YouTube API キー設定 - 緊急タスク

## 🚨 最優先事項
YouTube APIキーの設定は本日のデモ成功の鍵です！

## 📋 実装手順

### 1. YouTube Data API v3 キーの取得
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクト作成または既存プロジェクト選択
3. 「APIとサービス」→「ライブラリ」
4. 「YouTube Data API v3」を検索して有効化
5. 「認証情報」→「認証情報を作成」→「APIキー」
6. APIキーをコピー

### 2. .env.local への設定
```bash
# 23行目を更新
YOUTUBE_API_KEY=取得したAPIキーをここに貼り付け
```

### 3. 動作確認スクリプト
`scripts/test-youtube-api.ts` を作成:

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testYouTubeAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey || apiKey === 'your_youtube_data_api_v3_key') {
    console.error('❌ YouTube API キーが設定されていません！');
    return;
  }

  console.log('✅ API キー検出: ', apiKey.substring(0, 10) + '...');

  // テスト動画ID（既知の短い動画）
  const testVideoId = 'dQw4w9WgXcQ';
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${testVideoId}&key=${apiKey}&part=snippet,contentDetails`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API エラー:', data.error.message);
      return;
    }
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      console.log('✅ API 動作確認成功！');
      console.log('動画タイトル:', video.snippet.title);
      console.log('長さ:', video.contentDetails.duration);
    }
  } catch (error) {
    console.error('❌ 接続エラー:', error);
  }
}

testYouTubeAPI();
```

### 4. 実行確認
```bash
# スクリプト実行
npx tsx scripts/test-youtube-api.ts

# 開発サーバー起動
npm run dev

# ブラウザでテスト
# http://localhost:3000
# YouTube URLを入力して動作確認
```

### 5. トラブルシューティング

**APIキーが無効な場合:**
- APIが有効化されているか確認
- 制限設定を確認（HTTPリファラーなど）
- 請求先アカウントが設定されているか確認

**モック環境から切り替わらない場合:**
`.env.local` の22行目を確認:
```bash
USE_MOCK_DOWNLOADER=false  # trueだとモックのまま
```

## ⏰ 完了目標
**11:00まで** - これが完了すれば実際のYouTube動画でデモ可能！

## 🎯 成功基準
1. YouTube API キーが有効
2. テストスクリプトが成功
3. 実際のYouTube URLで動画情報取得可能

急いで設定をお願いします！本日のデモ成功がかかっています！💪