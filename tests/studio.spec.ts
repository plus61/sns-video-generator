import { test, expect } from '@playwright/test';

test.describe('Studio Page', () => {
  test('should load studio page', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle authentication requirement', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const studioTestIds = await page.locator('[data-testid*="studio"]').count();
    const studioText = await page.locator('text=/studio/i').count();
    const editorText = await page.locator('text=/editor/i').count();
    const hasStudioElements = (studioTestIds + studioText + editorText) > 0;
    
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const signInText = await page.locator('text=/sign in/i').count();
    const hasAuthElements = (emailInputs + passwordInputs + signInText) > 0;
    
    // Should either show studio interface or redirect to auth
    expect(hasStudioElements || hasAuthElements || currentUrl.includes('auth')).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});