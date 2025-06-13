const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>YouTube URL テスト</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        input, button { padding: 10px; margin: 5px 0; width: 100%; }
        .result { background: #f0f0f0; padding: 15px; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎬 YouTube URL テスト</h1>
        <p>提供されたYouTube URLをテストします</p>
        
        <input type="text" id="urlInput" placeholder="https://youtu.be/cjtmDEG-B7U?si=6dGwIcLVgKMQ4hgi" 
               value="https://youtu.be/cjtmDEG-B7U?si=6dGwIcLVgKMQ4hgi">
        <button onclick="testUrl()">URLをテスト</button>
        
        <div id="result" class="result">
          テスト結果がここに表示されます
        </div>
        
        <div class="result">
          <h3>✅ プラットフォーム機能</h3>
          <ul>
            <li>YouTube URL検証</li>
            <li>ソーシャルメディア投稿</li>
            <li>AI動画生成</li>
            <li>動画分析・セグメント抽出</li>
          </ul>
        </div>
      </div>
      
      <script>
        function testUrl() {
          const url = document.getElementById('urlInput').value
          const resultDiv = document.getElementById('result')
          
          // YouTube URL regex (same as in our API)
          const youtubeRegex = /^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/
          const match = url.match(youtubeRegex)
          
          if (match) {
            resultDiv.innerHTML = \`
              <div class="success">
                <h3>✅ URL検証成功</h3>
                <p><strong>抽出された動画ID:</strong> \${match[4]}</p>
                <p><strong>完全マッチ:</strong> \${match[0]}</p>
                <p><strong>ステータス:</strong> プラットフォームで使用可能</p>
                
                <h4>期待される動作:</h4>
                <ol>
                  <li>動画メタデータ保存</li>
                  <li>AI分析開始</li>
                  <li>セグメント自動抽出</li>
                  <li>動画生成準備完了</li>
                  <li>ソーシャルメディア投稿可能</li>
                </ol>
              </div>
            \`
          } else {
            resultDiv.innerHTML = \`
              <div class="error">
                <h3>❌ URL検証失敗</h3>
                <p>有効なYouTube URLを入力してください</p>
              </div>
            \`
          }
        }
        
        // Auto-test on load
        window.onload = () => testUrl()
      </script>
    </body>
    </html>
  `)
})

const PORT = 8080
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 テストサーバーが起動しました')
  console.log(`📱 ブラウザでアクセス: http://localhost:${PORT}`)
  console.log(`🌐 ネットワーク: http://192.168.0.11:${PORT}`)
  console.log('')
  console.log('📋 テスト対象URL: https://youtu.be/cjtmDEG-B7U?si=6dGwIcLVgKMQ4hgi')
  console.log('✅ プラットフォーム準備完了')
})