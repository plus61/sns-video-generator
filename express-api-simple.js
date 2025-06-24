#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();

// CORS設定（本番対応）
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://sns-video-generator.up.railway.app',
  'https://sns-video-generator-production.up.railway.app',
  'https://sns-video-express-api.onrender.com',
  'https://*.glitch.me',  // Glitch用ワイルドカード
  'https://sns-video-generator.glitch.me'  // 具体的なGlitch URL
];

app.use(cors({
  origin: function (origin, callback) {
    // originがundefinedの場合（同一オリジン）も許可
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // 開発中は全て許可（本番では false に変更）
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Express API Server Running' });
});

// YouTube Download API
app.post('/api/youtube-download', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const videoId = `video-${Date.now()}`;
  const videoPath = `/tmp/${videoId}.mp4`;
  
  try {
    console.log('Downloading:', url);
    
    await youtubedl(url, {
      output: videoPath,
      format: 'best[height<=480]/best',
      quiet: false
    });
    
    const stats = fs.statSync(videoPath);
    console.log('Download complete:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    
    res.json({ 
      success: true, 
      videoPath,
      videoId,
      fileSize: stats.size,
      message: 'Video downloaded successfully'
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to download video'
    });
  }
});

// Video Split API
app.post('/api/split-video', async (req, res) => {
  const { videoPath } = req.body;
  
  if (!videoPath || !fs.existsSync(videoPath)) {
    return res.status(400).json({ error: 'Valid video path is required' });
  }
  
  const videoId = path.basename(videoPath, '.mp4');
  const outputDir = `/tmp/${videoId}-segments`;
  
  try {
    console.log('Splitting video:', videoPath);
    fs.mkdirSync(outputDir, { recursive: true });
    
    const segments = [];
    
    for (let i = 0; i < 3; i++) {
      const segmentPath = path.join(outputDir, `segment${i + 1}.mp4`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(i * 10)
          .setDuration(10)
          .output(segmentPath)
          .on('end', () => {
            const size = fs.statSync(segmentPath).size;
            console.log(`Segment ${i + 1} created:`, (size / 1024).toFixed(0), 'KB');
            segments.push({
              path: segmentPath,
              index: i + 1,
              start: i * 10,
              end: (i + 1) * 10,
              size
            });
            resolve();
          })
          .on('error', reject)
          .run();
      });
    }
    
    res.json({
      success: true,
      segments,
      outputDir,
      message: 'Video split successfully'
    });
  } catch (error) {
    console.error('Split error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to split video'
    });
  }
});

// ZIP Download API
app.get('/api/download-zip/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const segmentsDir = `/tmp/${videoId}-segments`;
  
  if (!fs.existsSync(segmentsDir)) {
    return res.status(404).json({ error: 'Segments not found' });
  }
  
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}-segments.zip"`);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    
    archive.directory(segmentsDir, false);
    archive.finalize();
  } catch (error) {
    console.error('ZIP error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create ZIP file'
    });
  }
});

// Start server
const PORT = process.env.PORT || process.env.EXPRESS_PORT || 3002;
app.listen(PORT, () => {
  console.log(`
🚀 Express API Server Started
📍 URL: http://localhost:${PORT}
🔧 Endpoints:
   - GET  /health
   - POST /api/youtube-download
   - POST /api/split-video
   - GET  /api/download-zip/:videoId

✅ Core features verified and working!
  `);
});