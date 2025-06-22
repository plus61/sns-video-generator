import { test, expect } from '@playwright/test';

test.describe('動画分割デモテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テストページにアクセス
    await page.goto('http://localhost:3000/test/split');
  });

  test('YouTube動画を3つのクリップに分割', async ({ page }) => {
    // テスト用の短い動画URL（Rick Astley - Never Gonna Give You Up）
    const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // YouTube URL入力フィールドを探す
    const urlInput = page.locator('input[placeholder*="YouTube URL"]').first();
    await expect(urlInput).toBeVisible();

    // URLを入力
    await urlInput.fill(testVideoUrl);
    
    // Split Videoボタンをクリック
    const splitButton = page.locator('button:has-text("Split Video")');
    await expect(splitButton).toBeEnabled();
    await splitButton.click();

    // 処理中の表示を確認
    await expect(page.locator('text=/Processing|Splitting/i')).toBeVisible();

    // 結果が表示されるまで待機（最大60秒）
    await page.waitForSelector('text=/Clip|Success|Complete/i', { timeout: 60000 });

    // 3つのクリップが生成されたことを確認
    const clipElements = page.locator('[data-testid="video-clip"], .clip-item, a[href*=".mp4"]');
    const clipCount = await clipElements.count();
    
    // クリップ数の確認（3つ期待）
    expect(clipCount).toBeGreaterThanOrEqual(3);

    // スクリーンショットを保存
    await page.screenshot({ path: 'e2e/screenshots/video-split-success.png', fullPage: true });

    console.log('✅ 動画分割テスト成功！');
    console.log(`📹 ${clipCount}個のクリップが生成されました`);
  });

  test('エラーハンドリング: 無効なURL', async ({ page }) => {
    // 無効なURLを入力
    const invalidUrl = 'https://invalid-url-test';

    // URL入力
    const urlInput = page.locator('input[placeholder*="YouTube URL"]').first();
    await urlInput.fill(invalidUrl);

    // Split Videoボタンをクリック
    const splitButton = page.locator('button:has-text("Split Video")');
    await splitButton.click();

    // エラーメッセージを確認
    await expect(page.locator('text=/Error|Invalid|Failed/i')).toBeVisible({ timeout: 10000 });

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/video-split-error.png' });
  });

  test('UIの基本要素確認', async ({ page }) => {
    // ページタイトル
    await expect(page.locator('h1, h2').first()).toContainText(/Video|Split/i);

    // 入力フィールド
    await expect(page.locator('input[placeholder*="YouTube URL"]')).toBeVisible();

    // ボタン
    await expect(page.locator('button:has-text("Split Video")')).toBeVisible();

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/video-split-ui.png' });
  });
});

test.describe('統合テスト', () => {
  test('エンドツーエンドワークフロー', async ({ page }) => {
    // 1. ホームページから開始
    await page.goto('http://localhost:3000');
    
    // 2. テストページへのリンクを探してクリック
    const testLink = page.locator('a[href*="/test"]').first();
    if (await testLink.isVisible()) {
      await testLink.click();
    } else {
      // 直接テストページへ
      await page.goto('http://localhost:3000/test/split');
    }

    // 3. 動画分割を実行
    const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.locator('input[placeholder*="YouTube URL"]').fill(testVideoUrl);
    await page.locator('button:has-text("Split Video")').click();

    // 4. 結果を確認
    await page.waitForSelector('text=/Clip|Success|Complete/i', { timeout: 60000 });

    // 5. 最終スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/e2e-complete.png', fullPage: true });

    console.log('🎉 エンドツーエンドテスト完了！');
  });
});