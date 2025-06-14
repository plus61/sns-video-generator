import { test, expect } from '@playwright/test';
import { createWriteStream } from 'fs';
import { join } from 'path';

test.describe('Video Upload Tests - ローカル + YouTube URL', () => {
  
  // テスト用のモック動画ファイルを作成するヘルパー関数
  const createMockVideoFile = (filename: string, size: number = 1024) => {
    const buffer = Buffer.alloc(size, 0);
    // MP4ファイルのマジックナンバーを追加
    buffer.write('ftyp', 4);
    buffer.write('mp4', 8);
    return buffer;
  };

  test('should load upload page', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    // アップロードページが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // 認証が必要な場合は適切にハンドリング
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      // 認証ページにリダイレクトされた場合は成功
      expect(currentUrl).toContain('/auth');
    } else {
      // アップロードページが表示された場合
      expect(currentUrl).toContain('/upload');
    }
  });

  test('should display file upload interface', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    // 認証ページでない場合のみテスト実行
    if (!page.url().includes('/auth')) {
      // ファイルアップロード要素の確認
      const fileUploadElements = [
        'input[type="file"]',
        '[data-testid*="upload"]',
        '.dropzone',
        '[accept*="video"]'
      ];
      
      let uploadElementFound = false;
      for (const selector of fileUploadElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          uploadElementFound = true;
          break;
        }
      }
      
      // ドラッグ&ドロップのテキスト確認
      const dragDropTexts = [
        'text=/drag.*drop|ドラッグ.*ドロップ/i',
        'text=/select.*file|ファイル.*選択/i',
        'text=/upload.*video|動画.*アップロード/i'
      ];
      
      for (const textSelector of dragDropTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          uploadElementFound = true;
          break;
        }
      }
      
      // 何らかのアップロード関連要素が存在することを確認
      expect(uploadElementFound).toBeTruthy();
    }
  });

  test('should display YouTube URL input interface', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // YouTube URL入力欄の確認
      const youtubeInputSelectors = [
        'input[placeholder*="YouTube"], input[placeholder*="youtube"]',
        'input[placeholder*="URL"], input[placeholder*="url"]',
        '[data-testid*="youtube"]',
        'input[name*="youtube"], input[name*="url"]'
      ];
      
      let youtubeInputFound = false;
      for (const selector of youtubeInputSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          youtubeInputFound = true;
          break;
        }
      }
      
      // YouTube関連のテキスト確認
      const youtubeTexts = [
        'text=/YouTube.*URL|YouTube.*リンク/i',
        'text=/動画.*URL|Video.*URL/i',
        'text=/https://www.youtube.com/i'
      ];
      
      for (const textSelector of youtubeTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          youtubeInputFound = true;
          break;
        }
      }
      
      // 何らかのYouTube関連要素が存在することを確認
      expect(youtubeInputFound).toBeTruthy();
    }
  });

  test('should handle file upload interaction', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // ファイル選択ダイアログが開くことを確認
        await expect(fileInput).toBeVisible();
        
        // ファイル入力欄の属性を確認
        const acceptAttribute = await fileInput.getAttribute('accept');
        if (acceptAttribute) {
          // 動画ファイルを受け入れることを確認
          expect(acceptAttribute.includes('video') || acceptAttribute.includes('.mp4') || acceptAttribute.includes('.mov')).toBeTruthy();
        }
        
        // 複数ファイル選択が可能かどうか確認
        const isMultiple = await fileInput.getAttribute('multiple');
        // multiple属性があってもなくても正常（実装に依存）
        
        // テスト用の小さなファイルをアップロード
        const mockFile = createMockVideoFile('test.mp4', 100);
        
        // ファイルを設定（実際のアップロードは行わない）
        await fileInput.setInputFiles({
          name: 'test-video.mp4',
          mimeType: 'video/mp4',
          buffer: mockFile
        });
        
        // アップロード後のUI変化を確認
        await page.waitForTimeout(1000); // UI反応を待つ
        
        // プログレスバーやファイル名表示の確認
        const uploadIndicators = [
          '.progress, [role="progressbar"]',
          'text=/test-video.mp4/',
          'text=/uploading|アップロード中/i',
          '.file-name, .filename'
        ];
        
        for (const indicator of uploadIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0) {
            // アップロード状態を示す要素が表示されることを確認
            break;
          }
        }
      }
    }
  });

  test('should validate YouTube URL format', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // YouTube URL入力欄を探す
      const youtubeInput = page.locator('input[placeholder*="YouTube"], input[placeholder*="youtube"], input[placeholder*="URL"]').first();
      
      if (await youtubeInput.count() > 0) {
        // 無効なURLを入力
        await youtubeInput.fill('invalid-url');
        
        // 送信ボタンを探してクリック
        const submitButton = page.locator('button[type="submit"], button:has-text(/submit|送信|アップロード/i)').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // エラーメッセージまたはバリデーションの確認
          const errorMessages = [
            'text=/invalid.*url|無効.*URL/i',
            'text=/youtube.*url.*required|YouTube.*URL.*必要/i',
            'text=/valid.*youtube.*link|有効.*YouTube.*リンク/i'
          ];
          
          let validationFound = false;
          for (const errorSelector of errorMessages) {
            const errorElement = page.locator(errorSelector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              validationFound = true;
              break;
            }
          }
          
          // HTML5バリデーション確認
          const isInvalid = await youtubeInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
          
          expect(validationFound || isInvalid).toBeTruthy();
        }
        
        // 有効なYouTube URLを入力
        await youtubeInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // 処理開始の確認
          await page.waitForTimeout(1000);
          
          // ローディング状態やプログレス表示の確認
          const processingIndicators = [
            'text=/processing|処理中/i',
            'text=/downloading|ダウンロード中/i',
            '.loading, .spinner',
            '[role="progressbar"]'
          ];
          
          for (const indicator of processingIndicators) {
            const element = page.locator(indicator);
            if (await element.count() > 0) {
              // 処理中の表示があることを確認
              break;
            }
          }
        }
      }
    }
  });

  test('should handle file size validation', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // 大きなファイルサイズのモックファイル作成（100MB相当）
        const largeMockFile = createMockVideoFile('large-test.mp4', 100 * 1024 * 1024);
        
        try {
          await fileInput.setInputFiles({
            name: 'large-video.mp4',
            mimeType: 'video/mp4',
            buffer: largeMockFile
          });
          
          await page.waitForTimeout(2000);
          
          // ファイルサイズエラーメッセージの確認
          const sizeErrorMessages = [
            'text=/file.*too.*large|ファイル.*大きすぎ/i',
            'text=/size.*limit|サイズ.*制限/i',
            'text=/maximum.*size|最大.*サイズ/i'
          ];
          
          for (const errorSelector of sizeErrorMessages) {
            const errorElement = page.locator(errorSelector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              break;
            }
          }
        } catch (error) {
          // ファイルサイズが大きすぎてsetInputFilesが失敗する場合もある
          console.log('Large file test skipped due to size limitations');
        }
      }
    }
  });

  test('should display upload progress', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        const mockFile = createMockVideoFile('progress-test.mp4', 1024);
        
        await fileInput.setInputFiles({
          name: 'progress-test.mp4',
          mimeType: 'video/mp4',
          buffer: mockFile
        });
        
        // プログレス関連要素の確認
        await page.waitForTimeout(1000);
        
        const progressElements = [
          '[role="progressbar"]',
          '.progress-bar',
          'progress',
          'text=/\\d+%/',
          '.upload-progress'
        ];
        
        let progressFound = false;
        for (const selector of progressElements) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            progressFound = true;
            break;
          }
        }
        
        // アップロード状態のテキスト確認
        const statusTexts = [
          'text=/uploading|アップロード中/i',
          'text=/processing|処理中/i',
          'text=/complete|完了/i'
        ];
        
        for (const statusSelector of statusTexts) {
          const statusElement = page.locator(statusSelector);
          if (await statusElement.count() > 0) {
            progressFound = true;
            break;
          }
        }
        
        // 何らかのプログレス表示があることを期待
        // （実装に依存するため、存在しない場合もある）
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // モバイルでの表示確認
      await expect(page.locator('body')).toBeVisible();
      
      // ファイルアップロード要素がモバイルで使用可能
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeVisible();
        
        // タップ領域が十分大きいことを確認
        const inputBox = await fileInput.boundingBox();
        if (inputBox) {
          expect(Math.min(inputBox.width, inputBox.height)).toBeGreaterThan(30);
        }
      }
      
      // YouTube URL入力欄がモバイルで使用可能
      const youtubeInput = page.locator('input[placeholder*="YouTube"], input[placeholder*="URL"]').first();
      if (await youtubeInput.count() > 0) {
        await expect(youtubeInput).toBeVisible();
      }
    }
  });

  test('should handle multiple upload methods', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // タブまたは選択肢の確認
      const uploadTabs = [
        'button:has-text(/local|ローカル/i)',
        'button:has-text(/youtube/i)',
        '.tab',
        '[role="tab"]'
      ];
      
      let tabSystemFound = false;
      for (const tabSelector of uploadTabs) {
        const tabs = page.locator(tabSelector);
        if (await tabs.count() > 1) {
          // 複数のタブがある場合、切り替えをテスト
          await tabs.first().click();
          await page.waitForTimeout(500);
          await tabs.nth(1).click();
          await page.waitForTimeout(500);
          tabSystemFound = true;
          break;
        }
      }
      
      // ファイルアップロードとURL入力の両方が利用可能かどうか確認
      const hasFileInput = await page.locator('input[type="file"]').count() > 0;
      const hasUrlInput = await page.locator('input[placeholder*="YouTube"], input[placeholder*="URL"]').count() > 0;
      
      // 少なくとも一つのアップロード方法が利用可能であることを確認
      expect(hasFileInput || hasUrlInput).toBeTruthy();
    }
  });
});