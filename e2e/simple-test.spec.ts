import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:3000'
});

test('動画分割機能のテスト', async ({ page }) => {
  // テストページに直接アクセス
  await page.goto('/test/split');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  // スクリーンショット - 初期状態
  await page.screenshot({ path: 'e2e/screenshots/1-initial-state.png' });
  
  // YouTube URL入力フィールドを探す
  const urlInput = page.locator('input').first();
  await expect(urlInput).toBeVisible();
  
  // テスト用YouTube URL（短い動画）
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  await urlInput.fill(testUrl);
  
  // スクリーンショット - URL入力後
  await page.screenshot({ path: 'e2e/screenshots/2-url-entered.png' });
  
  // Split Videoボタンを探してクリック
  const splitButton = page.locator('button').filter({ hasText: /split/i }).first();
  await expect(splitButton).toBeVisible();
  await splitButton.click();
  
  // スクリーンショット - 処理中
  await page.screenshot({ path: 'e2e/screenshots/3-processing.png' });
  
  // 結果を待つ（最大60秒）
  try {
    await page.waitForSelector('text=/clip|success|complete|download/i', { 
      timeout: 60000,
      state: 'visible' 
    });
    
    // スクリーンショット - 成功
    await page.screenshot({ path: 'e2e/screenshots/4-success.png', fullPage: true });
    
    console.log('✅ テスト成功！動画分割が完了しました。');
  } catch (error) {
    // エラーの場合もスクリーンショットを撮る
    await page.screenshot({ path: 'e2e/screenshots/4-error.png', fullPage: true });
    
    // ページのHTMLを出力してデバッグ
    const html = await page.content();
    console.log('ページHTML:', html.substring(0, 500) + '...');
    
    throw error;
  }
});