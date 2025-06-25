#!/usr/bin/env node

/**
 * Render API テストスクリプト
 * Worker3 品質保証テスト
 */

const API_URL = process.env.RENDER_API_URL || 'https://sns-video-express-api.onrender.com';
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// テスト結果記録
const testResults = {
  environment: 'Render',
  apiUrl: API_URL,
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {}
};

// 時間計測ヘルパー
function measureTime(name, fn) {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const elapsed = Date.now() - start;
      
      testResults.tests.push({
        name,
        status: 'success',
        elapsed,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${colors.green}✅ ${name}${colors.reset} (${elapsed}ms)`);
      return { success: true, result, elapsed };
    } catch (error) {
      const elapsed = Date.now() - start;
      
      testResults.tests.push({
        name,
        status: 'failed',
        elapsed,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${colors.red}❌ ${name}${colors.reset} (${elapsed}ms)`);
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message, elapsed };
    }
  };
}

// 1. ヘルスチェック（初回アクセスで起動）
async function testHealthCheck() {
  console.log(`   ${colors.yellow}Note: First request may take 15-30s (cold start)${colors.reset}`);
  
  const response = await fetch(`${API_URL}/api/health`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  
  console.log(`   Version: ${data.version}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Uptime: ${Math.round(data.uptime)}s`);
  
  return data;
}

// 2. YouTube ダウンロードテスト
async function testVideoDownload() {
  const response = await fetch(`${API_URL}/api/download-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: TEST_VIDEO_URL })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Download failed: ${data.error || response.status}`);
  }
  
  console.log(`   Video ID: ${data.videoId}`);
  console.log(`   Title: ${data.title}`);
  console.log(`   Duration: ${data.duration}s`);
  console.log(`   Size: ${(data.fileSize / 1024 / 1024).toFixed(2)}MB`);
  
  return data;
}

// 3. 動画分割テスト
async function testVideoSplit(videoPath) {
  const response = await fetch(`${API_URL}/api/split-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      videoPath,
      duration: 10 // 10秒セグメント
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Split failed: ${data.error || response.status}`);
  }
  
  console.log(`   Segments: ${data.segments.length}`);
  data.segments.forEach((seg, i) => {
    console.log(`   ${i + 1}. ${seg.startTime}-${seg.endTime}s (${seg.path})`);
  });
  
  if (data.zipPath) {
    console.log(`   ZIP created: ${data.zipPath}`);
  }
  
  return data;
}

// 4. ZIPダウンロードテスト
async function testZipDownload(zipPath) {
  const response = await fetch(`${API_URL}/api/download-zip?path=${encodeURIComponent(zipPath)}`);
  
  if (!response.ok) {
    throw new Error(`ZIP download failed: ${response.status}`);
  }
  
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  
  console.log(`   Content-Type: ${contentType}`);
  console.log(`   Size: ${(contentLength / 1024).toFixed(2)}KB`);
  console.log(`   Disposition: ${contentDisposition || 'inline'}`);
  console.log(`   Downloadable: ✅`);
  
  return { 
    size: contentLength, 
    type: contentType,
    disposition: contentDisposition
  };
}

// 5. CORS検証（詳細）
async function testCORS() {
  const railwayOrigin = 'https://sns-video-generator-production.up.railway.app';
  
  // プリフライトリクエスト
  console.log('   Testing preflight request...');
  const preflightResponse = await fetch(`${API_URL}/api/health`, {
    method: 'OPTIONS',
    headers: { 
      'Origin': railwayOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  
  const preflightHeaders = {
    'allow-origin': preflightResponse.headers.get('access-control-allow-origin'),
    'allow-methods': preflightResponse.headers.get('access-control-allow-methods'),
    'allow-headers': preflightResponse.headers.get('access-control-allow-headers')
  };
  
  console.log(`   Preflight status: ${preflightResponse.status}`);
  console.log(`   Allow-Origin: ${preflightHeaders['allow-origin'] || 'not set'}`);
  console.log(`   Allow-Methods: ${preflightHeaders['allow-methods'] || 'not set'}`);
  
  // 実際のリクエスト
  console.log('   Testing actual request...');
  const actualResponse = await fetch(`${API_URL}/api/health`, {
    headers: { 'Origin': railwayOrigin }
  });
  
  const corsHeader = actualResponse.headers.get('access-control-allow-origin');
  const corsCredentials = actualResponse.headers.get('access-control-allow-credentials');
  
  const allowed = corsHeader === railwayOrigin || corsHeader === '*';
  console.log(`   Railway access: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
  
  return { 
    preflightHeaders,
    corsHeader, 
    corsCredentials,
    allowed 
  };
}

// 6. パフォーマンス検証
async function testPerformance() {
  console.log('   Running 3 iterations...');
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await fetch(`${API_URL}/api/health`);
    const elapsed = Date.now() - start;
    times.push(elapsed);
    console.log(`   Iteration ${i + 1}: ${elapsed}ms`);
  }
  
  const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`   Average: ${avg}ms | Min: ${min}ms | Max: ${max}ms`);
  
  return { avg, min, max, times };
}

// メインテスト実行
async function runTests() {
  console.log(`${colors.blue}🧪 Render API Test Suite${colors.reset}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Video: ${TEST_VIDEO_URL}`);
  console.log('='.repeat(50));
  
  // API存在確認
  console.log(`\n${colors.cyan}Checking API availability...${colors.reset}`);
  const checkResponse = await fetch(API_URL).catch(() => null);
  
  if (!checkResponse) {
    console.log(`${colors.red}❌ API not reachable${colors.reset}`);
    console.log('Make sure the API is deployed to Render');
    return;
  }
  
  // テスト実行
  console.log(`\n${colors.cyan}Starting tests...${colors.reset}\n`);
  
  // 1. Health Check（コールドスタート含む）
  console.log('1. Health Check');
  const healthTest = await measureTime('Health Check', testHealthCheck)();
  
  if (!healthTest.success) {
    console.log(`\n${colors.red}Health check failed - API may not be ready${colors.reset}`);
    return;
  }
  
  // 2. CORS検証
  console.log('\n2. CORS Validation');
  const corsTest = await measureTime('CORS Check', testCORS)();
  
  // 3. パフォーマンステスト
  console.log('\n3. Performance Test');
  const perfTest = await measureTime('Performance', testPerformance)();
  
  // 4. Video Download
  console.log('\n4. Video Download');
  const downloadTest = await measureTime('Video Download', testVideoDownload)();
  
  let splitTest, zipTest;
  
  if (downloadTest.success) {
    // 5. Video Split
    console.log('\n5. Video Split');
    const videoPath = downloadTest.result.filePath;
    splitTest = await measureTime('Video Split', () => testVideoSplit(videoPath))();
    
    if (splitTest.success && splitTest.result.zipPath) {
      // 6. ZIP Download
      console.log('\n6. ZIP Download');
      zipTest = await measureTime('ZIP Download', () => testZipDownload(splitTest.result.zipPath))();
    }
  }
  
  // サマリー作成
  const successCount = testResults.tests.filter(t => t.status === 'success').length;
  const totalTests = testResults.tests.length;
  const totalTime = testResults.tests.reduce((sum, t) => sum + t.elapsed, 0);
  
  testResults.summary = {
    totalTests,
    successCount,
    failedCount: totalTests - successCount,
    successRate: `${(successCount / totalTests * 100).toFixed(1)}%`,
    totalTime,
    averageTime: Math.round(totalTime / totalTests),
    corsEnabled: corsTest.success && corsTest.result.allowed,
    performance: perfTest.success ? perfTest.result : null
  };
  
  // 結果表示
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Success: ${successCount} | Failed: ${totalTests - successCount}`);
  console.log(`Success Rate: ${testResults.summary.successRate}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${testResults.summary.averageTime}ms`);
  
  // パフォーマンス評価（Renderは5秒目標）
  if (totalTime < 5000) {
    console.log(`${colors.green}✅ Performance: Excellent (<5s target)${colors.reset}`);
  } else if (totalTime < 10000) {
    console.log(`${colors.yellow}⚠️ Performance: Acceptable (<10s)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Performance: Needs improvement (>10s)${colors.reset}`);
  }
  
  // Render特有の注意事項
  console.log(`\n${colors.magenta}=== Render Notes ===${colors.reset}`);
  console.log('• Free tier spins down after 15 min of inactivity');
  console.log('• First request after spin-down takes 15-30s');
  console.log('• Consider upgrading for always-on service');
  
  // 結果保存
  const fs = require('fs');
  const resultFile = 'ai-org/worker3/render-test-results.json';
  fs.mkdirSync('ai-org/worker3', { recursive: true });
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultFile}`);
  
  // 本番準備状況
  console.log(`\n${colors.cyan}=== Production Readiness ===${colors.reset}`);
  if (testResults.summary.successRate === '100.0%' && 
      testResults.summary.corsEnabled && 
      testResults.summary.performance?.avg < 1000) {
    console.log(`${colors.green}✅ Render environment is production ready!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ Some optimizations needed:${colors.reset}`);
    if (!testResults.summary.corsEnabled) {
      console.log('  • Fix CORS configuration');
    }
    if (testResults.summary.performance?.avg > 1000) {
      console.log('  • Improve response times');
    }
    if (testResults.summary.successRate !== '100.0%') {
      console.log('  • Fix failing tests');
    }
  }
}

// エラーハンドリング付き実行
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});