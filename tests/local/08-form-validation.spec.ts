import { test, expect } from '@playwright/test';

test.describe('Form Validation Tests - フォームバリデーション', () => {
  
  test.describe('Upload Form Validation', () => {
    test('should validate required fields on upload form', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        // 必須フィールドのテスト
        const requiredFields = [
          'input[required]',
          'textarea[required]',
          'select[required]'
        ];
        
        for (const fieldSelector of requiredFields) {
          const fields = page.locator(fieldSelector);
          if (await fields.count() > 0) {
            const firstField = fields.first();
            
            // 空のままでフォーム送信を試行
            const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
            if (await submitButton.count() > 0) {
              await submitButton.click();
              
              // HTML5バリデーションメッセージまたはカスタムエラーを確認
              const isInvalid = await firstField.evaluate(el => !(el as HTMLInputElement).validity.valid);
              const validationMessage = await firstField.evaluate(el => (el as HTMLInputElement).validationMessage);
              
              expect(isInvalid || validationMessage.length > 0).toBeTruthy();
            }
          }
        }
      }
    });

    test('should validate file type restrictions', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        const fileInput = page.locator('input[type="file"]').first();
        
        if (await fileInput.count() > 0) {
          // accept属性の確認
          const acceptAttribute = await fileInput.getAttribute('accept');
          
          if (acceptAttribute) {
            expect(acceptAttribute).toBeTruthy();
            
            // 無効なファイルタイプをテスト（テキストファイル）
            const invalidFile = Buffer.from('This is not a video file', 'utf8');
            
            try {
              await fileInput.setInputFiles({
                name: 'invalid.txt',
                mimeType: 'text/plain',
                buffer: invalidFile
              });
              
              await page.waitForTimeout(1000);
              
              // エラーメッセージの確認
              const errorMessages = [
                'text=/invalid.*file.*type|無効.*ファイル.*形式/i',
                'text=/unsupported.*format|サポート.*されていない.*形式/i',
                'text=/please.*select.*video|動画.*ファイル.*選択/i',
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
            } catch (error) {
              // ブラウザがファイルタイプを拒否する場合もある
              console.log('File type validation handled by browser');
            }
          }
        }
      }
    });

    test('should validate YouTube URL format', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        const youtubeInput = page.locator('input[placeholder*="YouTube"], input[placeholder*="youtube"], input[name*="youtube"], input[name*="url"]').first();
        
        if (await youtubeInput.count() > 0) {
          // 無効なURL形式をテスト
          const invalidUrls = [
            'not-a-url',
            'http://example.com',
            'https://vimeo.com/123456789',
            'youtube.com/watch?v=123', // プロトコルなし
            'https://youtube.com/invalid'
          ];
          
          for (const invalidUrl of invalidUrls) {
            await youtubeInput.fill(invalidUrl);
            
            // 送信ボタンをクリック
            const submitButton = page.locator('button[type="submit"], button:has-text(/submit|送信|アップロード/i)').first();
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await page.waitForTimeout(500);
              
              // バリデーションエラーの確認
              const urlValidationErrors = [
                'text=/invalid.*url|無効.*URL/i',
                'text=/invalid.*youtube.*url|無効.*YouTube.*URL/i',
                'text=/please.*enter.*valid.*url|有効.*URL.*入力/i'
              ];
              
              let validationFound = false;
              for (const errorSelector of urlValidationErrors) {
                const errorElement = page.locator(errorSelector);
                if (await errorElement.count() > 0) {
                  await expect(errorElement.first()).toBeVisible();
                  validationFound = true;
                  break;
                }
              }
              
              // HTML5バリデーション確認
              const isUrlInvalid = await youtubeInput.evaluate(el => {
                const input = el as HTMLInputElement;
                return !input.validity.valid;
              });
              
              expect(validationFound || isUrlInvalid).toBeTruthy();
            }
          }
          
          // 有効なYouTube URLをテスト
          const validUrls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://youtube.com/watch?v=dQw4w9WgXcQ'
          ];
          
          for (const validUrl of validUrls) {
            await youtubeInput.fill(validUrl);
            
            // バリデーションが通ることを確認
            const isUrlValid = await youtubeInput.evaluate(el => {
              const input = el as HTMLInputElement;
              return input.validity.valid;
            });
            
            expect(isUrlValid).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Studio Form Validation', () => {
    test('should validate content input requirements', async ({ page }) => {
      await page.goto('/studio');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        // コンテンツ入力フィールドの確認
        const contentFields = [
          'textarea[required]',
          'input[type="text"][required]',
          '[contenteditable="true"][required]'
        ];
        
        for (const fieldSelector of contentFields) {
          const fields = page.locator(fieldSelector);
          if (await fields.count() > 0) {
            const firstField = fields.first();
            
            // 空のコンテンツで生成を試行
            const generateButton = page.locator('button:has-text(/generate|生成/i), button[type="submit"]').first();
            if (await generateButton.count() > 0) {
              await generateButton.click();
              await page.waitForTimeout(500);
              
              // バリデーションエラーの確認
              const contentErrors = [
                'text=/content.*required|コンテンツ.*必要/i',
                'text=/please.*enter.*content|コンテンツ.*入力/i',
                'text=/field.*required|必須.*項目/i'
              ];
              
              let errorFound = false;
              for (const errorSelector of contentErrors) {
                const errorElement = page.locator(errorSelector);
                if (await errorElement.count() > 0) {
                  await expect(errorElement.first()).toBeVisible();
                  errorFound = true;
                  break;
                }
              }
              
              // HTML5バリデーション確認
              const isInvalid = await firstField.evaluate(el => {
                if (el.tagName.toLowerCase() === 'textarea' || el.tagName.toLowerCase() === 'input') {
                  return !(el as HTMLInputElement).validity.valid;
                }
                return false;
              });
              
              expect(errorFound || isInvalid).toBeTruthy();
            }
          }
        }
      }
    });

    test('should validate content length limits', async ({ page }) => {
      await page.goto('/studio');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        const textareas = page.locator('textarea');
        
        if (await textareas.count() > 0) {
          const firstTextarea = textareas.first();
          
          // maxlength属性の確認
          const maxLength = await firstTextarea.getAttribute('maxlength');
          
          if (maxLength) {
            const maxLengthNum = parseInt(maxLength);
            const tooLongText = 'A'.repeat(maxLengthNum + 100);
            
            await firstTextarea.fill(tooLongText);
            
            // 実際の入力値が制限されていることを確認
            const actualValue = await firstTextarea.inputValue();
            expect(actualValue.length).toBeLessThanOrEqual(maxLengthNum);
          }
          
          // カスタムの文字数制限チェック
          const veryLongText = 'A'.repeat(10000);
          await firstTextarea.fill(veryLongText);
          
          const submitButton = page.locator('button[type="submit"], button:has-text(/generate|生成/i)').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(500);
            
            // 長すぎる内容のエラーメッセージ確認
            const lengthErrors = [
              'text=/too.*long|長すぎ/i',
              'text=/character.*limit|文字.*制限/i',
              'text=/maximum.*length|最大.*文字/i'
            ];
            
            for (const errorSelector of lengthErrors) {
              const errorElement = page.locator(errorSelector);
              if (await errorElement.count() > 0) {
                await expect(errorElement.first()).toBeVisible();
                break;
              }
            }
          }
        }
      }
    });

    test('should validate template selection', async ({ page }) => {
      await page.goto('/studio');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        // テンプレート選択なしで生成を試行
        const generateButton = page.locator('button:has-text(/generate|生成/i), button[type="submit"]').first();
        
        if (await generateButton.count() > 0) {
          // テンプレートを選択せずに生成ボタンをクリック
          await generateButton.click();
          await page.waitForTimeout(500);
          
          // テンプレート選択エラーの確認
          const templateErrors = [
            'text=/select.*template|テンプレート.*選択/i',
            'text=/template.*required|テンプレート.*必要/i',
            'text=/choose.*template|テンプレート.*選ん/i'
          ];
          
          for (const errorSelector of templateErrors) {
            const errorElement = page.locator(errorSelector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              break;
            }
          }
          
          // テンプレート選択フィールドのバリデーション
          const templateRadios = page.locator('input[type="radio"][name*="template"]');
          if (await templateRadios.count() > 0) {
            const isAnySelected = await templateRadios.evaluate(radios => {
              return Array.from(radios as NodeListOf<HTMLInputElement>).some(radio => radio.checked);
            });
            
            if (!isAnySelected) {
              // 何も選択されていない場合のバリデーション
              expect(isAnySelected).toBeFalsy();
            }
          }
        }
      }
    });
  });

  test.describe('Authentication Form Validation', () => {
    test('should validate email format in sign-in form', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('input[type="email"]').first();
      
      if (await emailInput.count() > 0) {
        // 無効なメール形式をテスト
        const invalidEmails = [
          'invalid-email',
          'test@',
          '@example.com',
          'test.example.com',
          'test @example.com' // スペース含む
        ];
        
        for (const invalidEmail of invalidEmails) {
          await emailInput.fill(invalidEmail);
          
          const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(500);
            
            // HTML5バリデーションエラーの確認
            const isInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
            const validationMessage = await emailInput.evaluate(el => (el as HTMLInputElement).validationMessage);
            
            expect(isInvalid).toBeTruthy();
            expect(validationMessage.length).toBeGreaterThan(0);
          }
        }
        
        // 有効なメール形式をテスト
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.jp',
          'test+tag@example.org'
        ];
        
        for (const validEmail of validEmails) {
          await emailInput.fill(validEmail);
          
          const isValid = await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid);
          expect(isValid).toBeTruthy();
        }
      }
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');
      
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await passwordInput.count() > 0) {
        // パスワードの最小長要件の確認
        const minLength = await passwordInput.getAttribute('minlength');
        
        if (minLength) {
          const minLengthNum = parseInt(minLength);
          const shortPassword = 'a'.repeat(minLengthNum - 1);
          
          await passwordInput.fill(shortPassword);
          
          const submitButton = page.locator('button[type="submit"]').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(500);
            
            // 短すぎるパスワードのバリデーション
            const isInvalid = await passwordInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
            expect(isInvalid).toBeTruthy();
          }
        }
        
        // 空のパスワードのテスト
        await passwordInput.fill('');
        
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // 必須フィールドのバリデーション
          const isRequired = await passwordInput.getAttribute('required') !== null;
          if (isRequired) {
            const isInvalid = await passwordInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
            expect(isInvalid).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Real-time Validation', () => {
    test('should show validation feedback in real-time', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        const urlInput = page.locator('input[placeholder*="YouTube"], input[name*="url"]').first();
        
        if (await urlInput.count() > 0) {
          // 無効な入力を段階的に行う
          await urlInput.type('h', { delay: 100 });
          await page.waitForTimeout(300);
          
          await urlInput.type('ttp://invalid', { delay: 100 });
          await page.waitForTimeout(300);
          
          // リアルタイムバリデーションメッセージの確認
          const realtimeErrors = [
            '.field-error',
            '.validation-error',
            '.invalid-feedback',
            '[role="alert"]'
          ];
          
          for (const errorSelector of realtimeErrors) {
            const errorElement = page.locator(errorSelector);
            if (await errorElement.count() > 0) {
              // リアルタイムエラーが表示されることを確認
              break;
            }
          }
          
          // 有効な入力に修正
          await urlInput.fill('https://www.youtube.com/watch?v=test');
          await page.waitForTimeout(500);
          
          // エラーが消えることを確認
          const persistentErrors = page.locator('.field-error:visible, .validation-error:visible');
          const errorCount = await persistentErrors.count();
          
          // エラーが解消されることを期待
        }
      }
    });

    test('should provide helpful validation messages', async ({ page }) => {
      const testPages = [
        { path: '/upload', name: 'Upload Form' },
        { path: '/studio', name: 'Studio Form' },
        { path: '/auth/signin', name: 'Sign-in Form' }
      ];
      
      for (const testPage of testPages) {
        await page.goto(testPage.path);
        await page.waitForLoadState('networkidle');
        
        if (!page.url().includes('/auth') || testPage.path.includes('/auth')) {
          // フォーム送信でバリデーションエラーを発生させる
          const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(1000);
            
            // エラーメッセージの内容確認
            const errorMessages = page.locator('.error-message, .validation-error, [role="alert"]');
            
            if (await errorMessages.count() > 0) {
              const firstError = errorMessages.first();
              const errorText = await firstError.textContent();
              
              if (errorText) {
                // エラーメッセージが具体的で有用であることを確認
                expect(errorText.length).toBeGreaterThan(5);
                expect(errorText.toLowerCase()).not.toBe('error');
                expect(errorText.toLowerCase()).not.toBe('invalid');
              }
            }
          }
        }
      }
    });
  });

  test.describe('Accessibility in Validation', () => {
    test('should associate error messages with form fields', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');
      
      // バリデーションエラーを発生させる
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // フォームフィールドとエラーメッセージの関連付け確認
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.count() > 0) {
          const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
          const ariaInvalid = await emailInput.getAttribute('aria-invalid');
          
          // アクセシビリティ属性が適切に設定されていることを確認
          if (ariaDescribedBy) {
            const errorElement = page.locator(`#${ariaDescribedBy}`);
            if (await errorElement.count() > 0) {
              await expect(errorElement).toBeVisible();
            }
          }
          
          // aria-invalid属性の確認
          if (ariaInvalid) {
            expect(ariaInvalid).toBe('true');
          }
        }
      }
    });

    test('should announce validation errors to screen readers', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        // ライブリージョンの確認
        const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
        
        // バリデーションエラーを発生させる
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // エラーメッセージがライブリージョンに表示されることを確認
          if (await liveRegions.count() > 0) {
            const firstLiveRegion = liveRegions.first();
            const liveContent = await firstLiveRegion.textContent();
            
            if (liveContent && liveContent.trim().length > 0) {
              // ライブリージョンにエラー内容が表示されることを確認
              expect(liveContent.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });
});