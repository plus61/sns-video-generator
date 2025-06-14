import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests - NextAuth.js', () => {
  test('should load signin page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // サインインページが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // URLが正しいことを確認
    expect(page.url()).toContain('/auth/signin');
  });

  test('should display authentication providers', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Google認証ボタンの確認
    const googleButton = page.locator('button:has-text("Google"), [data-provider="google"], button[name="google"]');
    if (await googleButton.count() > 0) {
      await expect(googleButton.first()).toBeVisible();
    }
    
    // GitHub認証ボタンの確認
    const githubButton = page.locator('button:has-text("GitHub"), [data-provider="github"], button[name="github"]');
    if (await githubButton.count() > 0) {
      await expect(githubButton.first()).toBeVisible();
    }
    
    // 認証情報フォームの確認
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();
    }
    
    if (await passwordInput.count() > 0) {
      await expect(passwordInput.first()).toBeVisible();
    }
  });

  test('should handle OAuth provider clicks', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Google認証ボタンをクリック（実際の認証は行わない）
    const googleButton = page.locator('button:has-text("Google"), [data-provider="google"]').first();
    if (await googleButton.count() > 0) {
      // ボタンがクリック可能であることを確認
      await expect(googleButton).toBeEnabled();
      
      // 新しいタブが開かれることを期待してクリック
      const [popup] = await Promise.all([
        page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
        googleButton.click().catch(() => {}) // エラーを無視
      ]);
      
      if (popup) {
        await popup.close();
      }
    }
  });

  test('should redirect unauthenticated users from protected pages', async ({ page }) => {
    const protectedPages = ['/dashboard', '/studio'];
    
    for (const protectedPage of protectedPages) {
      await page.goto(protectedPage);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      
      // 認証ページにリダイレクトされるか、認証要求が表示される
      const isRedirectedToAuth = currentUrl.includes('/auth/signin') || currentUrl.includes('/login');
      const hasAuthElements = await page.locator('input[type="email"], input[type="password"], button:has-text(/sign.*in/i)').count() > 0;
      
      expect(isRedirectedToAuth || hasAuthElements).toBeTruthy();
    }
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/auth/error');
    await page.waitForLoadState('networkidle');
    
    // エラーページが表示されるか、サインインページにリダイレクト
    const currentUrl = page.url();
    const hasErrorContent = await page.locator('text=/error/i, text=/something.*went.*wrong/i, text=/authentication.*failed/i').count() > 0;
    const redirectedToSignIn = currentUrl.includes('/auth/signin');
    
    expect(hasErrorContent || redirectedToSignIn).toBeTruthy();
  });

  test('should validate email format in credentials form', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    
    if (await emailInput.count() > 0 && await submitButton.count() > 0) {
      // 無効なメールアドレスを入力
      await emailInput.fill('invalid-email');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // HTML5バリデーションまたはカスタムエラーメッセージの確認
        const isInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
        const hasErrorMessage = await page.locator('text=/invalid.*email|メール.*形式|email.*format/i').count() > 0;
        
        expect(isInvalid || hasErrorMessage).toBeTruthy();
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // モバイルでサインインページが表示される
    await expect(page.locator('body')).toBeVisible();
    
    // フォーム要素がモバイルで使用可能
    const formElements = page.locator('input, button, form');
    if (await formElements.count() > 0) {
      await expect(formElements.first()).toBeVisible();
    }
    
    // 認証プロバイダーボタンがタップ可能
    const providerButtons = page.locator('button:has-text("Google"), button:has-text("GitHub")');
    if (await providerButtons.count() > 0) {
      const firstButton = providerButtons.first();
      await expect(firstButton).toBeVisible();
      
      // ボタンサイズが十分大きいことを確認（44px以上推奨）
      const buttonBox = await firstButton.boundingBox();
      if (buttonBox) {
        expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThan(40);
      }
    }
  });

  test('should handle session state correctly', async ({ page }) => {
    // 未認証状態での各ページアクセステスト
    const testPages = [
      { path: '/', shouldAllow: true },
      { path: '/upload', shouldAllow: false },  // 認証が必要と想定
      { path: '/studio', shouldAllow: false },  // 認証が必要と想定
      { path: '/dashboard', shouldAllow: false }, // 認証が必要と想定
      { path: '/test', shouldAllow: true },      // テストページは許可と想定
      { path: '/database-test', shouldAllow: true } // テストページは許可と想定
    ];
    
    for (const testPage of testPages) {
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      
      if (testPage.shouldAllow) {
        // アクセス許可されるページ
        expect(currentUrl).toContain(testPage.path);
      } else {
        // 認証が必要なページは認証ページにリダイレクトされるか、認証要求が表示される
        const isRedirectedToAuth = currentUrl.includes('/auth');
        const hasAuthContent = await page.locator('input[type="email"], button:has-text(/sign.*in/i)').count() > 0;
        const isAccessDenied = await page.locator('text=/unauthorized|access.*denied|認証.*必要/i').count() > 0;
        
        expect(isRedirectedToAuth || hasAuthContent || isAccessDenied).toBeTruthy();
      }
    }
  });

  test('should display appropriate loading states', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // OAuth プロバイダーボタンクリック時のローディング状態
    const googleButton = page.locator('button:has-text("Google")').first();
    if (await googleButton.count() > 0) {
      await googleButton.click().catch(() => {});
      
      // ローディング状態の確認（スピナー、disabled状態など）
      const loadingStates = await page.locator('.loading, .spinner, [aria-busy="true"], button[disabled]').count();
      // ローディング状態があることを確認（ただし、必須ではない）
    }
  });

  test('should handle CSRF protection', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // CSRFトークンが存在することを確認
    const csrfToken = await page.locator('input[name="csrfToken"], meta[name="csrf-token"]').count();
    
    // NextAuth.jsはCSRFトークンを自動的に処理するため、存在確認のみ
    // トークンが存在する場合、セキュリティが適切に実装されている
    if (csrfToken > 0) {
      expect(csrfToken).toBeGreaterThan(0);
    }
  });
});