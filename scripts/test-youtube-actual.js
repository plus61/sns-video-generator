// 実際のYouTube取得動作確認（水曜日用）
async function testActualYouTube() {
  console.log('=== YouTube取得動作確認 ===')
  console.log('開始時刻:', new Date().toLocaleString())
  
  // テスト用のYouTube URL（短い動画）
  const testUrls = [
    'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Me at the zoo (19秒)
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll（念のため）
  ]
  
  for (const url of testUrls) {
    console.log(`\n📹 テストURL: ${url}`)
    
    try {
      // 1. API呼び出し
      console.log('APIに送信中...')
      const response = await fetch('http://localhost:3000/api/upload-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      
      console.log('レスポンスステータス:', response.status)
      
      // 2. 結果確認
      if (response.ok) {
        const data = await response.json()
        console.log('\n✅ YouTube取得成功！')
        console.log('動画情報:')
        console.log('- タイトル:', data.title || 'N/A')
        console.log('- 長さ:', data.duration || 'N/A')
        console.log('- ID:', data.videoId || 'N/A')
        
        if (data.url) {
          console.log('- 保存先URL:', data.url)
        }
        
        break // 1つ成功したら終了
        
      } else if (response.status === 401) {
        console.log('\n⚠️ 認証が必要です')
        console.log('ブラウザでログインしてから再試行してください')
        
      } else {
        console.log('\n❌ 取得失敗')
        const errorText = await response.text()
        console.log('エラー:', errorText.substring(0, 200))
      }
      
    } catch (error) {
      console.error('\n❌ ネットワークエラー:', error.message)
    }
  }
  
  console.log('\n=== 代替テスト: youtube-dl-exec 直接確認 ===')
  try {
    const youtubedl = require('youtube-dl-exec')
    const info = await youtubedl(testUrls[0], {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    })
    
    console.log('✅ youtube-dl-exec動作確認OK')
    console.log('動画タイトル:', info.title)
    console.log('動画時間:', info.duration, '秒')
    
  } catch (error) {
    console.log('❌ youtube-dl-execエラー:', error.message)
    console.log('\n💡 youtube-dl-execのインストールが必要かもしれません:')
    console.log('npm install youtube-dl-exec')
  }
  
  console.log('\n=== テスト終了 ===')
  console.log('終了時刻:', new Date().toLocaleString())
}

// 実行
testActualYouTube()