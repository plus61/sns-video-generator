#!/usr/bin/env node

/**
 * 統合テストスクリプト
 * 全APIの動作確認と品質検証
 */

const fs = require('fs').promises;
const path = require('path');
const { testVideos, getPerformanceTestSet } = require('./test-urls');

// テスト結果格納
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  errors: [],
  performance: [],
  aiAnalysis: [],
  startTime: null,
  endTime: null
};

// APIベースURL設定
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * 単一動画のテスト実行
 */
async function testSingleVideo(video) {
  console.log(`\n🎬 テスト開始: ${video.title} (${video.category})`);
  
  const startTime = Date.now();
  const result = {
    video: video,
    success: false,
    processingTime: 0,
    segments: [],
    aiScore: null,
    error: null
  };
  
  try {
    // process-simple API呼び出し
    const response = await fetch(`${API_BASE_URL}/api/process-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: video.url })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || response.statusText}`);
    }
    
    // 結果検証
    result.success = data.success;
    result.processingTime = Date.now() - startTime;
    result.segments = data.segments || [];
    
    // AI分析結果の評価
    if (data.segments && data.segments.length > 0) {
      const avgScore = data.segments.reduce((sum, seg) => sum + seg.score, 0) / data.segments.length;
      result.aiScore = avgScore;
      
      console.log(`  ✅ 成功 - 処理時間: ${result.processingTime}ms`);
      console.log(`  📊 AI平均スコア: ${avgScore.toFixed(2)}/10`);
      console.log(`  🎯 セグメント数: ${data.segments.length}`);
    }
    
    testResults.passed++;
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.processingTime = Date.now() - startTime;
    
    console.error(`  ❌ 失敗: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      video: video.title,
      error: error.message
    });
  }
  
  testResults.performance.push(result);
  return result;
}

/**
 * バッチテスト実行
 */
async function runBatchTests() {
  console.log('🚀 統合テスト開始...\n');
  testResults.startTime = new Date();
  
  // パフォーマンステストセット実行
  const testSet = getPerformanceTestSet();
  testResults.totalTests = testSet.length;
  
  for (const video of testSet) {
    await testSingleVideo(video);
    
    // API負荷軽減のため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  testResults.endTime = new Date();
}

/**
 * テスト結果レポート生成
 */
async function generateReport() {
  console.log('\n📊 テスト結果サマリー');
  console.log('='.repeat(50));
  
  // 成功率計算
  const successRate = (testResults.passed / testResults.totalTests * 100).toFixed(2);
  console.log(`✅ 成功率: ${successRate}% (${testResults.passed}/${testResults.totalTests})`);
  
  // 処理時間統計
  const processingTimes = testResults.performance.map(r => r.processingTime);
  const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const maxTime = Math.max(...processingTimes);
  const minTime = Math.min(...processingTimes);
  
  console.log(`\n⏱️  処理時間統計:`);
  console.log(`  平均: ${avgTime.toFixed(0)}ms`);
  console.log(`  最短: ${minTime}ms`);
  console.log(`  最長: ${maxTime}ms`);
  
  // AIスコア統計
  const aiScores = testResults.performance
    .filter(r => r.aiScore !== null)
    .map(r => r.aiScore);
  
  if (aiScores.length > 0) {
    const avgAiScore = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
    console.log(`\n🤖 AI分析統計:`);
    console.log(`  平均スコア: ${avgAiScore.toFixed(2)}/10`);
  }
  
  // エラー詳細
  if (testResults.errors.length > 0) {
    console.log(`\n❌ エラー詳細:`);
    testResults.errors.forEach(err => {
      console.log(`  - ${err.video}: ${err.error}`);
    });
  }
  
  // 詳細レポートファイル生成
  const report = {
    summary: {
      totalTests: testResults.totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: successRate,
      averageProcessingTime: avgTime,
      testDuration: testResults.endTime - testResults.startTime
    },
    details: testResults.performance,
    errors: testResults.errors,
    timestamp: new Date().toISOString()
  };
  
  // JSON形式で保存
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 詳細レポート保存: ${reportPath}`);
  
  // Markdown形式でも保存
  const mdReport = generateMarkdownReport(report);
  const mdPath = reportPath.replace('.json', '.md');
  await fs.writeFile(mdPath, mdReport);
  console.log(`📄 Markdownレポート保存: ${mdPath}`);
}

/**
 * Markdownレポート生成
 */
function generateMarkdownReport(report) {
  return `# 統合テストレポート

## 実行日時
${new Date(report.timestamp).toLocaleString('ja-JP')}

## サマリー
- **総テスト数**: ${report.summary.totalTests}
- **成功**: ${report.summary.passed}
- **失敗**: ${report.summary.failed}
- **成功率**: ${report.summary.successRate}%
- **平均処理時間**: ${report.summary.averageProcessingTime.toFixed(0)}ms
- **総実行時間**: ${(report.summary.testDuration / 1000).toFixed(1)}秒

## 詳細結果

${report.details.map(d => `### ${d.video.title}
- カテゴリー: ${d.video.category}
- 状態: ${d.success ? '✅ 成功' : '❌ 失敗'}
- 処理時間: ${d.processingTime}ms
- AIスコア: ${d.aiScore ? d.aiScore.toFixed(2) : 'N/A'}
- セグメント数: ${d.segments.length}
${d.error ? `- エラー: ${d.error}` : ''}
`).join('\n')}

## エラー詳細
${report.errors.length === 0 ? 'エラーなし' : report.errors.map(e => `- **${e.video}**: ${e.error}`).join('\n')}
`;
}

/**
 * メイン実行
 */
async function main() {
  try {
    await runBatchTests();
    await generateReport();
    
    // 成功率が基準を満たしているかチェック
    const successRate = testResults.passed / testResults.totalTests;
    if (successRate < 0.9) {
      console.error('\n⚠️  警告: 成功率が90%未満です');
      process.exit(1);
    }
    
    console.log('\n✅ すべてのテストが完了しました！');
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}