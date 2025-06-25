#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

// 固定時間分割のテスト
async function testFixedSplit() {
  console.log('🎬 Fixed Time Split Test Starting...\n');
  
  // テスト動画のパスを確認
  const testVideoPath = path.join(__dirname, 'test-assets', 'sample.mp4');
  
  try {
    await fs.access(testVideoPath);
    console.log('✅ Test video found:', testVideoPath);
  } catch (error) {
    console.error('❌ Test video not found:', testVideoPath);
    console.log('Please ensure test-assets/sample.mp4 exists');
    return;
  }

  // 出力ディレクトリを作成
  const outputDir = path.join(__dirname, 'test-output', `split_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  console.log('📁 Output directory created:', outputDir);

  // FFmpegのパスを確認
  const ffmpegPath = process.env.FFMPEG_PATH || 
    (process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : '/usr/bin/ffmpeg');
  
  console.log('🔧 FFmpeg path:', ffmpegPath);
  
  // FFmpegの存在確認
  try {
    const ffmpegCheck = spawn(ffmpegPath, ['-version']);
    ffmpegCheck.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg is available\n');
        performSplit();
      } else {
        console.error('❌ FFmpeg check failed');
      }
    });
  } catch (error) {
    console.error('❌ FFmpeg not found:', error.message);
    return;
  }

  // 実際の分割処理
  async function performSplit() {
    console.log('🎬 Starting video split...\n');
    
    // 10秒ごとに3つのセグメントを作成
    const segments = [
      { index: 1, start: 0, duration: 10 },
      { index: 2, start: 10, duration: 10 },
      { index: 3, start: 20, duration: 10 }
    ];

    for (const segment of segments) {
      const outputPath = path.join(outputDir, `segment_${segment.index}.mp4`);
      console.log(`📹 Creating segment ${segment.index}: ${segment.start}s - ${segment.start + segment.duration}s`);
      
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
          '-i', testVideoPath,
          '-ss', segment.start.toString(),
          '-t', segment.duration.toString(),
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-y',
          outputPath
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', async (code) => {
          if (code === 0) {
            try {
              const stats = await fs.stat(outputPath);
              console.log(`✅ Segment ${segment.index} created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              resolve();
            } catch (error) {
              console.error(`❌ Segment ${segment.index} failed:`, error.message);
              reject(error);
            }
          } else {
            console.error(`❌ FFmpeg error for segment ${segment.index}:`, stderr.slice(-500));
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
      }).catch(err => {
        console.error(`Failed to create segment ${segment.index}:`, err.message);
      });
    }

    console.log('\n✅ Video split test completed!');
    console.log(`📁 Output files in: ${outputDir}`);
    
    // ファイルリストを表示
    const files = await fs.readdir(outputDir);
    console.log('\n📋 Created files:');
    for (const file of files) {
      const stats = await fs.stat(path.join(outputDir, file));
      console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
}

// テスト実行
testFixedSplit().catch(console.error);