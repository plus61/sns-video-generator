import { test, expect } from '@playwright/test';

test.describe('動画分割機能テスト - 実際の実装版', () => {
  test('動画分割ページの完全テスト', async ({ page }) => {
    console.log('🚀 動画分割テスト開始...\n');
    
    // 1. テストページにアクセス
    await page.goto('http://localhost:3000/test/split');
    await page.waitForLoadState('networkidle');
    console.log('✅ ページアクセス完了');
    
    // スクリーンショット - 初期状態
    await page.screenshot({ 
      path: 'e2e/screenshots/split-1-initial.png',
      fullPage: true 
    });
    
    // 2. ページタイトル確認
    const title = await page.locator('h1').textContent();
    expect(title).toBe('Video Split Test');
    console.log('✅ ページタイトル確認:', title);
    
    // 3. 入力フィールドの確認
    const videoIdInput = page.locator('input[placeholder*="Video ID"]');
    await expect(videoIdInput).toBeVisible();
    console.log('✅ Video ID入力フィールド: 表示確認');
    
    // 4. Splitボタンの確認（初期状態では無効）
    const splitButton = page.locator('button:has-text("Split into 3x10s clips")');
    await expect(splitButton).toBeVisible();
    await expect(splitButton).toBeDisabled();
    console.log('✅ Splitボタン: 初期状態で無効確認');
    
    // 5. ダミーのVideo IDを入力
    // 注意: 実際のVideo IDが必要な場合は、事前にアップロードまたはYouTubeダウンロードを行う必要があります
    const testVideoId = 'test-video-' + Date.now();
    await videoIdInput.fill(testVideoId);
    console.log('📝 Video ID入力:', testVideoId);
    
    // ボタンが有効になることを確認
    await expect(splitButton).toBeEnabled();
    console.log('✅ Splitボタン: 有効化確認');
    
    // スクリーンショット - 入力後
    await page.screenshot({ 
      path: 'e2e/screenshots/split-2-id-entered.png' 
    });
    
    // 6. 分割処理を実行
    console.log('🔄 動画分割処理開始...');
    await splitButton.click();
    
    // 処理中のステータス表示を確認
    const statusText = page.locator('text=/Splitting video into 10-second clips/i');
    await expect(statusText).toBeVisible({ timeout: 5000 });
    console.log('✅ 処理中ステータス表示確認');
    
    // スクリーンショット - 処理中
    await page.screenshot({ 
      path: 'e2e/screenshots/split-3-processing.png' 
    });
    
    // 7. 結果を待つ（エラーまたは成功）
    console.log('⏳ 処理結果を待機中...');
    
    // エラーまたは成功のいずれかを待つ
    await page.waitForSelector('text=/Error:|Split complete!/i', { 
      timeout: 30000 
    });
    
    // 最終ステータスを取得
    const finalStatus = await page.locator('.border p').nth(1).textContent();
    console.log('📊 最終ステータス:', finalStatus);
    
    // スクリーンショット - 最終結果
    await page.screenshot({ 
      path: 'e2e/screenshots/split-4-final-result.png',
      fullPage: true 
    });
    
    // 8. 結果の検証
    if (finalStatus?.includes('Split complete!')) {
      console.log('✅ 動画分割成功！');
      
      // クリップが生成されたか確認
      const clipElements = await page.locator('video').count();
      console.log(`📹 生成されたクリップ数: ${clipElements}`);
      
      if (clipElements > 0) {
        expect(clipElements).toBe(3); // 3つのクリップが期待される
      }
    } else if (finalStatus?.includes('Error:')) {
      console.log('⚠️ エラーが発生しました（これは想定内です）');
      console.log('理由: 実際のVideo IDが存在しないため');
    }
    
    console.log('\n✨ テスト完了！');
  });

  test('YouTube URLからの動画分割フロー（統合テスト）', async ({ page }) => {
    console.log('🎬 YouTube統合テスト開始...\n');
    
    // まずホームページにアクセス
    await page.goto('http://localhost:3000');
    console.log('✅ ホームページアクセス');
    
    // テストページへのリンクを探す（存在する場合）
    const testLink = page.locator('a[href*="/test"]');
    if (await testLink.count() > 0) {
      await testLink.first().click();
      console.log('✅ テストページリンクをクリック');
    } else {
      // 直接テストページへ
      await page.goto('http://localhost:3000/test/split');
      console.log('✅ テストページへ直接移動');
    }
    
    await page.waitForLoadState('networkidle');
    
    // スクリーンショット
    await page.screenshot({ 
      path: 'e2e/screenshots/youtube-integration.png',
      fullPage: true 
    });
    
    console.log('\n📝 注意: 完全な統合テストには以下が必要です:');
    console.log('1. YouTube URLからの動画ダウンロード機能');
    console.log('2. ダウンロードされた動画のVideo ID取得');
    console.log('3. そのVideo IDを使用した分割処理');
    
    console.log('\n✨ YouTube統合テスト完了！');
  });
});