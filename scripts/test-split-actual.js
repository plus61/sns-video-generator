// 実際の分割動作確認（木曜日用）
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function testActualSplit() {
  console.log('=== 分割動作確認（10秒×3クリップ）===')
  console.log('開始時刻:', new Date().toLocaleString())
  
  // 1. FFmpeg確認
  console.log('\n1. FFmpeg確認...')
  try {
    const { stdout } = await execAsync('ffmpeg -version')
    console.log('✅ FFmpeg利用可能:', stdout.split('\n')[0])
  } catch (error) {
    console.error('❌ FFmpegが見つかりません')
    console.log('インストール方法:')
    console.log('Mac: brew install ffmpeg')
    console.log('Ubuntu: sudo apt install ffmpeg')
    console.log('Windows: https://ffmpeg.org/download.html')
    return
  }
  
  // 2. テスト動画作成（30秒の黒画面動画）
  console.log('\n2. テスト動画作成中...')
  const testVideo = path.join(__dirname, 'test-video-30s.mp4')
  
  try {
    await execAsync(`ffmpeg -f lavfi -i color=black:s=640x480:r=30 -t 30 -y "${testVideo}"`)
    console.log('✅ 30秒のテスト動画作成完了')
    
    // 3. 分割実行
    console.log('\n3. 動画を3つに分割中...')
    const segments = [
      { start: 0, end: 10, output: 'clip1.mp4' },
      { start: 10, end: 20, output: 'clip2.mp4' },
      { start: 20, end: 30, output: 'clip3.mp4' }
    ]
    
    for (const segment of segments) {
      const outputPath = path.join(__dirname, segment.output)
      const command = `ffmpeg -i "${testVideo}" -ss ${segment.start} -t 10 -c copy -y "${outputPath}"`
      
      console.log(`\n分割中: ${segment.output} (${segment.start}-${segment.end}秒)`)
      await execAsync(command)
      
      // ファイルサイズ確認
      const stats = fs.statSync(outputPath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      console.log(`✅ ${segment.output} 作成完了 (${sizeMB}MB)`)
    }
    
    // 4. 再生確認（オプション）
    console.log('\n4. クリップ情報確認...')
    for (const segment of segments) {
      const outputPath = path.join(__dirname, segment.output)
      try {
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`)
        console.log(`${segment.output}: ${parseFloat(stdout).toFixed(1)}秒`)
      } catch (e) {
        console.log(`${segment.output}: 情報取得エラー`)
      }
    }
    
    console.log('\n✅ 分割テスト成功！')
    console.log('3つの10秒クリップが生成されました')
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message)
  } finally {
    // 5. クリーンアップ
    console.log('\n5. テストファイル削除中...')
    const filesToDelete = [
      testVideo,
      'clip1.mp4',
      'clip2.mp4',
      'clip3.mp4'
    ].map(f => path.join(__dirname, f))
    
    filesToDelete.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    })
    console.log('✅ クリーンアップ完了')
  }
  
  console.log('\n=== API経由のテスト ===')
  try {
    const response = await fetch('http://localhost:3000/api/export-segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoPath: 'dummy-path',
        segments: [
          { start: 0, end: 10 },
          { start: 10, end: 20 },
          { start: 20, end: 30 }
        ]
      })
    })
    
    console.log('APIレスポンス:', response.status)
    if (response.status === 401) {
      console.log('✅ API存在確認OK（認証が必要）')
    }
  } catch (e) {
    console.log('APIエラー:', e.message)
  }
  
  console.log('\n=== テスト終了 ===')
  console.log('終了時刻:', new Date().toLocaleString())
}

// 実行
testActualSplit()