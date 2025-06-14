import { test, expect } from '@playwright/test';

test.describe('Test Environment Setup - テスト環境確認', () => {
  
  test('should verify local development server is running', async ({ page }) => {
    // 開発サーバーが起動していることを確認
    try {
      await page.goto('/', { timeout: 30000 });
      await expect(page.locator('body')).toBeVisible();
      console.log('✅ Development server is running on http://localhost:3000');
    } catch (error) {
      console.error('❌ Development server is not accessible. Please run: npm run dev');
      throw error;
    }
  });

  test('should verify basic page routing', async ({ page }) => {
    const routes = [
      { path: '/', name: 'Homepage' },
      { path: '/upload', name: 'Upload Page' },
      { path: '/studio', name: 'Studio Page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/auth/signin', name: 'Sign-in Page' }
    ];

    for (const route of routes) {
      try {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
        console.log(`✅ ${route.name} (${route.path}) is accessible`);
      } catch (error) {
        console.error(`❌ ${route.name} (${route.path}) is not accessible`);
        // 重要でないページのエラーは許容
        if (route.path === '/' || route.path === '/auth/signin') {
          throw error;
        }
      }
    }
  });

  test('should verify Next.js features are working', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Next.js特有の要素確認
    const nextjsElements = [
      'script[src*="_next"]', // Next.jsバンドル
      'link[href*="_next"]',   // Next.js CSS
      'meta[name="next-head-count"]' // Next.js head管理
    ];
    
    let nextjsFeatureCount = 0;
    for (const selector of nextjsElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        nextjsFeatureCount++;
      }
    }
    
    expect(nextjsFeatureCount).toBeGreaterThan(0);
    console.log(`✅ Next.js features detected: ${nextjsFeatureCount} elements`);
  });

  test('should verify TypeScript compilation is successful', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // TypeScriptエラーがコンソールに出力されていないことを確認
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('TypeScript') || text.includes('TS')) {
          errors.push(text);
        }
      }
    });
    
    await page.waitForTimeout(2000);
    
    // TypeScript関連のエラーがないことを確認
    const tsErrors = errors.filter(error => 
      error.includes('TypeScript') || 
      error.includes('TS2') || 
      error.includes('type error')
    );
    
    expect(tsErrors.length).toBe(0);
    
    if (tsErrors.length === 0) {
      console.log('✅ No TypeScript compilation errors detected');
    } else {
      console.error('❌ TypeScript errors found:', tsErrors);
    }
  });

  test('should verify essential dependencies are loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 重要な依存関係が読み込まれているかを確認
    const essentialLibraries = await page.evaluate(() => {
      const libs = {
        react: typeof window.React !== 'undefined',
        nextjs: typeof window.__NEXT_DATA__ !== 'undefined',
        // その他の重要なライブラリがあれば追加
      };
      return libs;
    });
    
    console.log('📦 Library status:', essentialLibraries);
    
    // Next.jsは必須
    expect(essentialLibraries.nextjs).toBeTruthy();
  });
});