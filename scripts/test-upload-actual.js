// 実際のアップロード動作確認（火曜日用）
const fs = require('fs')
const path = require('path')

async function testActualUpload() {
  console.log('=== 実際のアップロード動作確認 ===')
  console.log('開始時刻:', new Date().toLocaleString())
  
  // テスト用の小さな動画ファイルを作成（実際の動画の代わりにダミーファイル）
  const testFileName = `test-video-${Date.now()}.mp4`
  const testFilePath = path.join(__dirname, testFileName)
  
  try {
    // 1. ダミーファイル作成（1KBの小さなファイル）
    console.log('\n1. テストファイル作成中...')
    fs.writeFileSync(testFilePath, Buffer.alloc(1024, 'test'))
    console.log('✅ テストファイル作成完了:', testFileName)
    
    // 2. FormDataを作成
    console.log('\n2. アップロードデータ準備中...')
    const { FormData, File } = require('formdata-node')
    const formData = new FormData()
    const fileBuffer = fs.readFileSync(testFilePath)
    const file = new File([fileBuffer], testFileName, { type: 'video/mp4' })
    formData.append('video', file)
    
    // 3. APIにアップロード
    console.log('\n3. APIにアップロード中...')
    console.log('エンドポイント: http://localhost:3000/api/upload-video')
    
    const response = await fetch('http://localhost:3000/api/upload-video', {
      method: 'POST',
      body: formData
    })
    
    console.log('レスポンスステータス:', response.status)
    
    // 4. 結果確認
    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ アップロード成功！')
      console.log('レスポンスデータ:', JSON.stringify(data, null, 2))
      
      if (data.url) {
        console.log('\n📁 ファイルURL:', data.url)
        console.log('Supabaseダッシュボードで確認してください')
      }
    } else {
      console.log('\n⚠️ アップロード失敗')
      const errorText = await response.text()
      console.log('エラー内容:', errorText.substring(0, 200))
      
      if (response.status === 401) {
        console.log('\n💡 認証が必要です。ブラウザでログインしてから再試行してください')
      }
    }
    
  } catch (error) {
    console.error('\n❌ エラー発生:', error.message)
    console.log('\n💡 確認事項:')
    console.log('1. npm run dev でサーバーが起動していること')
    console.log('2. .env.localにSupabase設定があること')
    console.log('3. http://localhost:3000 にアクセスできること')
  } finally {
    // クリーンアップ
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
      console.log('\n🧹 テストファイル削除完了')
    }
  }
  
  console.log('\n=== テスト終了 ===')
  console.log('終了時刻:', new Date().toLocaleString())
}

// 依存パッケージ確認
try {
  require('formdata-node')
} catch (e) {
  console.log('📦 必要なパッケージをインストールしています...')
  require('child_process').execSync('npm install formdata-node', { stdio: 'inherit' })
}

// 実行
testActualUpload()