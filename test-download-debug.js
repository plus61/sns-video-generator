#!/usr/bin/env node

/**
 * YouTube動画ダウンロードデバッグテスト
 */

const youtubedl = require('youtube-dl-exec');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

async function testYoutubeDlExec() {
  console.log('=== youtube-dl-exec テスト ===\n');
  
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const outputPath = '/tmp/test-ydl-exec.mp4';
  
  try {
    console.log('実行オプション:');
    const options = {
      output: outputPath,
      format: 'best[height<=480]/best',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    };
    console.log(JSON.stringify(options, null, 2));
    
    console.log('\n実行中...');
    const startTime = Date.now();
    
    await youtubedl(url, options);
    
    const stats = fs.statSync(outputPath);
    const elapsed = Date.now() - startTime;
    
    console.log('\n✅ 成功!');
    console.log(`ファイルサイズ: ${stats.size} bytes`);
    console.log(`実行時間: ${elapsed}ms`);
    
    // クリーンアップ
    fs.unlinkSync(outputPath);
    
    return true;
  } catch (error) {
    console.error('\n❌ エラー発生:');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    console.error('エラーコード:', error.code);
    console.error('標準エラー出力:', error.stderr);
    console.error('スタックトレース:', error.stack);
    
    return false;
  }
}

async function testYtdlCore() {
  console.log('\n\n=== ytdl-core テスト ===\n');
  
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const outputPath = '/tmp/test-ytdl-core.mp4';
  
  try {
    console.log('動画情報取得中...');
    const info = await ytdl.getInfo(url);
    console.log('✅ 動画タイトル:', info.videoDetails.title);
    console.log('動画長さ:', info.videoDetails.lengthSeconds, '秒');
    
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowest' });
    console.log('選択フォーマット:', format.qualityLabel || format.quality);
    
    console.log('\nダウンロード中...');
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { format });
      const writeStream = fs.createWriteStream(outputPath);
      
      stream.pipe(writeStream);
      stream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
    });
    
    const stats = fs.statSync(outputPath);
    const elapsed = Date.now() - startTime;
    
    console.log('\n✅ 成功!');
    console.log(`ファイルサイズ: ${stats.size} bytes`);
    console.log(`実行時間: ${elapsed}ms`);
    
    // クリーンアップ
    fs.unlinkSync(outputPath);
    
    return true;
  } catch (error) {
    console.error('\n❌ エラー発生:');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    console.error('詳細:', error);
    
    return false;
  }
}

async function main() {
  console.log('YouTube動画ダウンロードデバッグテスト\n');
  
  // 環境情報
  console.log('環境情報:');
  console.log('- Node.js:', process.version);
  console.log('- プラットフォーム:', process.platform);
  console.log('- 作業ディレクトリ:', process.cwd());
  console.log('- /tmp書き込み権限:', fs.existsSync('/tmp') ? '✅' : '❌');
  
  // youtube-dl-exec存在確認
  try {
    const { execSync } = require('child_process');
    const ytDlpVersion = execSync('yt-dlp --version', { encoding: 'utf8' }).trim();
    console.log('- yt-dlp:', ytDlpVersion);
  } catch {
    console.log('- yt-dlp: ❌ 未インストール');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // テスト実行
  const ydlSuccess = await testYoutubeDlExec();
  const ytdlSuccess = await testYtdlCore();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 テスト結果サマリー:');
  console.log('- youtube-dl-exec:', ydlSuccess ? '✅ 成功' : '❌ 失敗');
  console.log('- ytdl-core:', ytdlSuccess ? '✅ 成功' : '❌ 失敗');
  
  if (!ydlSuccess && !ytdlSuccess) {
    console.log('\n⚠️  両方のダウンロード方法が失敗しました');
    process.exit(1);
  }
}

main();