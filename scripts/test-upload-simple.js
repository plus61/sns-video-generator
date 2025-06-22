// シンプルなアップロード動作確認
require('dotenv').config({ path: '.env.local' })

async function testUploadAPI() {
  console.log('=== アップロードAPI動作確認 ===')
  
  try {
    // 1. APIエンドポイントの存在確認
    const response = await fetch('http://localhost:3000/api/upload-video', {
      method: 'POST'
    })
    
    console.log('APIステータス:', response.status)
    
    if (response.status === 401) {
      console.log('✅ API存在確認OK（認証が必要）')
    } else if (response.status === 400) {
      console.log('✅ API存在確認OK（ファイルが必要）')
    } else {
      console.log('✅ APIレスポンス:', response.status)
    }
    
    // 2. 環境変数確認
    console.log('\n=== 環境変数確認 ===')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定')
    console.log('SUPABASE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 設定済み' : '❌ 未設定')
    
  } catch (err) {
    console.error('❌ エラー:', err.message)
    console.log('\nローカルサーバーが起動していることを確認してください:')
    console.log('npm run dev')
  }
}

// 実行
testUploadAPI()