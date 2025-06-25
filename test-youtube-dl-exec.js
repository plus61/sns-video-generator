const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

async function testYoutubeDlExec() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const output = path.join(__dirname, 'test-download.mp4');
  
  console.log('Testing youtube-dl-exec...');
  console.log('URL:', url);
  console.log('Output:', output);
  
  try {
    console.log('\nStarting download...');
    const result = await youtubedl(url, {
      output: output,
      format: 'worst[ext=mp4]/worst',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });
    
    console.log('\n✅ Download successful!');
    console.log('Result:', result);
    
    // Check file
    const stats = fs.statSync(output);
    console.log('File size:', stats.size, 'bytes');
    
    // Clean up
    fs.unlinkSync(output);
    console.log('Cleaned up test file');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    
    // Check if yt-dlp is installed
    console.log('\n🔍 Checking if yt-dlp is installed...');
    try {
      const { execSync } = require('child_process');
      const version = execSync('yt-dlp --version').toString().trim();
      console.log('yt-dlp version:', version);
    } catch (e) {
      console.log('❌ yt-dlp is NOT installed');
      console.log('Install with: brew install yt-dlp');
    }
  }
}

testYoutubeDlExec();