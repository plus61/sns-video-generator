const fs = require('fs');
const path = require('path');

// 統合テスト - 完全なフロー
async function runIntegrationTest() {
  console.log('🚀 Phase 4 統合テスト開始');
  console.log('========================\n');

  const testVideos = [
    {
      name: '教育コンテンツ',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      description: '短い教育動画'
    },
    {
      name: 'エンタメ動画',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: '音楽動画'
    },
    {
      name: 'テック解説',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      description: '技術説明動画'
    }
  ];

  const results = [];
  const baseUrl = 'http://localhost:3001';

  for (let i = 0; i < testVideos.length; i++) {
    const video = testVideos[i];
    console.log(`\n[${i + 1}/3] ${video.name} のテスト開始`);
    console.log(`URL: ${video.url}`);
    console.log(`説明: ${video.description}`);
    console.log('-----------------------------------');

    const testResult = {
      video: video.name,
      url: video.url,
      steps: {},
      success: false,
      totalTime: 0
    };

    const startTime = Date.now();

    try {
      // Step 1: 動画処理開始
      console.log('\n📥 Step 1: 動画処理開始...');
      const processResponse = await fetch(`${baseUrl}/api/process-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url })
      });

      const processData = await processResponse.json();
      
      if (processResponse.ok && processData.success) {
        console.log('✅ 動画処理成功');
        console.log(`  - Video ID: ${processData.videoId}`);
        console.log(`  - YouTube ID: ${processData.youtubeVideoId}`);
        console.log(`  - File size: ${(processData.fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Segments: ${processData.segments.length}`);
        
        testResult.steps.process = {
          success: true,
          videoId: processData.videoId,
          fileSize: processData.fileSize,
          segmentsCount: processData.segments.length
        };

        // Step 2: セグメント分割
        if (processData.segments && processData.segments.length > 0) {
          console.log('\n✂️ Step 2: セグメント分割...');
          
          const splitResponse = await fetch(`${baseUrl}/api/split-simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoPath: processData.videoPath,
              segments: processData.segments
            })
          });

          const splitData = await splitResponse.json();

          if (splitResponse.ok && splitData.success) {
            console.log('✅ セグメント分割成功');
            console.log(`  - 生成セグメント数: ${splitData.segments.length}`);
            console.log(`  - 処理時間: ${splitData.performance?.totalTime}秒`);
            
            testResult.steps.split = {
              success: true,
              segmentsCreated: splitData.segments.length,
              processingTime: splitData.performance?.totalTime
            };

            // 各セグメントの情報表示
            splitData.segments.forEach((seg, idx) => {
              console.log(`  - Segment ${idx + 1}: ${seg.name} (${(seg.size / 1024).toFixed(2)} KB)`);
            });
          } else {
            console.error('❌ セグメント分割失敗:', splitData.error);
            testResult.steps.split = { success: false, error: splitData.error };
          }
        }

        // Step 3: AI分析結果
        if (processData.aiAnalysisEnabled) {
          console.log('\n🤖 Step 3: AI分析結果');
          console.log(`  - 要約: ${processData.summary}`);
          if (processData.transcript) {
            console.log(`  - 転写文字数: ${processData.transcript.length}`);
          }
        }

        testResult.success = true;
      } else {
        console.error('❌ 動画処理失敗:', processData.error);
        testResult.steps.process = { success: false, error: processData.error };
      }

    } catch (error) {
      console.error('❌ テストエラー:', error.message);
      testResult.error = error.message;
    }

    const endTime = Date.now();
    testResult.totalTime = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ 総処理時間: ${testResult.totalTime}秒`);
    
    results.push(testResult);
  }

  // 結果サマリー
  console.log('\n\n📊 統合テスト結果サマリー');
  console.log('==========================');
  
  const successCount = results.filter(r => r.success).length;
  console.log(`成功率: ${successCount}/${results.length} (${((successCount / results.length) * 100).toFixed(0)}%)`);
  
  console.log('\n詳細結果:');
  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.video}`);
    console.log(`   状態: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`   処理時間: ${result.totalTime}秒`);
    
    if (result.steps.process?.success) {
      console.log(`   - 動画処理: ✅ (${result.steps.process.segmentsCount}セグメント)`);
    }
    if (result.steps.split?.success) {
      console.log(`   - 分割処理: ✅ (${result.steps.split.segmentsCreated}ファイル生成)`);
    }
    if (result.error) {
      console.log(`   - エラー: ${result.error}`);
    }
  });

  // レポート保存
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successCount,
    successRate: `${((successCount / results.length) * 100).toFixed(0)}%`,
    averageTime: (results.reduce((sum, r) => sum + parseFloat(r.totalTime), 0) / results.length).toFixed(2),
    details: results
  };

  const reportPath = path.join(__dirname, 'ai-org/worker1/reports/integration-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 レポート保存: ${reportPath}`);
  
  // 成功基準の判定
  if (successCount >= 1) {
    console.log('\n🎉 統合テスト成功！（最小限動作OK）');
  } else {
    console.log('\n⚠️ 統合テスト失敗');
  }

  return report;
}

// テスト実行
console.log('SNS Video Generator - Phase 4 統合テスト');
console.log('========================================');
console.log('テスト環境: http://localhost:3001');
console.log('テスト動画数: 3本');
console.log('');

runIntegrationTest()
  .then(report => {
    console.log('\n✅ テスト完了');
    process.exit(report.successCount > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ テスト失敗:', error);
    process.exit(1);
  });