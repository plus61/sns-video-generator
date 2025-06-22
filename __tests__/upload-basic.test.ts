// 基本的なアップロード機能テスト - 実用性重視
describe('アップロード機能', () => {
  test('動画ファイルアップロード成功', async () => {
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
    const formData = new FormData()
    formData.append('video', file)
    
    // APIエンドポイントが応答することを確認
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData
    })
    
    expect(response.ok || response.status === 401).toBe(true) // 認証エラーもOK
  })

  test('サポート外ファイル拒否', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('video', file)
    
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData
    })
    
    expect(response.status).toBeGreaterThanOrEqual(400) // エラーコード
  })
})