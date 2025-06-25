#!/usr/bin/env node

/**
 * Test script for split-simple API endpoint
 * Tests real FFmpeg video splitting with fixed 10-second segments
 */

const fs = require('fs');
const path = require('path');

async function testSplitSimple() {
  // Check if test video exists
  const testVideoPath = path.join(__dirname, 'test-video-30s.mp4');
  
  if (!fs.existsSync(testVideoPath)) {
    console.error('❌ Test video not found:', testVideoPath);
    console.log('Please ensure test-video-30s.mp4 exists in the scripts directory');
    process.exit(1);
  }

  console.log('🎬 Testing split-simple API with video:', testVideoPath);

  try {
    const response = await fetch('http://localhost:3000/api/split-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoPath: testVideoPath
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      console.log('Status:', response.status);
      return;
    }

    console.log('✅ Success! Video split into segments:');
    console.log('📊 Performance:', data.performance);
    
    if (data.splitResults) {
      console.log('\n📹 Split Results:');
      data.splitResults.forEach((segment, index) => {
        console.log(`\nSegment ${index + 1}:`);
        console.log(`  - Time: ${segment.start}s - ${segment.end}s (${segment.duration}s)`);
        console.log(`  - File: ${segment.name}`);
        console.log(`  - Size: ${(segment.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Path: ${segment.path}`);
      });
    }

    // Verify files exist
    console.log('\n🔍 Verifying segment files...');
    let allFilesExist = true;
    for (const segment of (data.splitResults || data.segments)) {
      if (fs.existsSync(segment.path)) {
        console.log(`✅ ${segment.name} exists`);
      } else {
        console.log(`❌ ${segment.name} not found`);
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      console.log('\n✅ All segment files created successfully!');
    } else {
      console.log('\n⚠️  Some segment files are missing');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the test
testSplitSimple();