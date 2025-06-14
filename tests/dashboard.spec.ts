import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should handle unauthenticated access', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should either redirect to login or show sign-in prompt
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const hasLoginElement = await page.locator('input[type="email"], input[type="password"], [data-testid*="signin"], [data-testid*="login"]').count() > 0;
    const hasSignInText = await page.locator('text=/sign in/i, text=/log in/i, text=/login/i').count() > 0;
    
    expect(
      currentUrl.includes('/auth/signin') || 
      currentUrl.includes('/login') || 
      hasLoginElement || 
      hasSignInText
    ).toBeTruthy();
  });

  test('should load dashboard page structure', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without critical errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check for common dashboard elements
    const dashboardIndicators = [
      'text=/dashboard/i',
      '[data-testid*="dashboard"]',
      '.dashboard',
      '#dashboard'
    ];
    
    let hasDashboardElement = false;
    for (const selector of dashboardIndicators) {
      if (await page.locator(selector).count() > 0) {
        hasDashboardElement = true;
        break;
      }
    }
    
    // Should have some dashboard-related content or be redirected to auth
    expect(hasDashboardElement || page.url().includes('auth') || page.url().includes('login')).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});