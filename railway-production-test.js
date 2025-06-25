#!/usr/bin/env node

/**
 * Railway本番環境統合テスト
 * Worker3 - 品質保証担当
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// テスト設定
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://sns-video-generator-production.up.railway.app';
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // Me at the zoo (短い動画)

// テスト結果記録
const testResults = {
  timestamp: new Date().toISOString(),
  environment: RAILWAY_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// カラー出力
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// テスト実行ヘルパー
async function runTest(name, testFn) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    testResults.tests.push({
      name,
      status: 'passed',
      duration,
      result
    });
    
    console.log(`${colors.green}✓ Passed${colors.reset} (${duration}ms)`);
    testResults.summary.passed++;
    return { success: true, result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.tests.push({
      name,
      status: 'failed',
      duration,
      error: error.message
    });
    
    console.log(`${colors.red}✗ Failed${colors.reset} (${duration}ms)`);
    console.log(`  Error: ${error.message}`);
    testResults.summary.failed++;
    return { success: false, error: error.message, duration };
  }
  
  testResults.summary.total++;
}

// テストケース

// 1. ヘルスチェック
async function testHealthCheck() {
  const response = await fetch(`${RAILWAY_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`  Status: ${data.status}`);
  console.log(`  Version: ${data.version || 'N/A'}`);
  return data;
}

// 2. 直接処理エンドポイント（Redis/BullMQ不要）
async function testDirectProcessing() {
  const response = await fetch(`${RAILWAY_URL}/api/process-direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: TEST_VIDEO_URL
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Direct processing failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log(`  Video ID: ${data.videoId}`);
  console.log(`  Segments: ${data.segments?.length || 0}`);
  console.log(`  Processing time: ${data.processingTime}ms`);
  
  // セグメント検証
  if (!data.segments || data.segments.length === 0) {
    throw new Error('No segments generated');
  }
  
  return data;
}

// 3. シンプル処理エンドポイント
async function testSimpleProcessing() {
  const response = await fetch(`${RAILWAY_URL}/api/process-simple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: TEST_VIDEO_URL
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Simple processing failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log(`  Success: ${data.success}`);
  console.log(`  Message: ${data.message || 'N/A'}`);
  return data;
}

// 4. エラーハンドリングテスト
async function testErrorHandling() {
  const response = await fetch(`${RAILWAY_URL}/api/process-direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'invalid-url'
    })
  });
  
  if (response.ok) {
    throw new Error('Expected error response but got success');
  }
  
  const error = await response.json();
  console.log(`  Error handled correctly: ${response.status}`);
  console.log(`  Error message: ${error.error || error.message}`);
  return { status: response.status, error };
}

// 5. 同時リクエストテスト
async function testConcurrentRequests() {
  console.log('  Sending 3 concurrent requests...');
  
  const requests = [
    fetch(`${RAILWAY_URL}/api/health`),
    fetch(`${RAILWAY_URL}/api/health`),
    fetch(`${RAILWAY_URL}/api/health`)
  ];
  
  const startTime = Date.now();
  const responses = await Promise.all(requests);
  const duration = Date.now() - startTime;
  
  const allOk = responses.every(r => r.ok);
  if (!allOk) {
    throw new Error('Some concurrent requests failed');
  }
  
  console.log(`  All requests completed in ${duration}ms`);
  console.log(`  Average: ${Math.round(duration / 3)}ms per request`);
  
  return { totalDuration: duration, avgDuration: Math.round(duration / 3) };
}

// 6. パフォーマンステスト
async function testPerformance() {
  const iterations = 5;
  const times = [];
  
  console.log(`  Running ${iterations} iterations...`);
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const response = await fetch(`${RAILWAY_URL}/api/health`);
    const duration = Date.now() - start;
    
    if (!response.ok) {
      throw new Error(`Iteration ${i + 1} failed`);
    }
    
    times.push(duration);
    console.log(`  Iteration ${i + 1}: ${duration}ms`);
  }
  
  const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`  Average: ${avg}ms`);
  console.log(`  Min: ${min}ms, Max: ${max}ms`);
  
  return { avg, min, max, times };
}

// メインテスト実行
async function runAllTests() {
  console.log(`${colors.yellow}🚀 Railway Production Test Suite${colors.reset}`);
  console.log(`Environment: ${RAILWAY_URL}`);
  console.log(`Test Video: ${TEST_VIDEO_URL}`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  // 基本テスト
  await runTest('Health Check', testHealthCheck);
  await runTest('Direct Processing (No Redis/BullMQ)', testDirectProcessing);
  await runTest('Simple Processing', testSimpleProcessing);
  
  // エラーハンドリング
  await runTest('Error Handling', testErrorHandling);
  
  // パフォーマンステスト
  await runTest('Concurrent Requests', testConcurrentRequests);
  await runTest('Performance Benchmark', testPerformance);
  
  // サマリー
  testResults.summary.duration = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.yellow}📊 Test Summary${colors.reset}`);
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`${colors.green}Passed: ${testResults.summary.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.summary.failed}${colors.reset}`);
  console.log(`Total Duration: ${testResults.summary.duration}ms`);
  
  // 成功率
  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  // 品質評価
  console.log('\n📝 Quality Assessment:');
  if (successRate === '100.0') {
    console.log(`${colors.green}✅ All tests passed - Production ready!${colors.reset}`);
  } else if (successRate >= '80.0') {
    console.log(`${colors.yellow}⚠️ Most tests passed - Minor issues to fix${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Major issues detected - Not production ready${colors.reset}`);
  }
  
  // 結果保存
  const resultsPath = path.join('ai-org', 'worker3', 'railway-production-test-results.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// エラーハンドリング付き実行
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});