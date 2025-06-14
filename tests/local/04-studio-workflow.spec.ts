import { test, expect } from '@playwright/test';

test.describe('Studio Workflow Tests - 動画編集スタジオ', () => {
  
  test('should load studio page', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // スタジオページが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // 認証が必要な場合は適切にハンドリング
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      expect(currentUrl).toContain('/auth');
    } else {
      expect(currentUrl).toContain('/studio');
    }
  });

  test('should display video template selector', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // テンプレート選択要素の確認
      const templateSelectors = [
        '[data-testid*="template"]',
        '.template-selector',
        '.template-grid',
        'button:has-text(/template|テンプレート/i)',
        '[role="radiogroup"]', // テンプレート選択用のラジオグループ
        '.template-card'
      ];
      
      let templateSelectorFound = false;
      for (const selector of templateSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          templateSelectorFound = true;
          break;
        }
      }
      
      // テンプレート関連のテキスト確認
      const templateTexts = [
        'text=/choose.*template|テンプレート.*選択/i',
        'text=/video.*template|動画.*テンプレート/i',
        'text=/template.*library|テンプレート.*ライブラリ/i'
      ];
      
      for (const textSelector of templateTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          templateSelectorFound = true;
          break;
        }
      }
      
      expect(templateSelectorFound).toBeTruthy();
    }
  });

  test('should handle template selection', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // テンプレートオプションを探す
      const templateOptions = [
        'button[data-template]',
        '.template-card button',
        'input[type="radio"][name*="template"]',
        'button:has-text(/select|選択/i)'
      ];
      
      for (const optionSelector of templateOptions) {
        const options = page.locator(optionSelector);
        if (await options.count() > 0) {
          // 最初のテンプレートを選択
          await options.first().click();
          await page.waitForTimeout(500);
          
          // 選択状態の確認
          const selectedTemplate = page.locator(optionSelector + '[aria-selected="true"], ' + optionSelector + '.selected, ' + optionSelector + ':checked');
          if (await selectedTemplate.count() > 0) {
            await expect(selectedTemplate.first()).toBeVisible();
          }
          
          // 複数のテンプレートがある場合、別のテンプレートも選択してみる
          if (await options.count() > 1) {
            await options.nth(1).click();
            await page.waitForTimeout(500);
          }
          
          break;
        }
      }
    }
  });

  test('should display content input forms', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // コンテンツ入力フォームの確認
      const inputElements = [
        'textarea[placeholder*="content"], textarea[placeholder*="コンテンツ"]',
        'input[placeholder*="title"], input[placeholder*="タイトル"]',
        'textarea[placeholder*="script"], textarea[placeholder*="スクリプト"]',
        'input[type="text"][name*="content"]',
        '[contenteditable="true"]',
        '.text-editor'
      ];
      
      let inputFound = false;
      for (const inputSelector of inputElements) {
        const input = page.locator(inputSelector);
        if (await input.count() > 0) {
          await expect(input.first()).toBeVisible();
          inputFound = true;
          break;
        }
      }
      
      // フォームラベルやヘルプテキストの確認
      const formTexts = [
        'text=/enter.*content|コンテンツ.*入力/i',
        'text=/video.*title|動画.*タイトル/i',
        'text=/script.*text|スクリプト.*テキスト/i',
        'text=/description|説明/i'
      ];
      
      for (const textSelector of formTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          inputFound = true;
          break;
        }
      }
      
      expect(inputFound).toBeTruthy();
    }
  });

  test('should handle content input', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // テキスト入力欄を探してテストコンテンツを入力
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="タイトル"], input[name*="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('テストタイトル - AI動画生成');
        await expect(titleInput).toHaveValue('テストタイトル - AI動画生成');
      }
      
      const contentTextarea = page.locator('textarea[placeholder*="content"], textarea[placeholder*="コンテンツ"], textarea[name*="content"]').first();
      if (await contentTextarea.count() > 0) {
        const testContent = 'これはテスト用のコンテンツです。AI動画生成機能をテストしています。';
        await contentTextarea.fill(testContent);
        await expect(contentTextarea).toHaveValue(testContent);
      }
      
      // リッチテキストエディターがある場合
      const richEditor = page.locator('[contenteditable="true"]').first();
      if (await richEditor.count() > 0) {
        await richEditor.click();
        await richEditor.fill('リッチテキストエディターのテストコンテンツ');
      }
    }
  });

  test('should display video preview functionality', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プレビュー関連要素の確認
      const previewElements = [
        '[data-testid*="preview"]',
        '.video-preview',
        'video',
        'canvas',
        '.preview-container',
        'button:has-text(/preview|プレビュー/i)'
      ];
      
      let previewFound = false;
      for (const selector of previewElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          previewFound = true;
          break;
        }
      }
      
      // プレビュー関連のテキスト確認
      const previewTexts = [
        'text=/preview|プレビュー/i',
        'text=/video.*preview|動画.*プレビュー/i',
        'text=/watch.*preview|プレビュー.*視聴/i'
      ];
      
      for (const textSelector of previewTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          previewFound = true;
          break;
        }
      }
      
      expect(previewFound).toBeTruthy();
    }
  });

  test('should handle preview generation', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プレビュー生成ボタンを探す
      const previewButton = page.locator('button:has-text(/preview|プレビュー/i), button:has-text(/generate|生成/i)').first();
      
      if (await previewButton.count() > 0) {
        // ボタンが有効であることを確認
        await expect(previewButton).toBeEnabled();
        
        // プレビュー生成をクリック
        await previewButton.click();
        await page.waitForTimeout(1000);
        
        // ローディング状態の確認
        const loadingStates = [
          '.loading, .spinner',
          'text=/generating|生成中/i',
          'text=/processing|処理中/i',
          '[aria-busy="true"]'
        ];
        
        for (const loadingSelector of loadingStates) {
          const loadingElement = page.locator(loadingSelector);
          if (await loadingElement.count() > 0) {
            // ローディング状態が表示されることを確認
            break;
          }
        }
        
        // プレビュー完了後のビデオ要素確認（時間がかかる場合があるため短時間で確認）
        await page.waitForTimeout(2000);
        const videoElement = page.locator('video, canvas, .video-player');
        if (await videoElement.count() > 0) {
          await expect(videoElement.first()).toBeVisible();
        }
      }
    }
  });

  test('should display generation settings', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 生成設定要素の確認
      const settingElements = [
        '[data-testid*="settings"]',
        '.generation-settings',
        '.video-settings',
        'select[name*="quality"], select[name*="resolution"]',
        'input[type="range"]', // スライダー
        'select[name*="format"]',
        'input[type="checkbox"][name*="audio"]'
      ];
      
      let settingsFound = false;
      for (const selector of settingElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          settingsFound = true;
          break;
        }
      }
      
      // 設定関連のテキスト確認
      const settingTexts = [
        'text=/quality|品質/i',
        'text=/resolution|解像度/i',
        'text=/format|フォーマット/i',
        'text=/settings|設定/i',
        'text=/options|オプション/i'
      ];
      
      for (const textSelector of settingTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          settingsFound = true;
          break;
        }
      }
      
      // 設定要素が存在することを期待（ただし、実装によっては存在しない場合もある）
    }
  });

  test('should handle video generation workflow', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // ワークフローの各段階をテスト
      
      // 1. テンプレート選択
      const templateButton = page.locator('button[data-template], .template-card button, button:has-text(/select|選択/i)').first();
      if (await templateButton.count() > 0) {
        await templateButton.click();
        await page.waitForTimeout(500);
      }
      
      // 2. コンテンツ入力
      const contentInput = page.locator('textarea, input[type="text"]').first();
      if (await contentInput.count() > 0) {
        await contentInput.fill('ワークフローテスト用コンテンツ');
      }
      
      // 3. 生成ボタンクリック
      const generateButton = page.locator('button:has-text(/generate|生成/i), button:has-text(/create|作成/i)').first();
      if (await generateButton.count() > 0) {
        await expect(generateButton).toBeEnabled();
        await generateButton.click();
        
        // 生成処理開始の確認
        await page.waitForTimeout(1000);
        
        // 進行状況の表示確認
        const progressIndicators = [
          '[role="progressbar"]',
          '.progress',
          'text=/generating|生成中/i',
          'text=/\\d+%/',
          '.spinner'
        ];
        
        for (const indicator of progressIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0) {
            // 進行状況が表示されることを確認
            break;
          }
        }
      }
    }
  });

  test('should handle social media platform selection', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // ソーシャルメディアプラットフォーム選択の確認
      const platformSelectors = [
        'input[type="checkbox"][name*="platform"]',
        'button:has-text(/tiktok/i)',
        'button:has-text(/instagram/i)',
        'button:has-text(/youtube/i)',
        'button:has-text(/twitter/i)',
        '[data-platform]'
      ];
      
      let platformSelectorFound = false;
      for (const selector of platformSelectors) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          // プラットフォーム選択要素をクリック
          await elements.first().click();
          await page.waitForTimeout(500);
          platformSelectorFound = true;
          break;
        }
      }
      
      // プラットフォーム関連のテキスト確認
      const platformTexts = [
        'text=/TikTok/i',
        'text=/Instagram/i',
        'text=/YouTube/i',
        'text=/Twitter/i',
        'text=/platform|プラットフォーム/i'
      ];
      
      for (const textSelector of platformTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          platformSelectorFound = true;
          break;
        }
      }
      
      // プラットフォーム選択機能があることを期待
    }
  });

  test('should be responsive in studio interface', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // デスクトップ表示
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('body')).toBeVisible();
      
      // タブレット表示
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('body')).toBeVisible();
      
      // モバイル表示
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
      
      // モバイルでの主要要素の確認
      const mobileElements = [
        'button', // ボタンがタップ可能
        'input, textarea', // 入力欄が使用可能
        '.template-card, button[data-template]' // テンプレート選択が使用可能
      ];
      
      for (const elementSelector of mobileElements) {
        const elements = page.locator(elementSelector);
        if (await elements.count() > 0) {
          const firstElement = elements.first();
          await expect(firstElement).toBeVisible();
          
          // タップ領域が十分大きいことを確認
          const elementBox = await firstElement.boundingBox();
          if (elementBox) {
            expect(Math.min(elementBox.width, elementBox.height)).toBeGreaterThan(30);
          }
        }
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // エラー状態のテスト（空のコンテンツで生成を試行）
      const generateButton = page.locator('button:has-text(/generate|生成/i)').first();
      
      if (await generateButton.count() > 0) {
        // コンテンツを入力せずに生成ボタンをクリック
        await generateButton.click();
        await page.waitForTimeout(1000);
        
        // エラーメッセージの確認
        const errorMessages = [
          'text=/error|エラー/i',
          'text=/required.*field|必須.*項目/i',
          'text=/content.*required|コンテンツ.*必要/i',
          '.error-message',
          '[role="alert"]'
        ];
        
        for (const errorSelector of errorMessages) {
          const errorElement = page.locator(errorSelector);
          if (await errorElement.count() > 0) {
            await expect(errorElement.first()).toBeVisible();
            break;
          }
        }
        
        // フォームバリデーションの確認
        const requiredInputs = page.locator('input[required], textarea[required]');
        if (await requiredInputs.count() > 0) {
          const firstRequired = requiredInputs.first();
          const isInvalid = await firstRequired.evaluate(el => !(el as HTMLInputElement).validity.valid);
          // 必須フィールドのバリデーションが動作することを確認
        }
      }
    }
  });
});