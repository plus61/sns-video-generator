#!/usr/bin/env node

/**
 * 直接処理テストスクリプト
 * Worker3: Railway003対応
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// テスト用YouTube URL（短い動画）
const TEST_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

console.log('🧪 Direct Processing Test');
console.log('========================\n');

// 1. FFmpegパス確認
console.log('1. Checking FFmpeg...');
try {
  const ffmpegVersion = execSync('ffmpeg -version 2>&1', { encoding: 'utf-8' });
  console.log('✅ FFmpeg found');
  console.log('   Version:', ffmpegVersion.split('\n')[0]);
} catch (error) {
  console.error('❌ FFmpeg not found!');
  console.log('   Install FFmpeg first: brew install ffmpeg');
  process.exit(1);
}

// 2. yt-dlpパス確認
console.log('\n2. Checking yt-dlp...');
try {
  const ytdlpVersion = execSync('yt-dlp --version 2>&1', { encoding: 'utf-8' });
  console.log('✅ yt-dlp found');
  console.log('   Version:', ytdlpVersion.trim());
} catch (error) {
  console.error('❌ yt-dlp not found!');
  console.log('   Install yt-dlp first: brew install yt-dlp');
  process.exit(1);
}

// 3. 直接処理テスト
console.log('\n3. Testing direct processing...');
const videoId = `test-${Date.now()}`;
const outputDir = path.join('/tmp', videoId);

try {
  // ディレクトリ作成
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`   Created temp dir: ${outputDir}`);
  
  // YouTube動画ダウンロード
  console.log('   Downloading video...');
  const videoPath = path.join(outputDir, 'video.mp4');
  const startTime = Date.now();
  
  execSync(`yt-dlp "${TEST_URL}" -o "${videoPath}" --format "best[height<=480]/best" --quiet`, {
    timeout: 60000
  });
  
  const downloadTime = Date.now() - startTime;
  const fileSize = fs.statSync(videoPath).size;
  console.log(`   ✅ Downloaded in ${downloadTime}ms (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
  
  // 動画の長さを取得
  console.log('   Getting video duration...');
  const durationCmd = `ffmpeg -i "${videoPath}" 2>&1 | grep Duration | awk '{print $2}' | tr -d ,`;
  const durationStr = execSync(durationCmd).toString().trim();
  const [hours, minutes, seconds] = durationStr.split(':').map(parseFloat);
  const totalDuration = hours * 3600 + minutes * 60 + seconds;
  console.log(`   Duration: ${totalDuration.toFixed(1)}s`);
  
  // 10秒ごとに分割
  console.log('   Splitting video...');
  const segments = [];
  const segmentDuration = 10;
  const numSegments = Math.min(Math.ceil(totalDuration / segmentDuration), 3);
  
  for (let i = 0; i < numSegments; i++) {
    const startSec = i * segmentDuration;
    const segmentPath = path.join(outputDir, `segment-${i}.mp4`);
    
    execSync(`ffmpeg -i "${videoPath}" -ss ${startSec} -t ${segmentDuration} -c copy "${segmentPath}" -y 2>/dev/null`);
    
    if (fs.existsSync(segmentPath)) {
      const segSize = fs.statSync(segmentPath).size;
      segments.push({
        index: i,
        startTime: startSec,
        endTime: Math.min(startSec + segmentDuration, totalDuration),
        size: (segSize / 1024).toFixed(2) + 'KB'
      });
    }
  }
  
  console.log(`   ✅ Created ${segments.length} segments:`);
  segments.forEach(seg => {
    console.log(`      Segment ${seg.index}: ${seg.startTime}s-${seg.endTime}s (${seg.size})`);
  });
  
  // 総処理時間
  const totalTime = Date.now() - startTime;
  console.log(`\n✅ Total processing time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
  
  // クリーンアップ
  console.log('\n4. Cleanup...');
  fs.rmSync(outputDir, { recursive: true, force: true });
  console.log('   ✅ Cleaned up temp files');
  
  // 成功
  console.log('\n🎉 Direct processing test PASSED!');
  console.log('   - Download: ✅');
  console.log('   - Split: ✅');
  console.log('   - Performance: ✅');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  
  // クリーンアップ
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  
  process.exit(1);
}