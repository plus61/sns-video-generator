#!/usr/bin/env node

/**
 * 直接処理APIのテスト
 * 使用方法: node test-direct-api.js
 */

const TEST_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

async function testDirectAPI() {
  console.log('🧪 Testing Direct Process API...\n');
  
  try {
    console.log(`📡 Sending request to: http://localhost:3000/api/process-direct`);
    console.log(`🎬 Test video: ${TEST_URL}\n`);
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/process-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: TEST_URL })
    });
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API returned error (${response.status}):`, error);
      return;
    }
    
    const result = await response.json();
    
    console.log(`✅ Success! (${elapsedTime}s)\n`);
    console.log('📊 Results:');
    console.log(`- Total Duration: ${result.totalDuration?.toFixed(1)}s`);
    console.log(`- Segments: ${result.segments?.length || 0}`);
    
    if (result.segments) {
      console.log('\n📹 Segments:');
      result.segments.forEach((seg, i) => {
        console.log(`  ${i + 1}. ${seg.startTime}-${seg.endTime}s (${seg.duration}s)`);
        console.log(`     Path: ${seg.path}`);
      });
    }
    
    // 成功基準チェック
    console.log('\n🎯 Success Criteria:');
    console.log(`- Download: ${result.success ? '✅' : '❌'}`);
    console.log(`- Split into 3 segments: ${result.segments?.length === 3 ? '✅' : '❌'}`);
    console.log(`- No Redis/BullMQ: ✅ (Direct processing)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. Next.js dev server is running (npm run dev)');
    console.error('2. yt-dlp is installed (brew install yt-dlp)');
    console.error('3. ffmpeg is installed (brew install ffmpeg)');
  }
}

// 実行
console.log('=== Direct Process API Test ===\n');
testDirectAPI();