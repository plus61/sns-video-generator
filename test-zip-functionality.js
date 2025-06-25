#!/usr/bin/env node

/**
 * ZIP機能テスト - Worker3
 * archiverパッケージを使用した複数ファイルのZIP化
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🔧 ZIP機能テスト開始...\n');

// テスト1: 基本的なZIP作成
async function testBasicZip() {
  console.log('📦 Test 1: 基本的なZIP作成');
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('test-output.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高圧縮
    });

    output.on('close', () => {
      console.log(`✅ ZIPファイル作成成功: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('❌ エラー:', err);
      reject(err);
    });

    archive.pipe(output);

    // テストファイル追加
    archive.append('Hello World!', { name: 'hello.txt' });
    archive.append(JSON.stringify({ test: true }), { name: 'data.json' });
    
    archive.finalize();
  });
}

// テスト2: 動画ファイルのZIP化（ストリーミング）
async function testVideoZip() {
  console.log('\n📹 Test 2: 動画ファイルのZIP化');
  
  // ダミー動画ファイル作成
  const dummyVideos = [
    { name: 'tiktok-output.mp4', size: 1024 * 1024 * 5 }, // 5MB
    { name: 'instagram-output.mp4', size: 1024 * 1024 * 8 }, // 8MB
    { name: 'youtube-output.mp4', size: 1024 * 1024 * 10 } // 10MB
  ];

  // ダミーファイル作成
  for (const video of dummyVideos) {
    const buffer = Buffer.alloc(video.size);
    fs.writeFileSync(video.name, buffer);
    console.log(`📄 作成: ${video.name} (${(video.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('videos-output.zip');
    const archive = archiver('zip', {
      zlib: { level: 6 } // バランス重視
    });

    const startTime = Date.now();

    output.on('close', () => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`✅ 動画ZIP作成成功: ${(archive.pointer() / 1024 / 1024).toFixed(2)}MB in ${duration}秒`);
      
      // クリーンアップ
      dummyVideos.forEach(v => fs.unlinkSync(v.name));
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // ストリーミングでファイル追加
    dummyVideos.forEach(video => {
      archive.file(video.name, { name: video.name });
    });

    archive.finalize();
  });
}

// テスト3: メモリ効率的な大容量ファイル処理
async function testStreamingZip() {
  console.log('\n🌊 Test 3: ストリーミングZIP（メモリ効率）');
  
  const outputPath = 'streaming-output.zip';
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 6 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('✅ ストリーミングZIP完成');
      fs.unlinkSync(outputPath); // クリーンアップ
      resolve();
    });

    archive.on('error', reject);
    archive.on('progress', (progress) => {
      console.log(`📊 進捗: ${progress.entries.processed}/${progress.entries.total}`);
    });

    archive.pipe(output);

    // ReadStreamを使用してメモリ効率化
    const readStream = fs.createReadStream(__filename);
    archive.append(readStream, { name: 'source.js' });

    archive.finalize();
  });
}

// 実装提案
function showImplementationPlan() {
  console.log('\n📋 実装計画:');
  console.log(`
const archiver = require('archiver');

// ダウンロードAPI実装例
app.get('/api/download/:id', async (req, res) => {
  const { id } = req.params;
  
  // ヘッダー設定
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', \`attachment; filename="videos-\${id}.zip"\`);
  
  // ZIP作成
  const archive = archiver('zip', { zlib: { level: 6 } });
  
  archive.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
  
  // レスポンスにパイプ
  archive.pipe(res);
  
  // ファイル追加
  const files = await getVideoFiles(id); // 実装必要
  files.forEach(file => {
    archive.file(file.path, { name: file.name });
  });
  
  // 完了
  archive.finalize();
});
  `);
}

// 全テスト実行
async function runAllTests() {
  try {
    await testBasicZip();
    await testVideoZip();
    await testStreamingZip();
    showImplementationPlan();
    
    console.log('\n✅ 全テスト完了！実装準備OK');
  } catch (error) {
    console.error('❌ テスト失敗:', error);
  }
}

// archiverがインストールされているか確認
try {
  require.resolve('archiver');
  runAllTests();
} catch (e) {
  console.log('📦 archiverをインストール中...');
  require('child_process').execSync('npm install archiver', { stdio: 'inherit' });
  console.log('✅ インストール完了！');
  runAllTests();
}