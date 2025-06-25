# 【Boss1→Worker1】Express APIサーバー実装指令

Worker1、

拡張思考により、Next.js統合問題を回避する解決策を見つけました。

## 新アプローチ：Express.js独立APIサーバー

### 実装内容（30分以内）

```javascript
// express-server.js
const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// YouTube Download API
app.post('/api/youtube-download', async (req, res) => {
  const { url } = req.body;
  const videoId = `video-${Date.now()}`;
  const outputPath = `/tmp/${videoId}.mp4`;
  
  try {
    await youtubedl(url, {
      output: outputPath,
      format: 'best[height<=480]/best'
    });
    
    res.json({ 
      success: true, 
      videoPath: outputPath,
      videoId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Split API
app.post('/api/split-video', async (req, res) => {
  const { videoPath } = req.body;
  // FFmpeg分割ロジック（Worker2から借用）
  // ...
});

// ZIP Download API
app.get('/api/download-zip/:videoId', async (req, res) => {
  // ZIP作成ロジック
  // ...
});

app.listen(3002, () => {
  console.log('Express API Server running on :3002');
});
```

### アーキテクチャ
```
Next.js (3001) → UI専用
   ↓ fetch
Express (3002) → API専用（child_process可能）
```

### 実装手順
1. `express-server.js`作成
2. 必要パッケージインストール
3. 3つのAPIエンドポイント実装
4. PM2でプロセス管理

### 利点
- child_process制限なし
- 即座に動作確認可能
- Next.js問題を完全回避
- 1時間以内にMVP提供可能

すぐに実装を開始してください。

Boss1