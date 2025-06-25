const ytdl = require('ytdl-core');

async function testRealDownload() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  console.log('Testing ytdl-core with real YouTube URL...');
  console.log('URL:', url);
  console.log('Valid URL?', ytdl.validateURL(url));
  
  try {
    console.log('\nGetting video info...');
    const info = await ytdl.getInfo(url);
    console.log('✅ Video title:', info.videoDetails.title);
    console.log('✅ Video ID:', info.videoDetails.videoId);
    console.log('✅ Duration:', info.videoDetails.lengthSeconds, 'seconds');
    
    console.log('\nAttempting download (first 10 seconds)...');
    const stream = ytdl(url, {
      quality: 'lowest',
      filter: format => format.container === 'mp4'
    });
    
    let downloadedBytes = 0;
    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (downloadedBytes > 1000000) { // Stop after 1MB
        stream.destroy();
        console.log('✅ Download test successful! Downloaded', downloadedBytes, 'bytes');
      }
    });
    
    stream.on('error', (error) => {
      console.error('❌ Download error:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testRealDownload();