// YouTube取得動作確認
require('dotenv').config({ path: '.env.local' })

async function testYouTube() {
  console.log('=== YouTube取得動作確認 ===')
  
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // テスト用URL
  
  try {
    // 1. YouTube APIエンドポイント確認
    console.log('YouTube API呼び出し中...')
    const response = await fetch('http://localhost:3000/api/youtube-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    })
    
    console.log('APIステータス:', response.status)
    
    if (response.status === 200) {
      const data = await response.json()
      console.log('✅ YouTube取得成功!')
      console.log('動画タイトル:', data.title || '取得済み')
    } else if (response.status === 401) {
      console.log('✅ API存在確認OK（認証が必要）')
    } else {
      console.log('⚠️  レスポンス:', response.status)
      const text = await response.text()
      console.log('詳細:', text.substring(0, 100))
    }
    
  } catch (err) {
    console.error('❌ エラー:', err.message)
    console.log('\nローカルサーバーが起動していることを確認してください')
  }
}

// 実行
testYouTube()