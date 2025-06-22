// アップロード動作確認スクリプト
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase接続
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testUpload() {
  console.log('=== アップロード動作確認開始 ===')
  
  try {
    // 1. テストファイル作成（小さな動画の代わりにテキストファイル）
    const testData = 'テスト動画データ'
    const fileName = `test-${Date.now()}.txt`
    
    // 2. Supabaseにアップロード
    console.log('アップロード中...')
    const { data, error } = await supabase.storage
      .from('video-uploads')
      .upload(fileName, testData)
    
    if (error) {
      console.error('❌ アップロードエラー:', error.message)
      return
    }
    
    console.log('✅ アップロード成功:', data.path)
    
    // 3. URLを取得
    const { data: urlData } = supabase.storage
      .from('video-uploads')
      .getPublicUrl(fileName)
    
    console.log('✅ URL取得成功:', urlData.publicUrl)
    
    // 4. ファイル削除（クリーンアップ）
    await supabase.storage
      .from('video-uploads')
      .remove([fileName])
    
    console.log('✅ テスト完了！基本的なアップロード機能は動作しています')
    
  } catch (err) {
    console.error('❌ エラー発生:', err)
  }
}

// 実行
testUpload()