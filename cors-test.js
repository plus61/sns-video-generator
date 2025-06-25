#!/usr/bin/env node

/**
 * CORS設定テスト
 * デプロイ後のCORS設定が正しく動作するか検証
 */

const TEST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://sns-video-generator-production.up.railway.app',
  'https://sns-video-generator.glitch.me',
  'https://random-origin.example.com' // 拒否されるべき
];

const API_ENDPOINTS = {
  glitch: process.env.GLITCH_API_URL || 'https://sns-video-generator.glitch.me',
  render: process.env.RENDER_API_URL || 'https://sns-video-express-api.onrender.com'
};

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testCORS(apiUrl, origin) {
  try {
    // OPTIONS リクエスト（プリフライト）
    const optionsResponse = await fetch(`${apiUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = {
      'access-control-allow-origin': optionsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': optionsResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': optionsResponse.headers.get('access-control-allow-headers'),
      'access-control-allow-credentials': optionsResponse.headers.get('access-control-allow-credentials')
    };

    // 実際のリクエスト
    const actualResponse = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': origin
      }
    });

    const actualCorsHeader = actualResponse.headers.get('access-control-allow-origin');

    return {
      origin,
      preflightStatus: optionsResponse.status,
      corsHeaders,
      actualStatus: actualResponse.status,
      actualCorsHeader,
      allowed: actualCorsHeader === origin || actualCorsHeader === '*'
    };
  } catch (error) {
    return {
      origin,
      error: error.message,
      allowed: false
    };
  }
}

async function testEnvironment(envName, apiUrl) {
  console.log(`\n${colors.blue}=== Testing ${envName} CORS Configuration ===${colors.reset}`);
  console.log(`API URL: ${apiUrl}`);
  
  if (!apiUrl || apiUrl.includes('[待機]')) {
    console.log(`${colors.yellow}⏳ Environment not ready yet${colors.reset}`);
    return;
  }

  console.log('\nTesting CORS with different origins:');
  console.log('=' .repeat(60));

  const results = [];
  
  for (const origin of TEST_ORIGINS) {
    const result = await testCORS(apiUrl, origin);
    results.push(result);
    
    const status = result.allowed ? 
      `${colors.green}✅ ALLOWED${colors.reset}` : 
      `${colors.red}❌ BLOCKED${colors.reset}`;
    
    console.log(`\nOrigin: ${origin}`);
    console.log(`Status: ${status}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Preflight: ${result.preflightStatus}`);
      console.log(`CORS Header: ${result.actualCorsHeader || 'none'}`);
    }
  }

  // サマリー
  const allowedCount = results.filter(r => r.allowed).length;
  const blockedCount = results.filter(r => !r.allowed).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`Summary: ${allowedCount} allowed, ${blockedCount} blocked`);
  
  // 推奨事項
  console.log(`\n${colors.blue}Recommendations:${colors.reset}`);
  
  const railwayOrigin = 'https://sns-video-generator-production.up.railway.app';
  const railwayAllowed = results.find(r => r.origin === railwayOrigin)?.allowed;
  
  if (!railwayAllowed) {
    console.log(`${colors.red}⚠️ Railway origin not allowed! Add to CORS whitelist:${colors.reset}`);
    console.log(`   ${railwayOrigin}`);
  }
  
  const randomAllowed = results.find(r => r.origin.includes('example.com'))?.allowed;
  if (randomAllowed) {
    console.log(`${colors.red}⚠️ CORS too permissive! Random origins are allowed${colors.reset}`);
  }
  
  return results;
}

async function main() {
  console.log(`${colors.blue}🔒 CORS Configuration Test${colors.reset}`);
  console.log('Testing Cross-Origin Resource Sharing settings');
  console.log('=' .repeat(60));

  // 両環境テスト
  const glitchResults = await testEnvironment('Glitch', API_ENDPOINTS.glitch);
  const renderResults = await testEnvironment('Render', API_ENDPOINTS.render);

  // 最終評価
  console.log(`\n${colors.blue}=== Final Assessment ===${colors.reset}`);
  
  if (glitchResults && renderResults) {
    const glitchOK = glitchResults.some(r => 
      r.origin.includes('railway.app') && r.allowed
    );
    const renderOK = renderResults.some(r => 
      r.origin.includes('railway.app') && r.allowed
    );
    
    if (glitchOK && renderOK) {
      console.log(`${colors.green}✅ Both environments properly configured for production!${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ CORS configuration needs adjustment${colors.reset}`);
    }
  }
}

// 実行
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});