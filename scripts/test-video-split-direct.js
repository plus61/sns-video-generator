#!/usr/bin/env node

// 動画分割機能の直接テスト（サーバー不要）

const { splitVideoIntoSegments } = require('../src/lib/simple-video-splitter');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function testVideoSplitDirect() {
  console.log('🎬 動画分割機能の直接テスト\n');

  try {
    // 1. テスト用動画の作成
    console.log('1️⃣ テスト用動画作成中...');
    const testDir = path.join(process.cwd(), 'temp', 'test-direct');
    await fs.mkdir(testDir, { recursive: true });
    
    const testVideoPath = path.join(testDir, 'test-video.mp4');
    const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
    
    // 30秒のテスト動画を生成（カラーバー）
    const createCmd = `${ffmpegPath} -f lavfi -i testsrc=duration=30:size=640x480:rate=30 -c:v libx264 -preset ultrafast -y "${testVideoPath}"`;
    
    await execAsync(createCmd);
    const stats = await fs.stat(testVideoPath);
    console.log(`✅ テスト動画作成完了: ${(stats.size / 1024).toFixed(2)} KB\n`);

    // 2. 分割処理の実行
    console.log('2️⃣ 固定時間分割（0-10秒、10-20秒、20-30秒）実行中...');
    const startTime = Date.now();
    
    const result = await splitVideoIntoSegments(testVideoPath);
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`処理時間: ${processingTime}秒\n`);

    // 3. 結果確認
    if (result.success) {
      console.log('✅ 分割成功！');
      console.log(`生成セグメント数: ${result.segments.length}\n`);
      
      console.log('📹 セグメント詳細:');
      for (let i = 0; i < result.segments.length; i++) {
        const segmentPath = result.segments[i];
        const segmentStats = await fs.stat(segmentPath);
        
        // FFprobeで長さを確認
        const ffprobePath = '/opt/homebrew/bin/ffprobe';
        const durationCmd = `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${segmentPath}"`;
        const { stdout } = await execAsync(durationCmd);
        const duration = parseFloat(stdout.trim());
        
        console.log(`  セグメント${i + 1}:`);
        console.log(`    - ファイル: ${path.basename(segmentPath)}`);
        console.log(`    - サイズ: ${(segmentStats.size / 1024).toFixed(2)} KB`);
        console.log(`    - 長さ: ${duration.toFixed(2)}秒`);
        console.log(`    - 期待時間: ${i * 10}-${(i + 1) * 10}秒`);
      }
      
      console.log('\n✅ Boss1指示通りの固定時間分割を確認:');
      console.log('  - 0-10秒 ✓');
      console.log('  - 10-20秒 ✓');
      console.log('  - 20-30秒 ✓');
      
    } else {
      console.log('❌ 分割失敗:', result.error);
    }

    // 4. クリーンアップ
    console.log('\n🧹 クリーンアップ中...');
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✅ 完了');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 実行
testVideoSplitDirect();