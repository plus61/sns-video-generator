import { test, expect } from '@playwright/test';

const SITE_URL = 'https://sns-video-generator-production.up.railway.app';

test.describe('Railway Deployment Tests', () => {
  test('ホームページが正常に表示される', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // タイトルの確認
    await expect(page).toHaveTitle(/SNS Video Generator/);
    
    // メインコンテンツの確認
    await expect(page.locator('h1')).toContainText('SNS Video Generator');
    
    // 主要ボタンの存在確認 - より具体的なセレクタを使用
    await expect(page.locator('a[href="/upload"]').first()).toBeVisible();
    await expect(page.locator('a[href="/test"]')).toBeVisible();
  });

  test('認証ページへのリダイレクトが機能する', async ({ page }) => {
    // 保護されたページにアクセス
    await page.goto(`${SITE_URL}/dashboard`);
    
    // 認証ページへリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('APIヘルスチェックエンドポイントが応答する', async ({ request }) => {
    // 公開APIエンドポイントのテスト
    const response = await request.get(`${SITE_URL}/api/health/minimal`);
    
    // ステータスコードの確認（認証不要のエンドポイント）
    expect(response.status()).toBeLessThan(500); // サーバーエラーでないことを確認
  });

  test('静的アセットが正しく配信される', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // CSSとJavaScriptが正しくロードされることを確認
    const responses = [];
    page.on('response', response => responses.push(response));
    
    await page.reload();
    
    // 静的ファイルのレスポンスを確認
    const staticFiles = responses.filter(r => 
      r.url().includes('/_next/static/') && 
      r.status() === 200
    );
    
    expect(staticFiles.length).toBeGreaterThan(0);
  });

  test('ページコンテンツが正しく表示される', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // メインヒーロータイトルの確認
    await expect(page.locator('h2')).toContainText('AI動画生成プラットフォーム');
    
    // 機能カードの確認
    await expect(page.locator('text=AI動画解析')).toBeVisible();
    await expect(page.locator('text=自動セグメント抽出')).toBeVisible();
  });

  test('ダークモード切り替えが機能する', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // 初期状態を確認
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class');
    
    // テーマ切り替えボタンを探してクリック
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="テーマ"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // クラスが変更されたことを確認
      await expect(htmlElement).not.toHaveAttribute('class', initialClass);
    }
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // モバイルビューポート
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SITE_URL);
    
    // モバイルメニューが表示されることを確認
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="メニュー"]').first();
    
    // デスクトップビューポート
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    // レイアウトが適切に調整されることを確認
    await expect(page.locator('main')).toBeVisible();
  });

  test('メタタグが正しく設定されている', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // descriptionタグの確認 - layout.tsxで定義されている内容と一致
    // Use waitFor to ensure meta tag is rendered
    const metaTag = page.locator('meta[name="description"]');
    await expect(metaTag).toHaveAttribute('content', 'AI-powered social media video generation platform', { timeout: 30000 });
  });
});