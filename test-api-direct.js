#!/usr/bin/env node

// APIを直接呼び出さず、コア機能を直接テスト

const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

async function testCoreFeatures() {
  console.log('🔍 Core Features Direct Test\n');
  
  const videoId = `test-${Date.now()}`;
  const videoPath = `/tmp/${videoId}.mp4`;
  const outputDir = `/tmp/${videoId}-segments`;
  
  try {
    // 1. YouTube Download Test
    console.log('1️⃣ Testing YouTube Download...');
    await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      output: videoPath,
      format: 'best[height<=480]/best',
      quiet: false
    });
    
    const stats = fs.statSync(videoPath);
    console.log(`✅ Download Success: ${(stats.size / 1024 / 1024).toFixed(2)}MB\n`);
    
    // 2. FFmpeg Split Test
    console.log('2️⃣ Testing Video Split...');
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
            console.log(`   ✅ Segment ${i + 1}: ${(size / 1024).toFixed(0)}KB`);
            segments.push(segmentPath);
            resolve();
          })
          .on('error', reject)
          .run();
      });
    }
    
    console.log('\n✅ All Core Features Working!');
    console.log('📁 Files created:');
    console.log(`   Video: ${videoPath}`);
    console.log(`   Segments: ${outputDir}`);
    
    return {
      success: true,
      videoPath,
      segments,
      message: 'Core features are functional - API layer issue only'
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 実行
testCoreFeatures().then(result => {
  console.log('\n📊 Result:', JSON.stringify(result, null, 2));
});