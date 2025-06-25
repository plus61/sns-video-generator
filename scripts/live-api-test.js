#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔴 Live API Test: Video Processing\n');

async function testAPI() {
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  
  console.log('Testing /api/process-simple endpoint...');
  console.log('URL:', testUrl);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3001/api/process-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl })
    });
    
    console.log('Response Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ API Response (Success):');
    console.log(JSON.stringify(data, null, 2));
    
    // If we have a videoPath, test the split endpoint
    if (data.videoPath) {
      console.log('\n\nTesting /api/split-simple endpoint...');
      
      const splitResponse = await fetch('http://localhost:3001/api/split-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath: data.videoPath,
          segments: data.segments
        })
      });
      
      console.log('Split Response Status:', splitResponse.status);
      
      if (splitResponse.ok) {
        const splitData = await splitResponse.json();
        console.log('\n✅ Split API Response:');
        console.log(JSON.stringify(splitData, null, 2));
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('- Video ID:', data.videoId);
    console.log('- File Size:', data.fileSize ? `${(data.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A');
    console.log('- Segments Found:', data.segments ? data.segments.length : 0);
    console.log('- Top Score:', data.segments ? Math.max(...data.segments.map(s => s.score)) : 'N/A');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Run the test
testAPI();