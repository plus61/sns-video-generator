#!/usr/bin/env node

/**
 * Glitch API テストスクリプト
 * Worker3 品質保証テスト
 */

const API_URL = process.env.GLITCH_API_URL || 'https://[project-name].glitch.me';
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// テスト結果記録
const testResults = {
  environment: 'Glitch',
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

// 1. ヘルスチェック
async function testHealthCheck() {
  const response = await fetch(`${API_URL}/api/health`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  
  console.log(`   Version: ${data.version}`);
  console.log(`   Status: ${data.status}`);
  
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
  
  console.log(`   Content-Type: ${contentType}`);
  console.log(`   Size: ${(contentLength / 1024).toFixed(2)}KB`);
  console.log(`   Accessible: ✅`);
  
  return { size: contentLength, type: contentType };
}

// 5. CORS検証
async function testCORS() {
  const railwayOrigin = 'https://sns-video-generator-production.up.railway.app';
  
  const response = await fetch(`${API_URL}/api/health`, {
    headers: { 'Origin': railwayOrigin }
  });
  
  const corsHeader = response.headers.get('access-control-allow-origin');
  const corsCredentials = response.headers.get('access-control-allow-credentials');
  
  console.log(`   Allow-Origin: ${corsHeader || 'not set'}`);
  console.log(`   Allow-Credentials: ${corsCredentials || 'not set'}`);
  
  const allowed = corsHeader === railwayOrigin || corsHeader === '*';
  console.log(`   Railway access: ${allowed ? '✅' : '❌'}`);
  
  return { corsHeader, allowed };
}

// メインテスト実行
async function runTests() {
  console.log(`${colors.blue}🧪 Glitch API Test Suite${colors.reset}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Video: ${TEST_VIDEO_URL}`);
  console.log('='.repeat(50));
  
  if (API_URL.includes('[project-name]')) {
    console.log(`${colors.yellow}⚠️ Waiting for actual Glitch URL...${colors.reset}`);
    console.log('Set GLITCH_API_URL environment variable');
    return;
  }
  
  // テスト実行
  console.log(`\n${colors.cyan}Starting tests...${colors.reset}\n`);
  
  // 1. Health Check
  console.log('1. Health Check');
  const healthTest = await measureTime('Health Check', testHealthCheck)();
  
  // 2. CORS検証
  console.log('\n2. CORS Validation');
  const corsTest = await measureTime('CORS Check', testCORS)();
  
  // 3. Video Download
  console.log('\n3. Video Download');
  const downloadTest = await measureTime('Video Download', testVideoDownload)();
  
  let splitTest, zipTest;
  
  if (downloadTest.success) {
    // 4. Video Split
    console.log('\n4. Video Split');
    const videoPath = downloadTest.result.filePath;
    splitTest = await measureTime('Video Split', () => testVideoSplit(videoPath))();
    
    if (splitTest.success && splitTest.result.zipPath) {
      // 5. ZIP Download
      console.log('\n5. ZIP Download');
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
    corsEnabled: corsTest.success && corsTest.result.allowed
  };
  
  // 結果表示
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Success: ${successCount} | Failed: ${totalTests - successCount}`);
  console.log(`Success Rate: ${testResults.summary.successRate}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${testResults.summary.averageTime}ms`);
  
  // パフォーマンス評価
  if (totalTime < 10000) {
    console.log(`${colors.green}✅ Performance: Excellent (<10s)${colors.reset}`);
  } else if (totalTime < 20000) {
    console.log(`${colors.yellow}⚠️ Performance: Acceptable (<20s)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Performance: Needs improvement (>20s)${colors.reset}`);
  }
  
  // 結果保存
  const fs = require('fs');
  const resultFile = 'ai-org/worker3/glitch-test-results.json';
  fs.mkdirSync('ai-org/worker3', { recursive: true });
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultFile}`);
  
  // デモ準備状況
  console.log(`\n${colors.cyan}=== Demo Readiness ===${colors.reset}`);
  if (testResults.summary.successRate === '100.0%' && testResults.summary.corsEnabled) {
    console.log(`${colors.green}✅ Glitch environment is ready for demo!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Issues found - see test results${colors.reset}`);
  }
}

// エラーハンドリング付き実行
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});