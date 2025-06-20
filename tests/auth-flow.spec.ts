import { test, expect } from '@playwright/test';

const SITE_URL = 'https://sns-video-generator-production.up.railway.app';

test.describe('Authentication Flow Tests', () => {
  test('認証画面へのアクセスと表示確認', async ({ page }) => {
    await page.goto(`${SITE_URL}/auth/signin`);
    
    // 認証ページのタイトル確認
    await expect(page).toHaveTitle(/Sign In/);
    
    // 認証フォームの存在確認
    await expect(page.locator('form')).toBeVisible();
    
    // サインインボタンの確認
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();
  });

  test('保護されたページへのリダイレクト', async ({ page }) => {
    // 未認証でダッシュボードにアクセス
    await page.goto(`${SITE_URL}/dashboard`);
    
    // 認証ページへリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('認証プロバイダーの表示', async ({ page }) => {
    await page.goto(`${SITE_URL}/auth/signin`);
    
    // Google認証ボタンの確認（設定されている場合）
    const googleButton = page.locator('button:has-text("Google")');
    const providersExist = await googleButton.count() > 0;
    
    if (providersExist) {
      await expect(googleButton).toBeVisible();
    }
  });

  test('エラーページの処理', async ({ page }) => {
    // 認証エラーページへ直接アクセス
    await page.goto(`${SITE_URL}/auth/error`);
    
    // エラーメッセージまたはリダイレクトを確認
    const hasErrorMessage = await page.locator('text=/error|エラー/i').count() > 0;
    const isRedirected = page.url().includes('/auth/signin');
    
    expect(hasErrorMessage || isRedirected).toBeTruthy();
  });

  test('認証後のリダイレクト先確認', async ({ page, context }) => {
    // 認証済みクッキーのシミュレーション（実際の認証はできないため）
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'dummy-session-token',
      domain: new URL(SITE_URL).hostname,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }]);
    
    // ホームページにアクセス
    await page.goto(SITE_URL);
    
    // アプリケーションが正常に表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
  });

  test('ログアウトリンクの存在確認', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // ナビゲーションメニューを探す
    const nav = page.locator('nav');
    
    if (await nav.isVisible()) {
      // サインイン/ログアウトリンクの存在を確認
      const authLinks = await page.locator('a[href*="auth"], button:has-text(/sign|log/i)').count();
      expect(authLinks).toBeGreaterThan(0);
    }
  });
});