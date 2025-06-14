import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests - レスポンシブデザイン', () => {
  
  const viewports = [
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Desktop Medium', width: 1366, height: 768 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Small', width: 320, height: 568 }
  ];

  const testPages = [
    { path: '/', name: 'Homepage' },
    { path: '/upload', name: 'Upload Page' },
    { path: '/studio', name: 'Studio Page' },
    { path: '/dashboard', name: 'Dashboard' }
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const testPage of testPages) {
        test(`should display ${testPage.name} correctly`, async ({ page }) => {
          await page.goto(testPage.path);
          await page.waitForLoadState('networkidle');
          
          // 認証ページにリダイレクトされた場合はスキップ
          if (page.url().includes('/auth')) {
            return;
          }
          
          // ページが表示されることを確認
          await expect(page.locator('body')).toBeVisible();
          
          // ビューポートに基づいたレイアウト確認
          if (viewport.width <= 768) {
            // モバイル・タブレット表示の確認
            await testMobileLayout(page);
          } else {
            // デスクトップ表示の確認
            await testDesktopLayout(page);
          }
        });
      }
    });
  }

  async function testMobileLayout(page: any) {
    // モバイルナビゲーション確認
    const mobileNavElements = [
      '.mobile-nav',
      '.hamburger',
      'button[aria-label*="menu"]',
      '.nav-toggle',
      'button[aria-expanded]'
    ];
    
    let mobileNavFound = false;
    for (const selector of mobileNavElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        mobileNavFound = true;
        
        // ハンバーガーメニューをクリックしてみる
        if (selector.includes('hamburger') || selector.includes('toggle')) {
          await element.first().click();
          await page.waitForTimeout(500);
        }
        break;
      }
    }
    
    // モバイル用のレイアウト確認
    const mobileLayoutElements = [
      '.mobile-layout',
      '.stack-layout',
      '.single-column'
    ];
    
    for (const selector of mobileLayoutElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
    
    // タッチフレンドリーなボタンサイズ確認
    const buttons = page.locator('button, a[role="button"]');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      const buttonBox = await firstButton.boundingBox();
      if (buttonBox) {
        // 44px x 44px 以上のタップ領域を推奨
        expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThan(40);
      }
    }
  }

  async function testDesktopLayout(page: any) {
    // デスクトップナビゲーション確認
    const desktopNavElements = [
      'nav:not(.mobile-nav)',
      '.desktop-nav',
      '.header-nav',
      '.main-navigation'
    ];
    
    for (const selector of desktopNavElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
    
    // デスクトップ用のマルチカラムレイアウト確認
    const desktopLayoutElements = [
      '.grid',
      '.multi-column',
      '.desktop-layout',
      '.sidebar'
    ];
    
    for (const selector of desktopLayoutElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
  }

  test('should handle orientation changes on mobile', async ({ page }) => {
    // ポートレートモード
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      await expect(page.locator('body')).toBeVisible();
      
      // ランドスケープモードに変更
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);
      
      // レイアウトが適応することを確認
      await expect(page.locator('body')).toBeVisible();
      
      // コンテンツが表示されることを確認
      const mainContent = page.locator('main, .main-content, .container');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
    }
  });

  test('should maintain readability at different zoom levels', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 標準ズーム (100%)
      await expect(page.locator('body')).toBeVisible();
      
      // テキストの可読性確認
      const textElements = page.locator('h1, h2, p, span, div').filter({ hasText: /\w+/ });
      if (await textElements.count() > 0) {
        const firstText = textElements.first();
        await expect(firstText).toBeVisible();
        
        // フォントサイズが適切であることを確認
        const fontSize = await firstText.evaluate(el => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });
        expect(fontSize).toBeGreaterThan(12); // 最小12px
      }
      
      // 150% ズーム シミュレーション（ビューポートサイズを小さくして近似）
      await page.setViewportSize({ width: 911, height: 512 }); // 1366/1.5, 768/1.5
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
      
      // 200% ズーム シミュレーション
      await page.setViewportSize({ width: 683, height: 384 }); // 1366/2, 768/2
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle content overflow gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // 最小幅
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 水平スクロールが発生していないことを確認
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // わずかなオーバーフローは許容（スクロールバー分など）
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
      
      // テキストが適切に折り返されることを確認
      const longTextElements = page.locator('h1, h2, p').filter({ hasText: /.{50,}/ });
      if (await longTextElements.count() > 0) {
        const firstLongText = longTextElements.first();
        const textBox = await firstLongText.boundingBox();
        if (textBox) {
          expect(textBox.width).toBeLessThanOrEqual(viewportWidth);
        }
      }
    }
  });

  test('should maintain interactive element accessibility across viewports', async ({ page }) => {
    const interactiveViewports = [
      { width: 320, height: 568 },   // Mobile small
      { width: 768, height: 1024 },  // Tablet
      { width: 1366, height: 768 }   // Desktop
    ];
    
    for (const viewport of interactiveViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        // インタラクティブ要素のアクセシビリティ確認
        const interactiveElements = page.locator('button, a, input, select, textarea');
        if (await interactiveElements.count() > 0) {
          const firstInteractive = interactiveElements.first();
          
          // 要素が表示されている
          await expect(firstInteractive).toBeVisible();
          
          // 要素が十分なサイズを持っている（モバイルの場合）
          if (viewport.width <= 768) {
            const elementBox = await firstInteractive.boundingBox();
            if (elementBox) {
              expect(Math.min(elementBox.width, elementBox.height)).toBeGreaterThan(30);
            }
          }
          
          // フォーカス可能である
          if (await firstInteractive.isEnabled()) {
            await firstInteractive.focus();
            // フォーカス状態を視覚的に確認
            const isFocused = await firstInteractive.evaluate(el => document.activeElement === el);
            expect(isFocused).toBeTruthy();
          }
        }
      }
    }
  });

  test('should handle images and media responsively', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      const viewportsToTest = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1366, height: 768 }
      ];
      
      for (const viewport of viewportsToTest) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // 画像要素の確認
        const images = page.locator('img');
        if (await images.count() > 0) {
          const firstImage = images.first();
          await expect(firstImage).toBeVisible();
          
          const imageBox = await firstImage.boundingBox();
          if (imageBox) {
            // 画像がビューポートを超えないことを確認
            expect(imageBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
        
        // 動画要素の確認
        const videos = page.locator('video');
        if (await videos.count() > 0) {
          const firstVideo = videos.first();
          await expect(firstVideo).toBeVisible();
          
          const videoBox = await firstVideo.boundingBox();
          if (videoBox) {
            expect(videoBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    }
  });

  test('should maintain navigation usability across viewports', async ({ page }) => {
    const navigationTestViewports = [
      { width: 375, height: 667, type: 'mobile' },
      { width: 768, height: 1024, type: 'tablet' },
      { width: 1024, height: 768, type: 'desktop' }
    ];
    
    for (const viewport of navigationTestViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/auth')) {
        if (viewport.type === 'mobile') {
          // モバイルナビゲーションテスト
          const mobileNavToggle = page.locator('.hamburger, .mobile-nav-toggle, button[aria-label*="menu"]').first();
          if (await mobileNavToggle.count() > 0) {
            await mobileNavToggle.click();
            await page.waitForTimeout(500);
            
            // ナビゲーションメニューが表示される
            const mobileMenu = page.locator('.mobile-menu, .nav-menu.open, .mobile-nav.active');
            if (await mobileMenu.count() > 0) {
              await expect(mobileMenu.first()).toBeVisible();
            }
          }
        } else {
          // デスクトップナビゲーションテスト
          const desktopNav = page.locator('nav:not(.mobile-nav), .desktop-nav').first();
          if (await desktopNav.count() > 0) {
            await expect(desktopNav).toBeVisible();
            
            // ナビゲーションリンクが表示される
            const navLinks = desktopNav.locator('a');
            if (await navLinks.count() > 0) {
              await expect(navLinks.first()).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should handle form layouts responsively', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      const formTestViewports = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1366, height: 768 }
      ];
      
      for (const viewport of formTestViewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // フォーム要素の確認
        const formElements = page.locator('form, input, textarea, select, button[type="submit"]');
        if (await formElements.count() > 0) {
          const firstForm = formElements.first();
          await expect(firstForm).toBeVisible();
          
          const formBox = await firstForm.boundingBox();
          if (formBox) {
            // フォームがビューポート内に収まることを確認
            expect(formBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
        
        // 入力フィールドの適切なサイズ確認
        const inputs = page.locator('input[type="text"], input[type="email"], textarea');
        if (await inputs.count() > 0) {
          const firstInput = inputs.first();
          const inputBox = await firstInput.boundingBox();
          if (inputBox) {
            // モバイルでは十分なタップ領域を確保
            if (viewport.width <= 768) {
              expect(inputBox.height).toBeGreaterThan(40);
            }
          }
        }
      }
    }
  });
});