// 実動画処理機能の動作確認スクリプト

const fetch = require('node-fetch');

async function verifyVideoProcessing() {
  console.log('🎬 実動画処理機能の動作確認開始...\n');

  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const apiEndpoint = 'http://localhost:3000/api/process-simple';

  try {
    console.log('1. APIエンドポイントの確認...');
    const healthCheck = await fetch(apiEndpoint, { method: 'GET' });
    const healthData = await healthCheck.json();
    console.log('✅ エンドポイント確認:', healthData.status);
    console.log('   説明:', healthData.description);
    console.log('');

    console.log('2. 実動画処理のテスト...');
    console.log('   URL:', testUrl);
    console.log('   処理中...');
    
    const startTime = Date.now();
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 処理成功！');
      console.log('');
      console.log('📊 処理結果:');
      console.log('   - 処理時間:', processingTime.toFixed(2), '秒');
      console.log('   - ビデオID:', result.videoId);
      console.log('   - YouTube ID:', result.youtubeVideoId);
      console.log('   - 処理タイプ:', result.message);
      console.log('   - ファイルサイズ:', result.fileSize ? `${(result.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A');
      console.log('');
      
      if (result.segments && result.segments.length > 0) {
        console.log('📹 生成されたセグメント:');
        result.segments.forEach((segment, index) => {
          console.log(`   セグメント${index + 1}:`);
          console.log(`     - 時間: ${segment.start}秒 - ${segment.end}秒`);
          console.log(`     - タイプ: ${segment.type}`);
          console.log(`     - スコア: ${segment.score}`);
          if (segment.path) {
            console.log(`     - パス: ${segment.path.split('/').pop()}`);
          }
        });
      }
      
      console.log('');
      console.log('📝 サマリー:', result.summary);
      
      // 成功判定
      const isRealVideo = result.message && result.message.includes('Real video');
      const isMock = result.message && result.message.includes('mock');
      
      console.log('');
      console.log('🎯 処理モード:', isRealVideo ? '実動画処理' : 'モック処理（フォールバック）');
      
    } else {
      console.log('❌ 処理失敗');
      console.log('   エラー:', result.error || '不明なエラー');
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    console.log('\n⚠️  開発サーバーが起動していることを確認してください。');
    console.log('   npm run dev でサーバーを起動後、再度実行してください。');
  }

  console.log('\n========================================');
  console.log('✅ 実動画処理機能の検証完了');
  console.log('========================================');
}

// 実行
verifyVideoProcessing();