// Test unified /tmp path usage
const testAnalyzeSimple = async () => {
  console.log('=== Testing analyze-simple with /tmp path ===\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: '/tmp/test-video.mp4'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response text:', text);
    
    let result;
    try {
      result = JSON.parse(text);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      result = { error: text };
    }
    
    if (response.ok) {
      console.log('\n✅ Success! FFmpeg error 254 should be resolved.');
    } else {
      console.log('\n❌ Error occurred:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testAnalyzeSimple();