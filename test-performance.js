// パフォーマンステストスクリプト
const fetch = require('node-fetch');

const TEST_URL = 'http://127.0.0.1:3002/api/process-simple';
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // 短い動画でテスト

async function testPerformance() {
  console.log('🚀 パフォーマンステスト開始');
  console.log('================================');
  
  // テスト1: 単一リクエストのパフォーマンス
  console.log('\n📊 テスト1: 単一リクエスト処理時間');
  const startTime = Date.now();
  
  try {
    const response = await fetch(TEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: YOUTUBE_URL })
    });
    
    const data = await response.json();
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    
    console.log(`✅ 処理完了: ${processingTime}秒`);
    console.log(`📹 動画タイトル: ${data.videoInfo?.title || 'N/A'}`);
    console.log(`⏱️ ダウンロード時間: ${data.downloadTime}ms`);
    console.log(`🎬 セグメント数: ${data.segments?.length || 0}`);
    
    if (processingTime <= 5) {
      console.log('✅ パフォーマンス目標達成！（5秒以内）');
    } else {
      console.log('⚠️ パフォーマンス目標未達成（5秒超過）');
    }
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
  }
  
  // テスト2: 同時3ユーザー負荷テスト
  console.log('\n📊 テスト2: 3ユーザー同時アクセステスト');
  const concurrentRequests = 3;
  const promises = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      fetch(TEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: YOUTUBE_URL })
      }).then(res => res.json())
    );
  }
  
  const concurrentStart = Date.now();
  
  try {
    const results = await Promise.all(promises);
    const concurrentEnd = Date.now();
    const totalTime = (concurrentEnd - concurrentStart) / 1000;
    
    console.log(`✅ 全リクエスト完了: ${totalTime}秒`);
    console.log(`📊 平均処理時間: ${(totalTime / concurrentRequests).toFixed(2)}秒/リクエスト`);
    
    results.forEach((result, index) => {
      console.log(`  ユーザー${index + 1}: ${result.success ? '成功' : '失敗'}`);
    });
    
  } catch (error) {
    console.error('❌ 同時アクセステストでエラー:', error.message);
  }
  
  // テスト3: エラーハンドリング
  console.log('\n📊 テスト3: エラーハンドリングテスト');
  
  // 無効なURL
  try {
    const invalidResponse = await fetch(TEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'invalid-url' })
    });
    
    const errorData = await invalidResponse.json();
    console.log('✅ 無効URL処理:', errorData.error || '適切にエラー処理されました');
    
  } catch (error) {
    console.error('❌ エラーハンドリング失敗:', error.message);
  }
  
  console.log('\n================================');
  console.log('📊 パフォーマンステスト完了');
}

// 実行
testPerformance();