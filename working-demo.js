#!/usr/bin/env node

const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

async function createWorkingDemo() {
  console.log('🚀 SNS Video Generator - 動作デモ開始\n');
  
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const videoId = 'demo-' + Date.now();
  const videoPath = `/tmp/${videoId}.mp4`;
  const outputDir = `/tmp/${videoId}-segments`;
  
  try {
    // 1. YouTube動画ダウンロード
    console.log('1️⃣ YouTube動画をダウンロード中...');
    console.log(`   URL: ${url}`);
    
    await youtubedl(url, {
      output: videoPath,
      format: 'best[height<=480]/best',
      quiet: false
    });
    
    const stats = fs.statSync(videoPath);
    console.log(`✅ ダウンロード完了: ${(stats.size / 1024 / 1024).toFixed(2)}MB\n`);
    
    // 2. 動画を3つのセグメントに分割
    console.log('2️⃣ 動画を3つのセグメントに分割中...');
    fs.mkdirSync(outputDir, { recursive: true });
    
    const segments = [
      { start: 0, end: 10, name: 'segment1' },
      { start: 10, end: 20, name: 'segment2' },
      { start: 20, end: 30, name: 'segment3' }
    ];
    
    for (const segment of segments) {
      const outputPath = path.join(outputDir, `${segment.name}.mp4`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(segment.start)
          .setDuration(segment.end - segment.start)
          .output(outputPath)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-preset fast',
            '-movflags +faststart'
          ])
          .on('end', () => {
            const size = fs.statSync(outputPath).size;
            console.log(`   ✅ ${segment.name}: ${segment.start}-${segment.end}秒 (${(size / 1024).toFixed(0)}KB)`);
            resolve();
          })
          .on('error', reject)
          .run();
      });
    }
    
    console.log('');
    
    // 3. ZIPファイル作成
    console.log('3️⃣ ZIPファイルを作成中...');
    const zipPath = `/tmp/${videoId}-segments.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });
    
    const zipStats = fs.statSync(zipPath);
    console.log(`✅ ZIP作成完了: ${(zipStats.size / 1024).toFixed(0)}KB\n`);
    
    // 4. 結果サマリー
    console.log('📊 実行結果サマリー');
    console.log('─────────────────────────────────');
    console.log(`元動画: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`セグメント数: 3個`);
    console.log(`ZIP ファイル: ${zipPath}`);
    console.log(`ZIPサイズ: ${(zipStats.size / 1024).toFixed(0)}KB`);
    console.log('─────────────────────────────────');
    console.log('\n✅ デモ完了！全機能が正常に動作しています。');
    
    // 証拠のスクリーンショット用にファイル一覧表示
    console.log('\n📁 作成されたファイル:');
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      const fileStats = fs.statSync(filePath);
      console.log(`   ${file} - ${(fileStats.size / 1024).toFixed(0)}KB`);
    });
    
    // クリーンアップ（コメントアウトして証拠を残す）
    // fs.rmSync(videoPath);
    // fs.rmSync(outputDir, { recursive: true });
    // fs.rmSync(zipPath);
    
    return {
      success: true,
      videoPath,
      segments: files,
      zipPath,
      message: 'E2E処理が正常に完了しました'
    };
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 実行
createWorkingDemo().then(result => {
  console.log('\n📝 最終結果:', JSON.stringify(result, null, 2));
});