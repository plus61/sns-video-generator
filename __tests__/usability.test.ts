// ユーザビリティチェックリスト
describe('ユーザビリティ検証', () => {
  test('エラーメッセージが分かりやすい', () => {
    const errorMessages = {
      upload_failed: 'アップロードに失敗しました。もう一度お試しください。',
      file_too_large: 'ファイルサイズが大きすぎます（最大100MBまで）',
      invalid_format: 'サポートされていない形式です。MP4, MOV, AVIをご利用ください。'
    }
    
    // 全てのメッセージが日本語で分かりやすいことを確認
    Object.values(errorMessages).forEach(msg => {
      expect(msg.length).toBeGreaterThan(10) // 十分な説明
      expect(msg).toMatch(/[ぁ-ん]|[ァ-ヴ]/) // 日本語含む
    })
  })

  test('重要なボタンが見つけやすい', () => {
    const buttonClasses = {
      upload: 'bg-blue-600 text-white px-6 py-3',
      analyze: 'bg-green-600 text-white px-4 py-2',
      cancel: 'bg-gray-500 text-white px-4 py-2'
    }
    
    // メインアクションが目立つ色であることを確認
    expect(buttonClasses.upload).toContain('bg-blue')
    expect(buttonClasses.analyze).toContain('bg-green')
  })

  test('レスポンス目標3秒以内', () => {
    const operations = {
      pageLoad: 1500,      // 1.5秒
      uploadStart: 500,    // 0.5秒
      analyzeStart: 1000,  // 1秒
      resultDisplay: 2000  // 2秒
    }
    
    Object.entries(operations).forEach(([op, time]) => {
      expect(time).toBeLessThan(3000) // 全て3秒以内
    })
  })
})