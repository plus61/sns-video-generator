const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

async function testDirectDownload() {
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const outputPath = path.join(__dirname, 'temp', 'test-direct.mp4');
  
  // Create temp directory
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  console.log('Testing direct download with youtube-dl-exec...');
  console.log('URL:', url);
  console.log('Output:', outputPath);
  console.log('yt-dlp path:', '/Users/yuichiroooosuger/.pyenv/shims/yt-dlp');
  
  try {
    const result = await youtubedl(url, {
      output: outputPath,
      format: 'worst[ext=mp4]/worst',
      verbose: true
    });
    
    console.log('\n✅ Download successful!');
    console.log('Result:', result);
    
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size, 'bytes');
    
    // Clean up
    fs.unlinkSync(outputPath);
    
  } catch (error) {
    console.error('\n❌ Download failed:');
    console.error('Error:', error.message);
    console.error('stderr:', error.stderr);
    console.error('stdout:', error.stdout);
  }
}

testDirectDownload();