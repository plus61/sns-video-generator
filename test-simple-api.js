#!/usr/bin/env node

/**
 * シンプルAPI動作テスト
 * 60%の機能を確認
 */

const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // テスト用短い動画

async function testSimpleAPI() {
  console.log('🧪 Testing Simple Process API')
  console.log('==========================')
  
  try {
    console.log(`📹 Test URL: ${testUrl}`)
    console.log('🚀 Sending request...')
    
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3000/api/process-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: testUrl })
    })
    
    const elapsedTime = Date.now() - startTime
    console.log(`⏱️ Response time: ${elapsedTime}ms`)
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ SUCCESS!')
      console.log(`📁 Video saved: ${data.videoPath}`)
      console.log(`✂️ Segments created: ${data.totalSegments}`)
      console.log('\n📊 Segment Details:')
      data.segments.forEach(seg => {
        console.log(`  - Segment ${seg.index}: ${(seg.size / 1024 / 1024).toFixed(2)}MB`)
      })
    } else {
      console.log('❌ FAILED!')
      console.log(`Error: ${data.error}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// 実行
console.log('Starting test in 3 seconds...')
setTimeout(testSimpleAPI, 3000)