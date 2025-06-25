/**
 * シンプルな動画処理実装
 * - キューシステムを使わない
 * - 直接的な同期処理
 * - エラーハンドリング込み
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// YouTube動画ダウンロード（シンプル版）
async function downloadVideo(url) {
  console.log(`📥 Downloading: ${url}`);
  
  const outputPath = `/tmp/video-${Date.now()}.mp4`;
  
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', outputPath,
      '--format', 'best[height<=480]/best',
      '--no-check-certificates',
      '--quiet',
      '--no-warnings'
    ]);
    
    let errorOutput = '';
    
    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ytdlp.on('close', async (code) => {
      if (code === 0) {
        try {
          const stats = await fs.stat(outputPath);
          console.log(`✅ Downloaded: ${stats.size} bytes`);
          resolve({
            path: outputPath,
            size: stats.size
          });
        } catch (err) {
          reject(new Error('Downloaded file not found'));
        }
      } else {
        reject(new Error(`Download failed: ${errorOutput}`));
      }
    });
    
    // タイムアウト: 60秒
    setTimeout(() => {
      ytdlp.kill('SIGTERM');
      reject(new Error('Download timeout after 60 seconds'));
    }, 60000);
  });
}

// 動画分割（シンプル版）
async function splitVideo(videoPath, duration = 30) {
  console.log(`✂️ Splitting video: ${videoPath}`);
  
  const segments = [];
  const outputDir = `/tmp/segments-${Date.now()}`;
  await fs.mkdir(outputDir, { recursive: true });
  
  // FFmpegで動画長を取得
  const videoLength = await getVideoDuration(videoPath);
  const segmentCount = Math.ceil(videoLength / duration);
  
  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * duration;
    const outputPath = path.join(outputDir, `segment-${i}.mp4`);
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        '-y',
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          segments.push({
            index: i,
            path: outputPath,
            startTime,
            duration
          });
          resolve();
        } else {
          reject(new Error(`FFmpeg failed for segment ${i}`));
        }
      });
    });
  }
  
  console.log(`✅ Created ${segments.length} segments`);
  return segments;
}

// 動画の長さを取得
async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);
    
    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0) {
        resolve(parseFloat(output));
      } else {
        reject(new Error('Failed to get video duration'));
      }
    });
  });
}

// メイン処理関数
async function processVideo(url) {
  console.log('🚀 Starting simple video processing...');
  
  try {
    // 1. ダウンロード
    const video = await downloadVideo(url);
    
    // 2. 分割
    const segments = await splitVideo(video.path);
    
    // 3. クリーンアップ
    await fs.unlink(video.path).catch(() => {});
    
    return {
      success: true,
      segments,
      message: `Successfully processed ${segments.length} segments`
    };
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    return {
      success: false,
      error: error.message,
      segments: []
    };
  }
}

// エクスポート
module.exports = {
  downloadVideo,
  splitVideo,
  processVideo
};

// CLIとして実行された場合
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node simple-video-processor.js <youtube-url>');
    process.exit(1);
  }
  
  processVideo(url)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}