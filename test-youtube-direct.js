#!/usr/bin/env node

const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

async function testDownload() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
  const outputPath = '/tmp/test-direct-' + Date.now() + '.mp4';
  
  console.log('Testing direct youtube-dl-exec...');
  console.log('URL:', url);
  console.log('Output:', outputPath);
  
  try {
    const result = await youtubedl(url, {
      output: outputPath,
      format: 'best[height<=480]/best',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });
    
    console.log('✅ Download successful!');
    console.log('Result:', result);
    
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size, 'bytes');
    
    // Clean up
    fs.unlinkSync(outputPath);
    console.log('Cleaned up test file');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testDownload();