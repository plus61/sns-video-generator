#!/usr/bin/env node

/**
 * 本番環境E2Eテスト
 * Railway UI + Express API (分離アーキテクチャ)
 */

// 本番環境URL（Worker1/Worker2のデプロイ後に更新）
const PROD_UI_URL = process.env.PROD_UI_URL || 'https://sns-video-generator-production.up.railway.app';
const PROD_API_URL = process.env.PROD_API_URL || 'https://express-api-xxxx.onrender.com';

// ローカル環境URL（比較用）
const LOCAL_UI_URL = 'http://localhost:3001';
const LOCAL_API_URL = 'http://localhost:5001';

// テストYouTube URL
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

// カラー出力
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// パフォーマンス測定
class PerformanceTracker {
  constructor() {
    this.metrics = [];
  }

  start(name) {
    this.current = { name, startTime: Date.now() };
  }

  end() {
    if (this.current) {
      const elapsed = Date.now() - this.current.startTime;
      this.metrics.push({ ...this.current, elapsed });
      return elapsed;
    }
    return 0;
  }

  report() {
    console.log(`\n${colors.cyan}📊 Performance Report${colors.reset}`);
    console.log('='.repeat(40));
    
    this.metrics.forEach(metric => {
      const color = metric.elapsed < 1000 ? colors.green : 
                   metric.elapsed < 3000 ? colors.yellow : colors.red;
      console.log(`${metric.name}: ${color}${metric.elapsed}ms${colors.reset}`);
    });
    
    const total = this.metrics.reduce((sum, m) => sum + m.elapsed, 0);
    console.log('='.repeat(40));
    console.log(`Total: ${total}ms`);
  }
}

// 1. 基本的な疎通確認
async function testBasicConnectivity(isProduction = true) {
  const uiUrl = isProduction ? PROD_UI_URL : LOCAL_UI_URL;
  const apiUrl = isProduction ? PROD_API_URL : LOCAL_API_URL;
  const env = isProduction ? 'PRODUCTION' : 'LOCAL';
  
  console.log(`\n${colors.blue}=== ${env} Basic Connectivity ===${colors.reset}`);
  console.log(`UI URL: ${uiUrl}`);
  console.log(`API URL: ${apiUrl}\n`);
  
  const results = {
    ui: false,
    api: false,
    cors: false
  };
  
  // UIアクセステスト
  try {
    const response = await fetch(uiUrl);
    results.ui = response.ok;
    console.log(`UI Access: ${response.ok ? '✅' : '❌'} (${response.status})`);
  } catch (error) {
    console.log(`UI Access: ❌ (${error.message})`);
  }
  
  // APIヘルスチェック
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    const data = await response.json();
    results.api = response.ok;
    console.log(`API Health: ${response.ok ? '✅' : '❌'} (${response.status})`);
    if (data.version) console.log(`API Version: ${data.version}`);
  } catch (error) {
    console.log(`API Health: ❌ (${error.message})`);
  }
  
  // CORS確認
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      headers: { 'Origin': uiUrl }
    });
    results.cors = response.ok;
    console.log(`CORS Config: ${response.ok ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`CORS Config: ❌ (${error.message})`);
  }
  
  return results;
}

// 2. YouTube処理フローテスト
async function testVideoProcessingFlow(isProduction = true) {
  const apiUrl = isProduction ? PROD_API_URL : LOCAL_API_URL;
  const env = isProduction ? 'PRODUCTION' : 'LOCAL';
  const perf = new PerformanceTracker();
  
  console.log(`\n${colors.blue}=== ${env} Video Processing Flow ===${colors.reset}`);
  
  try {
    // ダウンロード
    console.log('\n1️⃣ Downloading video...');
    perf.start('Download');
    
    const downloadResponse = await fetch(`${apiUrl}/api/download-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: TEST_VIDEO_URL })
    });
    
    const downloadTime = perf.end();
    const downloadData = await downloadResponse.json();
    
    if (downloadResponse.ok) {
      console.log(`✅ Downloaded in ${downloadTime}ms`);
      console.log(`   File: ${downloadData.filePath}`);
      console.log(`   Size: ${(downloadData.fileSize / 1024 / 1024).toFixed(2)}MB`);
    } else {
      console.log(`❌ Download failed: ${downloadData.error}`);
      return false;
    }
    
    // 分割処理
    console.log('\n2️⃣ Splitting video...');
    perf.start('Split');
    
    const splitResponse = await fetch(`${apiUrl}/api/split-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        videoPath: downloadData.filePath,
        duration: 10
      })
    });
    
    const splitTime = perf.end();
    const splitData = await splitResponse.json();
    
    if (splitResponse.ok) {
      console.log(`✅ Split in ${splitTime}ms`);
      console.log(`   Segments: ${splitData.segments.length}`);
      splitData.segments.forEach((seg, i) => {
        console.log(`   ${i + 1}. ${seg.startTime}-${seg.endTime}s`);
      });
    } else {
      console.log(`❌ Split failed: ${splitData.error}`);
      return false;
    }
    
    // ダウンロードテスト
    if (splitData.segments.length > 0) {
      console.log('\n3️⃣ Testing segment download...');
      perf.start('Download Segment');
      
      const segmentPath = splitData.segments[0].path;
      const downloadUrl = `${apiUrl}/api/download-segment?path=${encodeURIComponent(segmentPath)}`;
      const segmentResponse = await fetch(downloadUrl);
      
      const segmentTime = perf.end();
      
      if (segmentResponse.ok) {
        const contentLength = segmentResponse.headers.get('content-length');
        console.log(`✅ Segment accessible in ${segmentTime}ms`);
        console.log(`   Size: ${(contentLength / 1024).toFixed(2)}KB`);
      } else {
        console.log(`❌ Segment download failed`);
      }
    }
    
    perf.report();
    return true;
    
  } catch (error) {
    console.error(`\n❌ Flow error: ${error.message}`);
    return false;
  }
}

// 3. UI統合テスト
async function testUIIntegration(isProduction = true) {
  const uiUrl = isProduction ? PROD_UI_URL : LOCAL_UI_URL;
  const env = isProduction ? 'PRODUCTION' : 'LOCAL';
  
  console.log(`\n${colors.blue}=== ${env} UI Integration ===${colors.reset}`);
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/videos', name: 'Videos' }
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${uiUrl}${page.path}`);
      console.log(`${page.name}: ${response.ok ? '✅' : '❌'} (${response.status})`);
    } catch (error) {
      console.log(`${page.name}: ❌ (Connection failed)`);
    }
  }
}

// 4. 証拠収集
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    environment: {
      ui_url: PROD_UI_URL,
      api_url: PROD_API_URL
    },
    results,
    evidence: {
      screenshot_instruction: 'Take screenshots of:',
      items: [
        '1. Browser showing ' + PROD_UI_URL,
        '2. API health check response',
        '3. Video processing success',
        '4. Downloaded segment file'
      ]
    }
  };
  
  console.log(`\n${colors.cyan}=== Test Report ===${colors.reset}`);
  console.log(JSON.stringify(report, null, 2));
  
  // ファイルに保存
  const fs = require('fs');
  const filename = `production-test-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${filename}`);
}

// メイン実行
async function main() {
  console.log(`${colors.blue}🚀 Production E2E Test Suite${colors.reset}`);
  console.log('='.repeat(50));
  
  const results = {
    production: {},
    local: {}
  };
  
  // 本番環境テスト
  console.log(`\n${colors.yellow}🌐 Testing PRODUCTION environment${colors.reset}`);
  results.production.connectivity = await testBasicConnectivity(true);
  
  if (results.production.connectivity.api) {
    results.production.videoFlow = await testVideoProcessingFlow(true);
    await testUIIntegration(true);
  }
  
  // ローカル環境テスト（比較用）
  console.log(`\n${colors.yellow}💻 Testing LOCAL environment (comparison)${colors.reset}`);
  results.local.connectivity = await testBasicConnectivity(false);
  
  if (results.local.connectivity.api) {
    results.local.videoFlow = await testVideoProcessingFlow(false);
  }
  
  // 最終レポート
  generateReport(results);
  
  // 成功判定
  const prodSuccess = results.production.connectivity.ui && 
                     results.production.connectivity.api &&
                     results.production.videoFlow;
  
  console.log(`\n${colors.blue}=== Final Result ===${colors.reset}`);
  if (prodSuccess) {
    console.log(`${colors.green}✅ PRODUCTION READY!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Production issues detected${colors.reset}`);
  }
}

// エラーハンドリング付き実行
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});