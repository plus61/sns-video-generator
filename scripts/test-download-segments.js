#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function testDownloadSegments() {
  const API_URL = 'http://localhost:3001/api/download-segments';
  
  // Test data - simulating segment paths
  const testSegments = [
    {
      name: 'segment1',
      path: path.join(process.cwd(), 'temp', 'test-segment1.mp4')
    },
    {
      name: 'segment2',
      path: path.join(process.cwd(), 'temp', 'test-segment2.mp4')
    }
  ];

  try {
    console.log('Testing /api/download-segments endpoint...');
    console.log('Sending segments:', testSegments);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ segments: testSegments })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const error = await response.json();
      console.error('Error response:', error);
      return;
    }

    // Check if response is a ZIP file
    const contentType = response.headers.get('content-type');
    if (contentType !== 'application/zip') {
      console.error('Unexpected content type:', contentType);
      return;
    }

    // Save the ZIP file for testing
    const buffer = await response.arrayBuffer();
    const outputPath = path.join(process.cwd(), 'test-download.zip');
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log('✅ Success! ZIP file saved to:', outputPath);
    console.log('File size:', Buffer.from(buffer).length, 'bytes');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDownloadSegments();