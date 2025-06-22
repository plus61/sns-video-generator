import { test, expect } from '@playwright/test';

test.describe('動画分割機能 - 完全動作確認', () => {
  test.beforeEach(async ({ page }) => {
    // テストページにアクセス
    await page.goto('http://localhost:3000/test/split');
    await page.waitForLoadState('networkidle');
  });

  test('1. UIの基本要素が表示される', async ({ page }) => {
    console.log('📱 UI要素の確認開始...');
    
    // ページタイトル確認
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    console.log('✅ ページタイトル:', await heading.textContent());
    
    // YouTube URL入力フィールド
    const urlInput = page.locator('input[type="text"], input[type="url"]').first();
    await expect(urlInput).toBeVisible();
    console.log('✅ URL入力フィールド: 表示確認');
    
    // Split Videoボタン
    const splitButton = page.locator('button').filter({ hasText: /split/i }).first();
    await expect(splitButton).toBeVisible();
    console.log('✅ Splitボタン: 表示確認');
    
    // スクリーンショット保存
    await page.screenshot({ 
      path: 'e2e/screenshots/01-ui-elements.png',
      fullPage: true 
    });
  });

  test('2. YouTube URL入力と検証', async ({ page }) => {
    console.log('🔗 YouTube URL入力テスト開始...');
    
    const urlInput = page.locator('input[type="text"], input[type="url"]').first();
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    // URL入力
    await urlInput.fill(testUrl);
    await expect(urlInput).toHaveValue(testUrl);
    console.log('✅ URL入力完了:', testUrl);
    
    // スクリーンショット
    await page.screenshot({ 
      path: 'e2e/screenshots/02-url-entered.png' 
    });
  });

  test('3. 動画分割処理の実行', async ({ page }) => {
    console.log('🎬 動画分割処理テスト開始...');
    
    // テスト用の短い動画URL
    const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - 19秒
    
    // URL入力
    const urlInput = page.locator('input[type="text"], input[type="url"]').first();
    await urlInput.fill(testUrl);
    
    // Splitボタンクリック
    const splitButton = page.locator('button').filter({ hasText: /split/i }).first();
    console.log('🔄 Splitボタンをクリック...');
    await splitButton.click();
    
    // 処理中の表示を確認
    await page.waitForTimeout(1000); // 処理開始を待つ
    await page.screenshot({ 
      path: 'e2e/screenshots/03-processing.png' 
    });
    
    // 結果表示を待つ（最大90秒）
    console.log('⏳ 処理完了を待機中...');
    
    try {
      // 成功パターンのセレクタ
      const successSelectors = [
        'text=/clip|success|complete|download/i',
        'a[href*=".mp4"]',
        'video',
        'button:has-text("Download")',
        'text=/segment|result/i'
      ];
      
      // いずれかの成功要素が表示されるまで待つ
      await page.waitForSelector(successSelectors.join(', '), { 
        timeout: 90000,
        state: 'visible' 
      });
      
      console.log('✅ 処理完了！結果が表示されました');
      
      // 結果のスクリーンショット
      await page.screenshot({ 
        path: 'e2e/screenshots/04-success.png',
        fullPage: true 
      });
      
      // クリップ数を確認
      const clips = await page.locator('a[href*=".mp4"], video, [data-testid*="clip"]').count();
      console.log(`📹 生成されたクリップ数: ${clips}`);
      
    } catch (error) {
      console.log('❌ タイムアウトまたはエラー');
      
      // エラー時のスクリーンショット
      await page.screenshot({ 
        path: 'e2e/screenshots/04-error.png',
        fullPage: true 
      });
      
      // エラーメッセージを探す
      const errorMessage = await page.locator('text=/error|failed|失敗/i').first().textContent().catch(() => 'エラーメッセージなし');
      console.log('エラー内容:', errorMessage);
      
      throw error;
    }
  });

  test('4. エラーハンドリング確認', async ({ page }) => {
    console.log('⚠️ エラーハンドリングテスト開始...');
    
    // 無効なURL
    const invalidUrl = 'not-a-valid-url';
    
    const urlInput = page.locator('input[type="text"], input[type="url"]').first();
    await urlInput.fill(invalidUrl);
    
    const splitButton = page.locator('button').filter({ hasText: /split/i }).first();
    await splitButton.click();
    
    // エラーメッセージを待つ
    await page.waitForSelector('text=/error|invalid|失敗/i', { 
      timeout: 10000 
    });
    
    console.log('✅ エラーメッセージが正しく表示されました');
    
    await page.screenshot({ 
      path: 'e2e/screenshots/05-error-handling.png' 
    });
  });
});

// 統合テスト
test('完全なエンドツーエンドフロー', async ({ page }) => {
  console.log('🚀 完全なE2Eテスト開始...\n');
  
  // 1. ホームページ確認
  await page.goto('http://localhost:3000');
  console.log('1️⃣ ホームページアクセス完了');
  
  // 2. テストページへ移動
  await page.goto('http://localhost:3000/test/split');
  await page.waitForLoadState('networkidle');
  console.log('2️⃣ 動画分割テストページへ移動完了');
  
  // 3. 動画URLを入力
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const urlInput = page.locator('input[type="text"], input[type="url"]').first();
  await urlInput.fill(testUrl);
  console.log('3️⃣ YouTube URL入力完了');
  
  // 4. 分割実行
  const splitButton = page.locator('button').filter({ hasText: /split/i }).first();
  await splitButton.click();
  console.log('4️⃣ 動画分割処理開始');
  
  // 5. 結果確認
  try {
    await page.waitForSelector('text=/clip|success|complete|download/i, a[href*=".mp4"]', { 
      timeout: 90000 
    });
    console.log('5️⃣ 動画分割成功！');
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'e2e/screenshots/e2e-complete.png',
      fullPage: true 
    });
    
    console.log('\n✨ E2Eテスト完了！すべての機能が正常に動作しています。');
  } catch (error) {
    console.log('❌ E2Eテスト失敗');
    await page.screenshot({ 
      path: 'e2e/screenshots/e2e-failed.png',
      fullPage: true 
    });
    throw error;
  }
});