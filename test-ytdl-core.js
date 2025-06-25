#!/usr/bin/env node

/**
 * ytdl-core動作テスト
 */

const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

async function testYtdlCore() {
  console.log('🎬 ytdl-core動作テスト開始...\n');
  
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const outputPath = '/tmp/test-ytdl.mp4';
  
  try {
    // 動画情報取得
    console.log('📊 動画情報取得中...');
    const info = await ytdl.getInfo(url);
    console.log('✅ タイトル:', info.videoDetails.title);
    console.log('✅ 長さ:', info.videoDetails.lengthSeconds, '秒');
    
    // フォーマット選択
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowest' });
    console.log('✅ 選択フォーマット:', format.qualityLabel || format.quality);
    
    // ダウンロード
    console.log('\n⏳ ダウンロード開始...');
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { format });
      const writeStream = fs.createWriteStream(outputPath);
      
      let downloadedBytes = 0;
      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        process.stdout.write(`\r📥 ダウンロード中: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
      });
      
      stream.pipe(writeStream);
      
      stream.on('error', (err) => {
        console.error('\n❌ ストリームエラー:', err.message);
        reject(err);
      });
      
      writeStream.on('error', (err) => {
        console.error('\n❌ 書き込みエラー:', err.message);
        reject(err);
      });
      
      writeStream.on('finish', () => {
        console.log('\n');
        resolve();
      });
    });
    
    const downloadTime = Date.now() - startTime;
    
    // ファイル確認
    const stats = fs.statSync(outputPath);
    console.log('✅ ダウンロード完了!');
    console.log(`📁 ファイルサイズ: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  ダウンロード時間: ${(downloadTime / 1000).toFixed(2)} 秒`);
    
    // クリーンアップ
    fs.unlinkSync(outputPath);
    console.log('🗑️  テストファイル削除完了');
    
    return true;
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    console.error('詳細:', error.stack);
    return false;
  }
}

// メイン実行
async function main() {
  const success = await testYtdlCore();
  
  console.log('\n📊 テスト結果:', success ? '✅ 成功' : '❌ 失敗');
  process.exit(success ? 0 : 1);
}

main();