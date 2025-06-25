#!/usr/bin/env node

const { analyzeVideo } = require('./dist/lib/simple-ai-analyzer');

async function testRealAI() {
  console.log('Testing real AI analysis...');
  
  try {
    // Test with invalid URL first
    const result = await analyzeVideo('/test/video.mp4?videoId=test-123');
    console.log('Analysis result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Expected error (no real video):', error.message);
  }
  
  // Test API endpoint
  try {
    const response = await fetch('http://localhost:3000/api/analyze-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: '/test/video.mp4?videoId=test-123' })
    });
    
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API error:', error.message);
  }
}

testRealAI();