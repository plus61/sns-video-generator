#!/usr/bin/env node

/**
 * 超シンプルテスト - 動作確認のみ
 */

const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw' // 19秒の短い動画

async function quickTest() {
  console.log('🚀 Quick Download Test');
  console.log('=====================');
  console.log(`URL: ${testUrl}`);
  console.log('');

  try {
    console.log('⏳ Downloading...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/process-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (response.ok) {
      const data = await response.json();
      console.log('');
      console.log('✅ ダウンロード成功！');
      console.log(`⏱️  処理時間: ${elapsed}秒`);
      console.log(`📁 保存先: ${data.videoPath}`);
      console.log(`📊 サイズ: ${(data.fileSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🎬 セグメント数: ${data.segments.length}`);
    } else {
      const error = await response.json();
      console.log('❌ エラー:', error.error);
    }
  } catch (error) {
    console.error('❌ ネットワークエラー:', error.message);
  }
}

quickTest();