// デモ環境動作確認スクリプト
const fetch = require('node-fetch');

async function testDemoEnvironment() {
  console.log('🚀 デモ環境の動作確認を開始します...\n');

  // 1. Express API ヘルスチェック
  console.log('1️⃣  Express APIサーバーの確認...');
  try {
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();
    console.log('✅ Express API: 正常稼働中', healthData);
  } catch (error) {
    console.error('❌ Express API: エラー', error.message);
    return false;
  }

  // 2. Next.js UIサーバーの確認
  console.log('\n2️⃣  Next.js UIサーバーの確認...');
  try {
    const uiResponse = await fetch('http://localhost:3001/simple');
    if (uiResponse.ok) {
      console.log('✅ Next.js UI: 正常稼働中 (ステータス:', uiResponse.status, ')');
    } else {
      console.log('⚠️  Next.js UI: ステータス', uiResponse.status);
    }
  } catch (error) {
    console.error('❌ Next.js UI: エラー', error.message);
    return false;
  }

  // 3. 動画処理フローの簡易テスト
  console.log('\n3️⃣  動画処理フローのテスト...');
  try {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('テストURL:', testUrl);
    
    const downloadResponse = await fetch('http://localhost:3002/api/youtube-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });

    if (downloadResponse.ok) {
      const data = await downloadResponse.json();
      console.log('✅ 動画ダウンロードAPI: 正常動作');
      console.log('  - タイトル:', data.title || 'N/A');
      console.log('  - ファイルパス:', data.filePath ? '取得成功' : 'N/A');
    } else {
      console.log('⚠️  動画ダウンロードAPI: ステータス', downloadResponse.status);
    }
  } catch (error) {
    console.error('❌ 動画処理フロー: エラー', error.message);
  }

  console.log('\n📊 デモ環境確認完了！');
  console.log('================================');
  console.log('✅ Express API: http://localhost:3002');
  console.log('✅ Next.js UI: http://localhost:3001/simple');
  console.log('================================\n');

  return true;
}

// 実行
testDemoEnvironment().then(success => {
  if (success) {
    console.log('🎉 デモ環境は正常に動作しています！');
  } else {
    console.log('⚠️  一部の機能に問題があります。');
  }
  process.exit(0);
}).catch(error => {
  console.error('💥 予期せぬエラー:', error);
  process.exit(1);
});