#!/usr/bin/env node

/**
 * FFmpeg & youtube-dl-exec統合テスト
 * Worker2のサポート用
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testFFmpegIntegration() {
  console.log('🧪 FFmpeg & youtube-dl-exec Integration Test');
  console.log('==========================================\n');

  // 1. FFmpegパス確認
  console.log('1️⃣ Checking FFmpeg installation...');
  try {
    const { stdout: ffmpegPath } = await execAsync('which ffmpeg');
    console.log(`✅ FFmpeg found: ${ffmpegPath.trim()}`);
    
    const { stdout: ffmpegVersion } = await execAsync('ffmpeg -version | head -1');
    console.log(`   Version: ${ffmpegVersion.trim()}`);
  } catch (error) {
    console.error('❌ FFmpeg not found!');
    console.log('   Please install: brew install ffmpeg');
    return;
  }

  // 2. youtube-dl-exec確認
  console.log('\n2️⃣ Checking youtube-dl-exec...');
  try {
    const ytdl = require('youtube-dl-exec');
    console.log('✅ youtube-dl-exec module loaded');
    
    // バージョン確認
    const { stdout } = await ytdl.exec('--version');
    console.log(`   Version: ${stdout.trim()}`);
  } catch (error) {
    console.error('❌ youtube-dl-exec error:', error.message);
    console.log('   Please install: npm install youtube-dl-exec');
    return;
  }

  // 3. APIテスト
  console.log('\n3️⃣ Testing API endpoints...');
  
  // process-simple エンドポイント
  try {
    const response = await fetch('http://localhost:3000/api/process-simple');
    const data = await response.json();
    console.log('✅ /api/process-simple:', data.status);
  } catch (error) {
    console.log('⚠️  /api/process-simple not available (server not running?)');
  }

  // split-simple エンドポイント
  try {
    const response = await fetch('http://localhost:3000/api/split-simple');
    const data = await response.json();
    console.log('✅ /api/split-simple:', data.status);
  } catch (error) {
    console.log('⚠️  /api/split-simple not available (server not running?)');
  }

  console.log('\n==========================================');
  console.log('✅ Integration test complete!');
  console.log('Ready to support Worker2\'s implementation');
}

// 実行
testFFmpegIntegration().catch(console.error);