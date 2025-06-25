#!/usr/bin/env node

/**
 * ダウンロードAPIテスト
 * 使用方法: node test-download-api.js
 */

const fs = require('fs').promises;
const path = require('path');

async function testDownloadAPI() {
  console.log('🧪 Testing Download Segment API...\n');
  
  // テスト用のファイルを作成
  const testSegmentPath = '/tmp/test-segment-download.mp4';
  const testContent = Buffer.from('This is a test video segment');
  
  try {
    // テストファイル作成
    await fs.writeFile(testSegmentPath, testContent);
    console.log('✅ Created test file:', testSegmentPath);
    
    // 1. セグメント情報取得テスト
    console.log('\n📊 Testing segment info API...');
    const infoResponse = await fetch('http://localhost:3000/api/download-segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segments: [testSegmentPath, '/tmp/non-existent.mp4']
      })
    });
    
    const infoResult = await infoResponse.json();
    console.log('Segment info result:', JSON.stringify(infoResult, null, 2));
    
    // 2. 通常ダウンロードテスト
    console.log('\n📥 Testing file download...');
    const downloadUrl = `http://localhost:3000/api/download-segment?path=${encodeURIComponent(testSegmentPath)}`;
    const downloadResponse = await fetch(downloadUrl);
    
    if (downloadResponse.ok) {
      const buffer = await downloadResponse.arrayBuffer();
      console.log(`✅ Downloaded ${buffer.byteLength} bytes`);
      console.log('Content-Type:', downloadResponse.headers.get('content-type'));
      console.log('Content-Disposition:', downloadResponse.headers.get('content-disposition'));
    } else {
      console.error('❌ Download failed:', downloadResponse.status);
    }
    
    // 3. Base64ダウンロードテスト
    console.log('\n🔤 Testing Base64 download...');
    const base64Response = await fetch(
      `http://localhost:3000/api/download-segment?path=${encodeURIComponent(testSegmentPath)}&format=base64`
    );
    
    if (base64Response.ok) {
      const base64Result = await base64Response.json();
      console.log('✅ Base64 download successful');
      console.log('Filename:', base64Result.filename);
      console.log('Data length:', base64Result.data?.length || 0);
      console.log('MIME type:', base64Result.mimeType);
      
      // Base64デコード確認
      const decoded = Buffer.from(base64Result.data, 'base64');
      console.log('Decoded matches original:', decoded.equals(testContent) ? '✅' : '❌');
    }
    
    // 4. セキュリティテスト
    console.log('\n🔒 Testing security...');
    const securityResponse = await fetch(
      'http://localhost:3000/api/download-segment?path=/etc/passwd'
    );
    console.log('Security test (should fail):', securityResponse.status === 403 ? '✅ Blocked' : '❌ Not blocked');
    
    // クリーンアップ
    await fs.unlink(testSegmentPath).catch(() => {});
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure Next.js dev server is running (npm run dev)');
  }
}

// 実際の動画セグメントでのテスト
async function testWithRealSegments() {
  console.log('\n\n🎬 Testing with real video segments...\n');
  
  try {
    // まず動画を処理
    console.log('Processing test video...');
    const processResponse = await fetch('http://localhost:3000/api/process-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' 
      })
    });
    
    if (!processResponse.ok) {
      console.error('❌ Video processing failed');
      return;
    }
    
    const processResult = await processResponse.json();
    const segmentPaths = processResult.segments?.map(s => s.path) || [];
    
    if (segmentPaths.length > 0) {
      console.log(`✅ Got ${segmentPaths.length} segments`);
      
      // セグメント情報取得
      const infoResponse = await fetch('http://localhost:3000/api/download-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: segmentPaths })
      });
      
      const info = await infoResponse.json();
      console.log('\n📊 Real segments info:');
      info.segments?.forEach((seg, i) => {
        if (seg.available) {
          console.log(`  ${i + 1}. ${seg.filename} - ${seg.sizeFormatted}`);
          console.log(`     Download: ${seg.downloadUrl}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Real segment test failed:', error.message);
  }
}

// 実行
console.log('=== Download Segment API Test ===\n');
testDownloadAPI().then(() => testWithRealSegments());