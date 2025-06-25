const fs = require('fs');
const path = require('path');

// Test video URLs by category
const testVideos = [
  { 
    category: '教育系',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    expectedDuration: '5-10分'
  },
  {
    category: 'エンタメ系',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedDuration: '10-15分'
  },
  {
    category: 'ニュース系',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    expectedDuration: '3-5分'
  },
  {
    category: 'Vlog',
    url: 'https://www.youtube.com/watch?v=fLexgOxsZu0',
    expectedDuration: '15-20分'
  },
  {
    category: 'ゲーム実況',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    expectedDuration: '20-30分'
  },
  {
    category: '料理動画',
    url: 'https://www.youtube.com/watch?v=1roy4o4tqQM',
    expectedDuration: '10-15分'
  },
  {
    category: '音楽MV',
    url: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
    expectedDuration: '3-5分'
  },
  {
    category: 'スポーツハイライト',
    url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    expectedDuration: '5-10分'
  },
  {
    category: 'テック解説',
    url: 'https://www.youtube.com/watch?v=pTB0EiLXUC8',
    expectedDuration: '10-20分'
  },
  {
    category: 'コメディ',
    url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    expectedDuration: '5-15分'
  }
];

const API_URL = 'http://localhost:3001/api/process-simple';

async function testVideo(video, index) {
  console.log(`\n[${index + 1}/10] Testing ${video.category}...`);
  console.log(`URL: ${video.url}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: video.url })
    });
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const quality = data.segments ? Math.min(data.segments.length * 3, 10) : 0;
      
      return {
        category: video.category,
        url: video.url,
        processingTime: `${processingTime.toFixed(1)}秒`,
        status: '成功',
        quality: quality,
        segmentsCount: data.segments?.length || 0,
        message: data.message || '',
        error: null
      };
    } else {
      return {
        category: video.category,
        url: video.url,
        processingTime: `${processingTime.toFixed(1)}秒`,
        status: '失敗',
        quality: 0,
        segmentsCount: 0,
        message: '',
        error: data.error || 'Unknown error'
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    
    return {
      category: video.category,
      url: video.url,
      processingTime: `${processingTime.toFixed(1)}秒`,
      status: '失敗',
      quality: 0,
      segmentsCount: 0,
      message: '',
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🎬 Starting 10 YouTube video tests...');
  console.log(`API URL: ${API_URL}`);
  console.log('Target: 90% success rate, <10s average\n');
  
  const results = [];
  
  for (let i = 0; i < testVideos.length; i++) {
    const result = await testVideo(testVideos[i], i);
    results.push(result);
    
    // Short delay between tests
    if (i < testVideos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Calculate statistics
  const successCount = results.filter(r => r.status === '成功').length;
  const successRate = (successCount / results.length) * 100;
  const avgProcessingTime = results.reduce((sum, r) => sum + parseFloat(r.processingTime), 0) / results.length;
  const avgQuality = results.filter(r => r.status === '成功').reduce((sum, r) => sum + r.quality, 0) / successCount || 0;
  
  // Generate report
  let report = `# 【Worker1】10本のYouTube動画実戦テスト結果\n\n`;
  report += `## テスト概要\n`;
  report += `- 実施日時: ${new Date().toISOString()}\n`;
  report += `- API URL: ${API_URL}\n`;
  report += `- テスト動画数: 10本\n\n`;
  
  report += `## 統計結果\n`;
  report += `- **成功率**: ${successRate.toFixed(1)}% (${successCount}/10) ${successRate >= 90 ? '✅' : '❌'}\n`;
  report += `- **平均処理時間**: ${avgProcessingTime.toFixed(1)}秒 ${avgProcessingTime < 10 ? '✅' : '❌'}\n`;
  report += `- **平均品質スコア**: ${avgQuality.toFixed(1)}/10\n\n`;
  
  report += `## 詳細結果\n\n`;
  report += `| # | カテゴリ | 処理時間 | 状態 | 品質 | セグメント数 | エラー |\n`;
  report += `|---|----------|---------|------|------|------------|--------|\n`;
  
  results.forEach((r, i) => {
    report += `| ${i + 1} | ${r.category} | ${r.processingTime} | ${r.status} | ${r.quality}/10 | ${r.segmentsCount} | ${r.error || '-'} |\n`;
  });
  
  report += `\n## 分析\n\n`;
  
  if (successRate >= 90 && avgProcessingTime < 10) {
    report += `### ✅ 目標達成\n`;
    report += `- 成功率90%以上を達成\n`;
    report += `- 平均処理時間10秒以内を達成\n`;
  } else {
    report += `### ⚠️ 改善必要\n`;
    if (successRate < 90) {
      report += `- 成功率が目標の90%に未達\n`;
    }
    if (avgProcessingTime >= 10) {
      report += `- 平均処理時間が目標の10秒を超過\n`;
    }
  }
  
  // Identify patterns
  const failedCategories = results.filter(r => r.status === '失敗').map(r => r.category);
  if (failedCategories.length > 0) {
    report += `\n### 失敗パターン\n`;
    report += `失敗したカテゴリ: ${failedCategories.join(', ')}\n`;
  }
  
  // Save report
  const reportPath = path.join(__dirname, 'ai-org/worker1/reports/test-results-10videos.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  
  console.log('\n📊 Test Summary:');
  console.log(`Success Rate: ${successRate.toFixed(1)}% ${successRate >= 90 ? '✅' : '❌'}`);
  console.log(`Avg Processing Time: ${avgProcessingTime.toFixed(1)}s ${avgProcessingTime < 10 ? '✅' : '❌'}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

// Run tests
runTests().catch(console.error);