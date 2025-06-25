import { test, expect } from '@playwright/test'

test.describe('Phase 1 MVP - シンプル動画処理', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前に /simple ページにアクセス
    await page.goto('http://localhost:3002/simple')
  })

  test('ページが正しく表示される', async ({ page }) => {
    // タイトルの確認
    await expect(page.locator('h1')).toContainText('シンプル動画処理')
    
    // 入力欄の確認
    const urlInput = page.locator('input[type="url"]')
    await expect(urlInput).toBeVisible()
    await expect(urlInput).toHaveAttribute('placeholder', 'https://www.youtube.com/watch?v=...')
    
    // 処理開始ボタンの確認
    const submitButton = page.locator('button:has-text("処理開始")')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled() // 初期状態では無効
  })

  test('無効なURLでエラーが表示される', async ({ page }) => {
    // 無効なURLを入力
    await page.fill('input[type="url"]', 'invalid-url')
    await page.click('button:has-text("処理開始")')
    
    // エラーメッセージの確認
    await expect(page.locator('.bg-red-100')).toBeVisible()
    await expect(page.locator('.bg-red-100')).toContainText('YouTube URL')
  })

  test('有効なYouTube URLで処理が開始される', async ({ page }) => {
    // 有効なYouTube URLを入力
    const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    await page.fill('input[type="url"]', validUrl)
    
    // ボタンが有効になることを確認
    const submitButton = page.locator('button:has-text("処理開始")')
    await expect(submitButton).toBeEnabled()
    
    // 処理開始
    await submitButton.click()
    
    // ローディング表示の確認
    await expect(page.locator('.animate-spin')).toBeVisible()
    await expect(page.locator('text=ダウンロード中')).toBeVisible()
    
    // 処理完了を待つ（最大10秒）
    await expect(page.locator('text=処理結果')).toBeVisible({ timeout: 10000 })
  })

  test('処理結果が正しく表示される', async ({ page }) => {
    // 処理を実行
    await page.fill('input[type="url"]', 'https://youtu.be/jNQXAC9IVRw')
    await page.click('button:has-text("処理開始")')
    
    // 結果が表示されるまで待つ
    await expect(page.locator('text=処理結果')).toBeVisible({ timeout: 10000 })
    
    // Video IDの表示確認
    await expect(page.locator('text=Video ID:')).toBeVisible()
    await expect(page.locator('text=demo-')).toBeVisible()
    
    // セグメント一覧の確認
    await expect(page.locator('text=セグメント一覧')).toBeVisible()
    
    // 5つのセグメントが表示されることを確認
    const segments = page.locator('div:has-text("スコア:") >> div')
    await expect(segments).toHaveCount(5)
    
    // トップ3セグメントに⭐マークがあることを確認
    const starredSegments = page.locator('text=⭐')
    await expect(starredSegments).toHaveCount(3)
  })

  test('セグメントのスコアと種類が表示される', async ({ page }) => {
    // 処理を実行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=test123')
    await page.click('button:has-text("処理開始")')
    await page.waitForSelector('text=セグメント一覧')
    
    // 各セグメントの要素を確認
    const firstSegment = page.locator('.bg-blue-50').first()
    await expect(firstSegment).toContainText('秒')
    await expect(firstSegment).toContainText('スコア:')
    await expect(firstSegment).toContainText('/10')
    await expect(firstSegment).toContainText('⭐')
  })

  test('デモ版ダウンロードボタンが表示される', async ({ page }) => {
    // 処理を実行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=test')
    await page.click('button:has-text("処理開始")')
    await page.waitForSelector('text=処理結果')
    
    // デモ版の説明が表示される
    await expect(page.locator('.bg-yellow-50')).toBeVisible()
    await expect(page.locator('text=デモ版')).toBeVisible()
    
    // ダウンロードボタンの確認
    const downloadButton = page.locator('button:has-text("ダウンロード機能")')
    await expect(downloadButton).toBeVisible()
    
    // クリックしてアラートを確認
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('デモ版のため')
      await dialog.accept()
    })
    await downloadButton.click()
  })

  test('複数の処理を連続で実行できる', async ({ page }) => {
    // 1回目の処理
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=abc123')
    await page.click('button:has-text("処理開始")')
    await expect(page.locator('text=処理結果')).toBeVisible({ timeout: 10000 })
    
    // 入力欄をクリア
    await page.fill('input[type="url"]', '')
    
    // 2回目の処理
    await page.fill('input[type="url"]', 'https://youtu.be/xyz789')
    await page.click('button:has-text("処理開始")')
    await expect(page.locator('text=xyz789')).toBeVisible({ timeout: 10000 })
  })

  test('エラー後に正常な処理ができる', async ({ page }) => {
    // まず無効なURLでエラーを発生させる
    await page.fill('input[type="url"]', 'not-a-url')
    await page.click('button:has-text("処理開始")')
    await expect(page.locator('.bg-red-100')).toBeVisible()
    
    // 正しいURLで再試行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=valid')
    await page.click('button:has-text("処理開始")')
    
    // エラーが消えて正常に処理されることを確認
    await expect(page.locator('.bg-red-100')).not.toBeVisible()
    await expect(page.locator('text=処理結果')).toBeVisible({ timeout: 10000 })
  })

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[type="url"]')).toBeVisible()
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.max-w-2xl')).toBeVisible()
    
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.max-w-2xl')).toBeVisible()
  })
})

test.describe('Phase 1 MVP - パフォーマンステスト', () => {
  test('処理が10秒以内に完了する', async ({ page }) => {
    await page.goto('http://localhost:3002/simple')
    
    const startTime = Date.now()
    
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=perf-test')
    await page.click('button:has-text("処理開始")')
    await page.waitForSelector('text=処理結果')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // 処理が10秒以内に完了することを確認
    expect(duration).toBeLessThan(10000)
  })
})