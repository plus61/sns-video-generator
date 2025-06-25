#!/usr/bin/env node

/**
 * 実機能テストスクリプト
 * presidentからの緊急タスク実行用
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// エラー記録用
const errors = [];
const testResults = {
  timestamp: new Date().toISOString(),
  mocksDisabled: {
    USE_MOCK: process.env.USE_MOCK === 'false',
    DISABLE_BULLMQ: process.env.DISABLE_BULLMQ === 'false'
  },
  tests: []
};

// テスト1: ヘルスチェック
async function testHealthCheck() {
  console.log('\n📍 Test 1: Health Check API');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    testResults.tests.push({
      name: 'Health Check',
      endpoint: '/api/health',
      status: response.status,
      success: response.ok,
      data: data
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      errors.push(`Health check failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    errors.push(`Health check error: ${error.message}`);
    testResults.tests.push({
      name: 'Health Check',
      endpoint: '/api/health',
      error: error.message
    });
  }
}

// テスト2: ファイルアップロード
async function testFileUpload() {
  console.log('\n📍 Test 2: File Upload API');
  
  // テスト用ビデオファイル作成（小さいダミーファイル）
  const testVideoPath = path.join(__dirname, 'test-video.mp4');
  const testVideoContent = Buffer.alloc(1024 * 1024); // 1MB dummy file
  fs.writeFileSync(testVideoPath, testVideoContent);
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(testVideoPath), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    });
    
    const response = await fetch('http://localhost:3000/api/upload-file', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const data = await response.json();
    
    testResults.tests.push({
      name: 'File Upload',
      endpoint: '/api/upload-file',
      status: response.status,
      success: response.ok,
      data: data
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      errors.push(`File upload failed: ${response.status} - ${data.error}`);
    } else {
      // 進捗確認テスト
      if (data.videoId) {
        await testProgressTracking(data.videoId);
      }
    }
  } catch (error) {
    console.error('❌ File upload error:', error.message);
    errors.push(`File upload error: ${error.message}`);
    testResults.tests.push({
      name: 'File Upload',
      endpoint: '/api/upload-file',
      error: error.message
    });
  } finally {
    // クリーンアップ
    if (fs.existsSync(testVideoPath)) {
      fs.unlinkSync(testVideoPath);
    }
  }
}

// テスト3: 進捗トラッキング
async function testProgressTracking(videoId) {
  console.log('\n📍 Test 3: Progress Tracking (SSE)');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      console.log('⏱️ Progress tracking timeout after 10s');
      resolve();
    }, 10000);
    
    try {
      const eventSource = new EventSource(`http://localhost:3000/api/upload-progress?videoId=${videoId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`📊 Progress: ${data.progress}% - ${data.message}`);
        
        testResults.tests.push({
          name: 'Progress Event',
          type: data.type,
          progress: data.progress,
          message: data.message
        });
        
        if (data.type === 'complete' || data.type === 'error') {
          clearTimeout(timeout);
          eventSource.close();
          resolve();
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        errors.push(`SSE error: ${error}`);
        clearTimeout(timeout);
        eventSource.close();
        resolve();
      };
    } catch (error) {
      console.error('❌ Progress tracking error:', error.message);
      errors.push(`Progress tracking error: ${error.message}`);
      clearTimeout(timeout);
      resolve();
    }
  });
}

// テスト4: YouTube URL処理
async function testYouTubeDownload() {
  console.log('\n📍 Test 4: YouTube URL Processing');
  
  try {
    const response = await fetch('http://localhost:3000/api/upload-youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // テスト用URL
      })
    });
    
    const data = await response.json();
    
    testResults.tests.push({
      name: 'YouTube Download',
      endpoint: '/api/upload-youtube',
      status: response.status,
      success: response.ok,
      data: data
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      errors.push(`YouTube download failed: ${response.status} - ${data.error}`);
    }
  } catch (error) {
    console.error('❌ YouTube download error:', error.message);
    errors.push(`YouTube download error: ${error.message}`);
    testResults.tests.push({
      name: 'YouTube Download',
      endpoint: '/api/upload-youtube',
      error: error.message
    });
  }
}

// メインテスト実行
async function runTests() {
  console.log('🚀 Starting Real API Tests');
  console.log('================================');
  console.log(`USE_MOCK: ${process.env.USE_MOCK}`);
  console.log(`DISABLE_BULLMQ: ${process.env.DISABLE_BULLMQ}`);
  console.log('================================');
  
  // 各テスト実行
  await testHealthCheck();
  await testFileUpload();
  await testYouTubeDownload();
  
  // 結果まとめ
  console.log('\n================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('================================');
  
  if (errors.length === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${errors.length} errors found:`);
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  // 結果をファイルに保存
  testResults.errors = errors;
  testResults.summary = {
    totalTests: testResults.tests.length,
    errors: errors.length,
    success: errors.length === 0
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  console.log('\n📁 Results saved to test-results.json');
}

// FormDataが利用可能か確認
if (typeof FormData === 'undefined') {
  console.log('Installing form-data package...');
  const { execSync } = require('child_process');
  execSync('npm install form-data', { stdio: 'inherit' });
}

// テスト実行
runTests().catch(console.error);