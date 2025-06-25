#!/usr/bin/env node

/**
 * Vercel→Railway統合テスト
 * 分離アーキテクチャでの通信検証
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://sns-video-generator.vercel.app';
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://sns-video-generator-production.up.railway.app';

// テスト用YouTube URL
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

// カラー出力用
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testRailwayAPI() {
  console.log(`${colors.blue}=== Railway API直接テスト ===${colors.reset}\n`);
  
  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'ヘルスチェック' },
    { path: '/api/download-video', method: 'POST', name: '動画ダウンロード', body: { url: TEST_VIDEO_URL } },
    { path: '/api/process-direct', method: 'POST', name: '動画処理', body: { url: TEST_VIDEO_URL } }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const startTime = Date.now();
      const response = await fetch(`${RAILWAY_URL}${endpoint.path}`, options);
      const elapsedTime = Date.now() - startTime;
      
      const result = await response.text();
      let data;
      try {
        data = JSON.parse(result);
      } catch {
        data = result;
      }
      
      if (response.ok) {
        console.log(`${colors.green}✅ Success${colors.reset} (${response.status}) - ${elapsedTime}ms`);
        if (typeof data === 'object') {
          console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
      } else {
        console.log(`${colors.red}❌ Failed${colors.reset} (${response.status})`);
        console.log('Error:', data);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ Connection Error${colors.reset}`);
      console.log('Error:', error.message);
    }
  }
}

async function testVercelFrontend() {
  console.log(`\n\n${colors.blue}=== Vercel Frontend テスト ===${colors.reset}\n`);
  
  const pages = [
    { path: '/', name: 'トップページ' },
    { path: '/dashboard', name: 'ダッシュボード' },
    { path: '/api/health', name: 'API ヘルスチェック' }
  ];
  
  for (const page of pages) {
    console.log(`\n🌐 Testing: ${page.name} (${page.path})`);
    
    try {
      const response = await fetch(`${VERCEL_URL}${page.path}`, {
        headers: {
          'Accept': 'text/html,application/json'
        }
      });
      
      if (response.ok) {
        console.log(`${colors.green}✅ Success${colors.reset} (${response.status})`);
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log('Response:', JSON.stringify(data, null, 2));
        }
      } else {
        console.log(`${colors.red}❌ Failed${colors.reset} (${response.status})`);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ Connection Error${colors.reset}`);
      console.log('Error:', error.message);
    }
  }
}

async function testCORS() {
  console.log(`\n\n${colors.blue}=== CORS設定テスト ===${colors.reset}\n`);
  
  console.log('🔒 Testing CORS headers from Vercel to Railway...');
  
  try {
    const response = await fetch(`${RAILWAY_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': VERCEL_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    console.log('CORS Headers:', corsHeaders);
    
    if (corsHeaders['access-control-allow-origin']) {
      console.log(`${colors.green}✅ CORS properly configured${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ CORS not configured${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ CORS test failed${colors.reset}`);
    console.log('Error:', error.message);
  }
}

async function testE2EFlow() {
  console.log(`\n\n${colors.blue}=== E2Eフロー検証 ===${colors.reset}\n`);
  
  console.log('🎬 Simulating complete user flow...\n');
  
  // 1. Vercelフロントエンドアクセス
  console.log('1️⃣ Accessing Vercel frontend...');
  const frontendResponse = await fetch(VERCEL_URL);
  console.log(`   Status: ${frontendResponse.ok ? '✅' : '❌'} ${frontendResponse.status}`);
  
  // 2. Railway APIヘルスチェック
  console.log('\n2️⃣ Checking Railway API health...');
  const healthResponse = await fetch(`${RAILWAY_URL}/api/health`);
  console.log(`   Status: ${healthResponse.ok ? '✅' : '❌'} ${healthResponse.status}`);
  
  // 3. 動画処理フロー
  console.log('\n3️⃣ Processing video through Railway API...');
  try {
    const processResponse = await fetch(`${RAILWAY_URL}/api/process-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({ url: TEST_VIDEO_URL })
    });
    
    if (processResponse.ok) {
      const result = await processResponse.json();
      console.log(`   ${colors.green}✅ Video processed successfully${colors.reset}`);
      console.log(`   Segments created: ${result.segments?.length || 0}`);
    } else {
      console.log(`   ${colors.red}❌ Processing failed${colors.reset} (${processResponse.status})`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Connection failed${colors.reset}: ${error.message}`);
  }
}

async function performanceTest() {
  console.log(`\n\n${colors.blue}=== パフォーマンステスト ===${colors.reset}\n`);
  
  const tests = [
    { name: 'Vercel静的ページ', url: VERCEL_URL },
    { name: 'Railway APIヘルス', url: `${RAILWAY_URL}/api/health` },
    { name: 'Railway API処理', url: `${RAILWAY_URL}/api/process-direct`, method: 'POST', body: { url: TEST_VIDEO_URL } }
  ];
  
  for (const test of tests) {
    console.log(`\n⚡ ${test.name}`);
    
    const times = [];
    const iterations = 3;
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const options = {
          method: test.method || 'GET',
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (test.body) {
          options.body = JSON.stringify(test.body);
        }
        
        const response = await fetch(test.url, options);
        await response.text();
        
        const elapsedTime = Date.now() - startTime;
        times.push(elapsedTime);
        
      } catch (error) {
        console.log(`   Iteration ${i + 1}: Failed`);
      }
    }
    
    if (times.length > 0) {
      const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`   Average: ${avgTime}ms`);
      console.log(`   Min: ${minTime}ms, Max: ${maxTime}ms`);
      
      if (avgTime < 1000) {
        console.log(`   ${colors.green}✅ Good performance${colors.reset}`);
      } else if (avgTime < 3000) {
        console.log(`   ${colors.yellow}⚠️ Acceptable performance${colors.reset}`);
      } else {
        console.log(`   ${colors.red}❌ Poor performance${colors.reset}`);
      }
    }
  }
}

// メイン実行
async function main() {
  console.log(`${colors.blue}🔍 Vercel→Railway Integration Test${colors.reset}`);
  console.log(`Vercel URL: ${VERCEL_URL}`);
  console.log(`Railway URL: ${RAILWAY_URL}`);
  console.log('='.repeat(50));
  
  await testRailwayAPI();
  await testVercelFrontend();
  await testCORS();
  await testE2EFlow();
  await performanceTest();
  
  console.log(`\n${colors.blue}=== テスト完了 ===${colors.reset}\n`);
}

main().catch(console.error);