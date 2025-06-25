const { splitVideo } = require('./dist/lib/video-splitter');
const fs = require('fs');
const path = require('path');

async function runDemo() {
  console.log('=== FFmpeg Video Split Demo ===\n');
  
  const inputVideo = path.join(__dirname, 'test-assets', 'sample.mp4');
  const segments = [
    { start: 0, end: 10 },
    { start: 10, end: 20 },
    { start: 20, end: 30 }
  ];
  
  console.log(`Input video: ${inputVideo}`);
  console.log('Segments to extract:');
  segments.forEach((seg, i) => {
    console.log(`  ${i + 1}. ${seg.start}s - ${seg.end}s (${seg.end - seg.start}s)`);
  });
  
  console.log('\nProcessing...');
  
  try {
    const startTime = Date.now();
    const results = await splitVideo(inputVideo, segments);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Success! Processed in ${duration}ms`);
    console.log('\nOutput files:');
    
    results.forEach((result, i) => {
      const stats = fs.statSync(result.path);
      console.log(`  ${i + 1}. ${path.basename(result.path)}`);
      console.log(`     - Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`     - Duration: ${segments[i].end - segments[i].start}s`);
      console.log(`     - Path: ${result.path}`);
    });
    
    // 証明のため最初のセグメントの情報を表示
    console.log('\n📊 First segment verification:');
    const firstSegment = results[0];
    console.log(`ffprobe ${firstSegment.path}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runDemo();