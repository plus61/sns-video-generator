import { test, expect } from '@playwright/test';

// Worker3作成: シンプルUIのE2Eテスト
// Worker2の素晴らしい実装を品質保証でサポート

test.describe('シンプルUI E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/simple');
  });

  test('ページが正しく表示される', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('h1')).toContainText('YouTube動画から');
    
    // 入力フィールド確認
    await expect(page.locator('input[type="url"]')).toBeVisible();
    
    // 処理ボタン確認
    await expect(page.locator('button')).toContainText('動画を処理');
  });

  test('YouTube URL処理フロー', async ({ page }) => {
    // テスト用YouTube URL
    const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    
    // URL入力
    await page.fill('input[type="url"]', testUrl);
    
    // 処理開始
    await page.click('button:has-text("動画を処理")');
    
    // プログレス表示確認
    await expect(page.locator('.progress')).toBeVisible();
    
    // 処理完了待機（最大60秒）
    await expect(page.locator('text=処理が完了しました')).toBeVisible({
      timeout: 60000
    });
    
    // セグメント表示確認
    const segments = page.locator('.segment-item');
    await expect(segments).toHaveCount(5);
  });

  test('ダウンロード機能', async ({ page, context }) => {
    // まずは動画処理を実行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=jNQXAC9IVRw');
    await page.click('button:has-text("動画を処理")');
    
    // 処理完了待機
    await page.waitForSelector('text=処理が完了しました', { timeout: 60000 });
    
    // ダウンロード待機設定
    const downloadPromise = page.waitForEvent('download');
    
    // ダウンロードボタンクリック
    await page.click('button:has-text("全てダウンロード")');
    
    // ダウンロード確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.zip');
  });

  test('エラーハンドリング', async ({ page }) => {
    // 無効なURL入力
    await page.fill('input[type="url"]', 'invalid-url');
    await page.click('button:has-text("動画を処理")');
    
    // エラーメッセージ確認
    await expect(page.locator('.error')).toContainText('無効なURLです');
  });

  test('プレビュー機能', async ({ page }) => {
    // まずは動画処理を実行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=jNQXAC9IVRw');
    await page.click('button:has-text("動画を処理")');
    
    // 処理完了待機
    await page.waitForSelector('text=処理が完了しました', { timeout: 60000 });
    
    // ビデオプレビューが表示されていることを確認
    await expect(page.locator('.segment-item video').first()).toBeVisible();
  });
});

// パフォーマンステスト
test.describe('パフォーマンス測定', () => {
  test('処理時間の測定', async ({ page }) => {
    const startTime = Date.now();
    
    // 処理実行
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=jNQXAC9IVRw');
    await page.click('button:has-text("動画を処理")');
    
    // 完了待機
    await page.waitForSelector('text=処理が完了しました', { timeout: 60000 });
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    
    // 30秒以内であることを確認
    expect(processingTime).toBeLessThan(30);
    console.log(`処理時間: ${processingTime}秒`);
  });
});

// アクセシビリティテスト
test.describe('アクセシビリティ', () => {
  test('キーボード操作', async ({ page }) => {
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="url"]')).toBeFocused();
    
    // Enterキーで送信
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=test');
    await page.keyboard.press('Enter');
  });
});