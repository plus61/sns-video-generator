#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function runE2ETest() {
  console.log(`${colors.blue}🚀 E2E Full Integration Test${colors.reset}\n`);
  
  const results = {
    ui: false,
    expressApi: false,
    youtubeDownload: false,
    videoSplit: false,
    fileDownload: false,
    totalTime: 0
  };
  
  const startTime = Date.now();
  
  try {
    // 1. UI Health Check
    console.log('1️⃣ Checking UI Server (Port 3001)...');
    try {
      const uiResponse = await axios.get('http://localhost:3001/simple');
      results.ui = uiResponse.status === 200;
      console.log(`   ${colors.green}✅ UI Server: Running${colors.reset}`);
    } catch (e) {
      console.log(`   ${colors.red}❌ UI Server: Not running${colors.reset}`);
    }
    
    // 2. Express API Health Check
    console.log('\n2️⃣ Checking Express API (Port 3002)...');
    try {
      const apiResponse = await axios.get('http://localhost:3002/health');
      results.expressApi = apiResponse.data.status === 'ok';
      console.log(`   ${colors.green}✅ Express API: ${apiResponse.data.message}${colors.reset}`);
    } catch (e) {
      console.log(`   ${colors.red}❌ Express API: Not running${colors.reset}`);
      return results;
    }
    
    // 3. YouTube Download Test
    console.log('\n3️⃣ Testing YouTube Download...');
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    let videoPath, videoId;
    
    try {
      const downloadResponse = await axios.post('http://localhost:3002/api/youtube-download', {
        url: youtubeUrl
      });
      
      videoPath = downloadResponse.data.videoPath;
      videoId = downloadResponse.data.videoId;
      const fileSize = (downloadResponse.data.fileSize / 1024 / 1024).toFixed(2);
      
      results.youtubeDownload = true;
      console.log(`   ${colors.green}✅ Download Success: ${fileSize}MB${colors.reset}`);
      console.log(`   📁 File: ${videoPath}`);
    } catch (e) {
      console.log(`   ${colors.red}❌ Download Failed: ${e.message}${colors.reset}`);
      return results;
    }
    
    // 4. Video Split Test
    console.log('\n4️⃣ Testing Video Split...');
    let segments;
    
    try {
      const splitResponse = await axios.post('http://localhost:3002/api/split-video', {
        videoPath: videoPath
      });
      
      segments = splitResponse.data.segments;
      results.videoSplit = segments.length === 3;
      
      console.log(`   ${colors.green}✅ Split Success: ${segments.length} segments${colors.reset}`);
      segments.forEach(segment => {
        console.log(`   📹 Segment ${segment.index}: ${(segment.size / 1024).toFixed(0)}KB (${segment.start}-${segment.end}s)`);
      });
    } catch (e) {
      console.log(`   ${colors.red}❌ Split Failed: ${e.message}${colors.reset}`);
      return results;
    }
    
    // 5. ZIP Download Test
    console.log('\n5️⃣ Testing ZIP Download...');
    try {
      const zipResponse = await axios.get(`http://localhost:3002/api/download-zip/${videoId}`, {
        responseType: 'arraybuffer'
      });
      
      results.fileDownload = zipResponse.status === 200;
      const zipSize = (zipResponse.data.length / 1024).toFixed(0);
      
      console.log(`   ${colors.green}✅ ZIP Download Success: ${zipSize}KB${colors.reset}`);
      
      // Save ZIP file as proof
      const zipPath = `/tmp/${videoId}-test-download.zip`;
      fs.writeFileSync(zipPath, zipResponse.data);
      console.log(`   💾 Saved to: ${zipPath}`);
    } catch (e) {
      console.log(`   ${colors.red}❌ ZIP Download Failed: ${e.message}${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Test Error: ${error.message}${colors.reset}`);
  }
  
  results.totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Final Report
  console.log(`\n${colors.blue}📊 Test Results Summary${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`UI Server:         ${results.ui ? '✅ Pass' : '❌ Fail'}`);
  console.log(`Express API:       ${results.expressApi ? '✅ Pass' : '❌ Fail'}`);
  console.log(`YouTube Download:  ${results.youtubeDownload ? '✅ Pass' : '❌ Fail'}`);
  console.log(`Video Split:       ${results.videoSplit ? '✅ Pass' : '❌ Fail'}`);
  console.log(`File Download:     ${results.fileDownload ? '✅ Pass' : '❌ Fail'}`);
  console.log('─'.repeat(40));
  
  const totalTests = 5;
  const passedTests = Object.values(results).filter(v => v === true).length;
  const successRate = (passedTests / totalTests * 100).toFixed(0);
  
  console.log(`Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log(`Total Time: ${results.totalTime}s`);
  
  if (successRate === '100') {
    console.log(`\n${colors.green}🎉 All Tests Passed! E2E Integration Complete!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Check the results above.${colors.reset}`);
  }
  
  return results;
}

// Run the test
runE2ETest().then(results => {
  process.exit(results.expressApi && results.youtubeDownload && results.videoSplit ? 0 : 1);
}).catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});