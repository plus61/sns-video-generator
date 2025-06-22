// 分割動作確認（10秒×3クリップ）
async function testSplit() {
  console.log('=== 分割動作確認 ===')
  
  try {
    // 1. 分割APIエンドポイント確認
    console.log('分割API呼び出し中...')
    
    const mockVideoData = {
      videoId: 'test-video-123',
      duration: 60, // 60秒のテスト動画
      segments: [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
        { start: 40, end: 50 }
      ]
    }
    
    const response = await fetch('http://localhost:3000/api/export-segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockVideoData)
    })
    
    console.log('APIステータス:', response.status)
    
    if (response.status === 200) {
      console.log('✅ 分割API存在確認OK')
      console.log('期待される出力:')
      console.log('- クリップ1: 0-10秒')
      console.log('- クリップ2: 20-30秒')
      console.log('- クリップ3: 40-50秒')
    } else {
      console.log('⚠️  レスポンス:', response.status)
    }
    
    // 2. FFmpeg依存確認
    console.log('\n=== FFmpeg確認 ===')
    const { exec } = require('child_process')
    exec('ffmpeg -version', (error, stdout) => {
      if (error) {
        console.log('❌ FFmpegが見つかりません')
        console.log('インストール: brew install ffmpeg')
      } else {
        console.log('✅ FFmpeg利用可能')
        console.log(stdout.split('\n')[0])
      }
    })
    
  } catch (err) {
    console.error('❌ エラー:', err.message)
  }
}

// 実行
testSplit()