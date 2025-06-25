#!/usr/bin/env node

/**
 * API統合テストスクリプト
 * YouTube動画ダウンロード → 分割 → ZIP生成の完全フローをテスト
 */

const fs = require('fs').promises;
const path = require('path');

const API_URL = 'http://localhost:3001';
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // First YouTube video

async function testProcessSimple() {
  console.log('🚀 Testing /api/process-simple...');
  
  try {
    const response = await fetch(`${API_URL}/api/process-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_VIDEO_URL
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      return null;
    }

    console.log('✅ API Success:', {
      videoId: data.videoId,
      segmentsCount: data.segments?.length,
      fileSize: data.fileSize,
      videoPath: data.videoPath
    });

    // ファイル存在確認
    if (data.videoPath) {
      try {
        const stats = await fs.stat(data.videoPath);
        console.log('✅ Video file exists:', {
          path: data.videoPath,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
        });
      } catch (e) {
        console.error('❌ Video file not found:', data.videoPath);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function testSplitSimple(videoPath) {
  console.log('\n🚀 Testing /api/split-simple...');
  
  try {
    const response = await fetch(`${API_URL}/api/split-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoPath: videoPath
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Split API Error:', data.error);
      return null;
    }

    console.log('✅ Split Success:', {
      segmentsCount: data.segments?.length,
      splitResults: data.splitResults?.length
    });

    // セグメントファイル確認
    if (data.splitResults) {
      for (const segment of data.splitResults) {
        try {
          const stats = await fs.stat(segment.path);
          console.log('✅ Segment exists:', {
            name: segment.name,
            size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            duration: `${segment.start}-${segment.end}s`
          });
        } catch (e) {
          console.error('❌ Segment not found:', segment.path);
        }
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Split request failed:', error.message);
    return null;
  }
}

async function testDownloadSegments(segments) {
  console.log('\n🚀 Testing /api/download-segments...');
  
  const segmentData = segments.map(s => ({
    name: s.name || `segment_${s.start}-${s.end}`,
    path: s.path
  }));

  try {
    const response = await fetch(`${API_URL}/api/download-segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segments: segmentData
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Download API Error:', error);
      return false;
    }

    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log('✅ Download Success:', {
      contentType,
      contentDisposition,
      status: response.status
    });

    // ZIPファイルを保存
    const buffer = await response.arrayBuffer();
    const zipPath = path.join(process.cwd(), 'test-download.zip');
    await fs.writeFile(zipPath, Buffer.from(buffer));
    
    console.log('✅ ZIP saved to:', zipPath);
    console.log('✅ ZIP size:', `${(buffer.byteLength / 1024).toFixed(2)} KB`);

    return true;
  } catch (error) {
    console.error('❌ Download request failed:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('=== YouTube動画処理フルフローテスト ===\n');
  console.log('Test URL:', TEST_VIDEO_URL);
  console.log('API URL:', API_URL);
  console.log('');

  // Step 1: Process video
  const processResult = await testProcessSimple();
  if (!processResult) {
    console.log('\n❌ Process failed. Test aborted.');
    return;
  }

  // Step 2: Split video (if videoPath exists)
  if (processResult.videoPath) {
    const splitResult = await testSplitSimple(processResult.videoPath);
    
    if (splitResult && splitResult.splitResults) {
      // Step 3: Download segments as ZIP
      await testDownloadSegments(splitResult.splitResults);
    }
  }

  console.log('\n=== テスト完了 ===');
}

// 実行
runFullTest().catch(console.error);