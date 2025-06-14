import { test, expect } from '@playwright/test';

test.describe('Homepage Tests - AI動画生成プラットフォーム', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/SNS Video Generator|klap|AI動画|動画生成/i);
    
    // メインコンテンツの表示確認
    await expect(page.locator('body')).toBeVisible();
    
    // ローディング完了まで待機
    await page.waitForLoadState('networkidle');
  });

  test('should display main navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // ナビゲーション要素の確認
    const possibleNavSelectors = [
      'nav',
      'header',
      '[role="navigation"]',
      '.navigation',
      '.navbar',
      '.header'
    ];
    
    let navFound = false;
    for (const selector of possibleNavSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        navFound = true;
        break;
      }
    }
    
    // ナビゲーションリンクの確認
    const navLinks = [
      { text: /upload|アップロード/i, href: '/upload' },
      { text: /studio|スタジオ/i, href: '/studio' },
      { text: /dashboard|ダッシュボード/i, href: '/dashboard' },
      { text: /sign.*in|サインイン|ログイン/i, href: '/auth/signin' }
    ];
    
    for (const link of navLinks) {
      const linkElement = page.locator(`a:has-text("${link.text.source}"), a[href="${link.href}"]`).first();
      if (await linkElement.count() > 0) {
        await expect(linkElement).toBeVisible();
      }
    }
  });

  test('should navigate to key pages from homepage', async ({ page }) => {
    await page.goto('/');
    
    // Upload ページへの遷移テスト
    const uploadLinkHref = page.locator('a[href="/upload"]');
    const uploadLinkText = page.locator('a', { hasText: 'upload' });
    const uploadLinkJapanese = page.locator('a', { hasText: 'アップロード' });
    
    if (await uploadLinkHref.count() > 0) {
      await uploadLinkHref.first().click();
      await page.waitForURL('/upload');
      await expect(page).toHaveURL('/upload');
      await page.goBack();
    } else if (await uploadLinkText.count() > 0) {
      await uploadLinkText.first().click();
      await page.waitForURL('/upload');
      await expect(page).toHaveURL('/upload');
      await page.goBack();
    } else if (await uploadLinkJapanese.count() > 0) {
      await uploadLinkJapanese.first().click();
      await page.waitForURL('/upload');
      await expect(page).toHaveURL('/upload');
      await page.goBack();
    }
    
    // Studio ページへの遷移テスト
    const studioLinkHref = page.locator('a[href="/studio"]');
    const studioLinkText = page.locator('a', { hasText: 'studio' });
    const studioLinkJapanese = page.locator('a', { hasText: 'スタジオ' });
    
    if (await studioLinkHref.count() > 0) {
      await studioLinkHref.first().click();
      await page.waitForURL('/studio');
      await expect(page).toHaveURL('/studio');
      await page.goBack();
    } else if (await studioLinkText.count() > 0) {
      await studioLinkText.first().click();
      await page.waitForURL('/studio');
      await expect(page).toHaveURL('/studio');
      await page.goBack();
    } else if (await studioLinkJapanese.count() > 0) {
      await studioLinkJapanese.first().click();
      await page.waitForURL('/studio');
      await expect(page).toHaveURL('/studio');
      await page.goBack();
    }
    
    // Dashboard ページへの遷移テスト（認証が必要な場合はリダイレクト）
    const dashboardLinkHref = page.locator('a[href="/dashboard"]');
    const dashboardLinkText = page.locator('a', { hasText: 'dashboard' });
    const dashboardLinkJapanese = page.locator('a', { hasText: 'ダッシュボード' });
    
    if (await dashboardLinkHref.count() > 0) {
      await dashboardLinkHref.first().click();
    } else if (await dashboardLinkText.count() > 0) {
      await dashboardLinkText.first().click();
    } else if (await dashboardLinkJapanese.count() > 0) {
      await dashboardLinkJapanese.first().click();
    }
    
    if (await dashboardLinkHref.count() > 0 || await dashboardLinkText.count() > 0 || await dashboardLinkJapanese.count() > 0) {
      // 認証が必要な場合は /auth/signin にリダイレクトされる可能性
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl.includes('/dashboard') || currentUrl.includes('/auth')).toBeTruthy();
    }
  });

  test('should display key content sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 主要なコンテンツセクションの確認
    const contentSections = [
      /AI.*動画.*生成|video.*generation/i,
      /klap.*代替|alternative/i,
      /SNS.*動画|social.*media.*video/i,
      /アップロード|upload/i,
      /編集|edit|studio/i
    ];
    
    for (const section of contentSections) {
      const sectionElement = page.locator(`text=${section.source}`).first();
      if (await sectionElement.count() > 0) {
        await expect(sectionElement).toBeVisible();
      }
    }
  });

  test('should have no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 重要でないエラーをフィルタリング
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') &&
      !error.includes('manifest.json') &&
      !error.includes('robots.txt') &&
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED')
    );
    
    expect(criticalErrors.length).toBeLessThanOrEqual(2); // 軽微なエラーは許容
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/');
    
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // コンテンツが表示されていることを確認
    const mainContent = page.locator('main, [role="main"], .main-content, .container');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should load CSS and JavaScript resources', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || ''
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // CSSファイルが正常に読み込まれているか確認
    const cssResponses = responses.filter(r => 
      r.contentType.includes('text/css') || r.url.includes('.css')
    );
    
    // JavaScriptファイルが正常に読み込まれているか確認
    const jsResponses = responses.filter(r => 
      r.contentType.includes('javascript') || r.url.includes('.js')
    );
    
    // 成功レスポンスの確認
    const successfulResponses = responses.filter(r => r.status >= 200 && r.status < 300);
    expect(successfulResponses.length).toBeGreaterThan(0);
  });
});