// Railway デプロイメント確認スクリプト
// TASK-20240625-RAILWAY-002 用

const https = require('https');

const RAILWAY_URL = 'https://cooperative-wisdom.railway.app';

console.log('🚀 Railway デプロイメント確認を開始します...');
console.log(`URL: ${RAILWAY_URL}`);
console.log('================================\n');

// 1. トップページアクセス確認
function checkTopPage() {
  return new Promise((resolve) => {
    console.log('1️⃣  トップページアクセス確認中...');
    
    https.get(RAILWAY_URL, (res) => {
      console.log(`   ステータス: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log('   ✅ トップページアクセス可能');
        resolve(true);
      } else {
        console.log('   ❌ トップページアクセス不可');
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('   ❌ 接続エラー:', err.message);
      console.log('   → デプロイがまだ完了していない可能性があります');
      resolve(false);
    });
  });
}

// 2. test-railwayページ確認
function checkTestPage() {
  return new Promise((resolve) => {
    console.log('\n2️⃣  /test-railwayページ確認中...');
    
    https.get(`${RAILWAY_URL}/test-railway`, (res) => {
      console.log(`   ステータス: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log('   ✅ test-railwayページアクセス可能');
        resolve(true);
      } else {
        console.log('   ❌ test-railwayページアクセス不可');
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('   ❌ 接続エラー:', err.message);
      resolve(false);
    });
  });
}

// 3. APIヘルスチェック
function checkAPIHealth() {
  return new Promise((resolve) => {
    console.log('\n3️⃣  APIヘルスチェック確認中...');
    
    https.get(`${RAILWAY_URL}/api/health`, (res) => {
      console.log(`   ステータス: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ APIヘルスチェック成功');
          console.log(`   レスポンス: ${data}`);
          resolve(true);
        } else {
          console.log('   ❌ APIヘルスチェック失敗');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('   ❌ 接続エラー:', err.message);
      resolve(false);
    });
  });
}

// メイン実行
async function runTests() {
  const results = {
    topPage: await checkTopPage(),
    testPage: await checkTestPage(),
    apiHealth: await checkAPIHealth()
  };
  
  console.log('\n================================');
  console.log('📊 確認結果サマリー:');
  console.log(`   トップページ: ${results.topPage ? '✅' : '❌'}`);
  console.log(`   test-railwayページ: ${results.testPage ? '✅' : '❌'}`);
  console.log(`   APIヘルスチェック: ${results.apiHealth ? '✅' : '❌'}`);
  console.log('================================\n');
  
  if (!results.topPage) {
    console.log('⚠️  デプロイがまだ完了していないようです。');
    console.log('Worker1のデプロイ完了を待ってから再実行してください。');
  }
  
  return results;
}

// 実行
runTests();