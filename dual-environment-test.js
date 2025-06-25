#!/usr/bin/env node

/**
 * 2環境E2Eテスト - Glitch（デモ）vs Render（本番）
 * Worker3 品質保証テストスイート
 */

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

// 環境設定（Worker1からURL確定後に更新）
const environments = {
  glitch: {
    name: 'Glitch Demo',
    apiUrl: process.env.GLITCH_API_URL || 'https://sns-video-generator.glitch.me',
    uiUrl: 'https://sns-video-generator-production.up.railway.app',
    expectedReadyTime: '5分後',
    targetPerformance: 10000 // 10秒
  },
  render: {
    name: 'Render Production',
    apiUrl: process.env.RENDER_API_URL || 'https://sns-video-express-api.onrender.com',
    uiUrl: 'https://sns-video-generator-production.up.railway.app',
    expectedReadyTime: '30分後',
    targetPerformance: 5000 // 5秒
  }
};

// カラー出力
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// 結果保存用
const testResults = {
  glitch: { tests: [], metrics: [], errors: [] },
  render: { tests: [], metrics: [], errors: [] }
};

// タイミング計測
function measureTime(fn) {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const elapsed = Date.now() - start;
      return { success: true, result, elapsed };
    } catch (error) {
      const elapsed = Date.now() - start;
      return { success: false, error: error.message, elapsed };
    }
  };
}

// 1. ヘルスチェック
async function testHealthCheck(apiUrl) {
  const response = await fetch(`${apiUrl}/api/health`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  
  return {
    status: response.status,
    version: data.version,
    uptime: data.uptime,
    timestamp: data.timestamp
  };
}

// 2. YouTube動画ダウンロード
async function testVideoDownload(apiUrl) {
  const response = await fetch(`${apiUrl}/api/download-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: TEST_VIDEO_URL })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Download failed: ${data.error || response.status}`);
  }
  
  return {
    videoId: data.videoId,
    title: data.title,
    duration: data.duration,
    fileSize: data.fileSize,
    filePath: data.filePath
  };
}

// 3. 動画分割
async function testVideoSplit(apiUrl, videoPath) {
  const response = await fetch(`${apiUrl}/api/split-video`, {
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
  
  return {
    segments: data.segments,
    totalSegments: data.segments.length,
    zipPath: data.zipPath
  };
}

// 4. ZIPダウンロード確認
async function testZipDownload(apiUrl, zipPath) {
  const response = await fetch(`${apiUrl}/api/download-zip?path=${encodeURIComponent(zipPath)}`);
  
  if (!response.ok) {
    throw new Error(`ZIP download failed: ${response.status}`);
  }
  
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');
  
  return {
    accessible: true,
    size: parseInt(contentLength),
    type: contentType
  };
}

// 5. UI統合テスト
async function testUIIntegration(uiUrl, apiUrl) {
  // CORSチェック
  const response = await fetch(`${apiUrl}/api/health`, {
    headers: { 'Origin': uiUrl }
  });
  
  return {
    corsEnabled: response.ok,
    allowedOrigin: response.headers.get('access-control-allow-origin')
  };
}

// 環境テスト実行
async function testEnvironment(envKey) {
  const env = environments[envKey];
  const results = testResults[envKey];
  
  console.log(`\n${colors.blue}=== Testing ${env.name} ===${colors.reset}`);
  console.log(`API URL: ${env.apiUrl}`);
  console.log(`UI URL: ${env.uiUrl}`);
  console.log(`Target Performance: <${env.targetPerformance}ms`);
  console.log('='.repeat(50));
  
  // URLチェック
  if (env.apiUrl.includes('[待機]')) {
    console.log(`${colors.yellow}⏳ Waiting for API URL...${colors.reset}`);
    console.log(`Expected ready time: ${env.expectedReadyTime}`);
    return;
  }
  
  // テスト実行
  const tests = [
    { name: 'Health Check', fn: () => testHealthCheck(env.apiUrl) },
    { 
      name: 'Video Download', 
      fn: () => testVideoDownload(env.apiUrl),
      saveResult: 'download'
    },
    {
      name: 'Video Split',
      fn: (prev) => testVideoSplit(env.apiUrl, prev.download.filePath),
      dependsOn: 'download',
      saveResult: 'split'
    },
    {
      name: 'ZIP Download',
      fn: (prev) => testZipDownload(env.apiUrl, prev.split.zipPath),
      dependsOn: 'split'
    },
    {
      name: 'UI Integration',
      fn: () => testUIIntegration(env.uiUrl, env.apiUrl)
    }
  ];
  
  const previousResults = {};
  let totalElapsed = 0;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}...`);
    
    // 依存関係チェック
    if (test.dependsOn && !previousResults[test.dependsOn]) {
      console.log(`${colors.yellow}⚠️ Skipped (dependency failed)${colors.reset}`);
      continue;
    }
    
    // テスト実行
    const timedFn = measureTime(test.fn);
    const result = await timedFn(previousResults);
    
    // 結果記録
    results.tests.push({
      name: test.name,
      success: result.success,
      elapsed: result.elapsed
    });
    
    if (result.success) {
      console.log(`${colors.green}✅ Success${colors.reset} (${result.elapsed}ms)`);
      
      if (test.saveResult) {
        previousResults[test.saveResult] = result.result;
      }
      
      // 詳細表示
      if (result.result) {
        Object.entries(result.result).forEach(([key, value]) => {
          if (typeof value !== 'object') {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
      totalElapsed += result.elapsed;
      results.metrics.push({
        test: test.name,
        elapsed: result.elapsed
      });
    } else {
      console.log(`${colors.red}❌ Failed${colors.reset} (${result.elapsed}ms)`);
      console.log(`   Error: ${result.error}`);
      results.errors.push({
        test: test.name,
        error: result.error
      });
    }
  }
  
  // パフォーマンス評価
  console.log(`\n${colors.cyan}📊 Performance Summary${colors.reset}`);
  console.log(`Total time: ${totalElapsed}ms`);
  
  if (totalElapsed < env.targetPerformance) {
    console.log(`${colors.green}✅ Within target (<${env.targetPerformance}ms)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Exceeded target (>${env.targetPerformance}ms)${colors.reset}`);
  }
  
  return {
    environment: env.name,
    totalElapsed,
    withinTarget: totalElapsed < env.targetPerformance,
    successRate: results.tests.filter(t => t.success).length / results.tests.length * 100
  };
}

// 比較レポート生成
function generateComparisonReport() {
  console.log(`\n${colors.magenta}=== Comparison Report ===${colors.reset}`);
  console.log('='.repeat(50));
  
  const envs = ['glitch', 'render'];
  const comparison = {};
  
  for (const env of envs) {
    const results = testResults[env];
    const successCount = results.tests.filter(t => t.success).length;
    const totalTests = results.tests.length;
    
    comparison[env] = {
      environment: environments[env].name,
      testsRun: totalTests,
      testsSucceeded: successCount,
      successRate: totalTests > 0 ? (successCount / totalTests * 100).toFixed(1) + '%' : 'N/A',
      averageTime: results.metrics.length > 0 
        ? Math.round(results.metrics.reduce((sum, m) => sum + m.elapsed, 0) / results.metrics.length)
        : 0,
      errors: results.errors.length
    };
  }
  
  // 表形式で表示
  console.log('\n📊 Test Results:');
  console.log('Environment    | Success Rate | Avg Time | Errors');
  console.log('---------------|--------------|----------|-------');
  
  for (const env of envs) {
    const c = comparison[env];
    console.log(
      `${c.environment.padEnd(14)} | ${c.successRate.padEnd(12)} | ${(c.averageTime + 'ms').padEnd(8)} | ${c.errors}`
    );
  }
  
  // 推奨事項
  console.log(`\n${colors.cyan}📝 Recommendations:${colors.reset}`);
  
  if (comparison.glitch.successRate === '100.0%') {
    console.log('✅ Glitch environment ready for demo');
  }
  
  if (comparison.render.successRate === '100.0%') {
    console.log('✅ Render environment ready for production');
  }
  
  // レポート保存
  const report = {
    timestamp: new Date().toISOString(),
    environments,
    results: testResults,
    comparison,
    recommendation: {
      demo: comparison.glitch.successRate === '100.0%' ? 'Glitch' : null,
      production: comparison.render.successRate === '100.0%' ? 'Render' : null
    }
  };
  
  const fs = require('fs');
  const filename = `dual-env-test-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${filename}`);
}

// メイン実行
async function main() {
  console.log(`${colors.blue}🔍 Dual Environment E2E Test Suite${colors.reset}`);
  console.log('Testing Glitch (Demo) vs Render (Production)');
  console.log('='.repeat(50));
  
  // 両環境テスト
  const glitchResult = await testEnvironment('glitch');
  const renderResult = await testEnvironment('render');
  
  // 比較レポート
  generateComparisonReport();
  
  // デモ準備状況
  console.log(`\n${colors.blue}=== Demo Readiness ===${colors.reset}`);
  
  if (environments.glitch.apiUrl.includes('[待機]')) {
    console.log('🕐 Glitch: Waiting for deployment (ETA: 5 minutes)');
  } else if (glitchResult?.withinTarget) {
    console.log('✅ Glitch: Ready for emergency demo!');
  }
  
  if (environments.render.apiUrl.includes('[待機]')) {
    console.log('🕐 Render: Waiting for deployment (ETA: 30 minutes)');
  } else if (renderResult?.withinTarget) {
    console.log('✅ Render: Ready for production demo!');
  }
}

// 実行
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});