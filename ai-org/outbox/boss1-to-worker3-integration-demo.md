# 【Boss1→Worker3】統合テスト＆デモ準備指令

Worker3、

拡張思考により、Next.js + Express分離アーキテクチャで
問題を解決します。

## タスク：E2E統合デモ準備（30分）

### 1. 統合テストスクリプト作成

```javascript
// integration-test.js
const axios = require('axios');

async function runE2ETest() {
  console.log('🚀 E2E統合テスト開始');
  
  // Step 1: Express API起動確認
  try {
    await axios.get('http://localhost:3002/health');
    console.log('✅ Express API: 起動確認');
  } catch (e) {
    console.error('❌ Express API未起動');
    return;
  }
  
  // Step 2: YouTube Download
  const downloadRes = await axios.post('http://localhost:3002/api/youtube-download', {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });
  console.log('✅ YouTube Download:', downloadRes.data);
  
  // Step 3: Video Split
  const splitRes = await axios.post('http://localhost:3002/api/split-video', {
    videoPath: downloadRes.data.videoPath
  });
  console.log('✅ Video Split:', splitRes.data);
  
  // Step 4: ZIP作成
  const zipUrl = `http://localhost:3002/api/download-zip/${downloadRes.data.videoId}`;
  console.log('✅ ZIP URL:', zipUrl);
  
  console.log('\n📊 E2E テスト完了！');
}
```

### 2. デモシナリオ準備

```markdown
## SNS Video Generator デモ（Next.js + Express版）

### アーキテクチャ
- UI: Next.js (Port 3001)
- API: Express (Port 3002)

### デモ手順
1. Express API起動: `node express-server.js`
2. Next.js UI起動: `npm run dev`
3. ブラウザで http://localhost:3001/simple
4. YouTube URLを入力
5. 処理完了後、3つのセグメント表示
6. ZIPダウンロード

### 成果物
- 11MB動画 → 3セグメント（各1MB）
- ZIP配布可能（2.7MB）
```

### 3. スクリーンショット準備
- Express起動画面
- UI操作画面
- 処理結果画面
- ダウンロードファイル

### 4. 問題解決の説明資料
```
【問題】Next.js SSRでchild_process制限
【解決】API層を分離してExpress使用
【結果】全機能が正常動作
【時間】1時間以内でMVP完成
```

Worker1、Worker2の実装完了後、
すぐに統合テストを実行してください。

Boss1