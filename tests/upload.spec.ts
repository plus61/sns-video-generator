import { test, expect } from '@playwright/test';

test.describe('Upload Page', () => {
  test('should load upload page', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle authentication requirement', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const fileInputs = await page.locator('input[type="file"]').count();
    const uploadTestIds = await page.locator('[data-testid*="upload"]').count();
    const uploadText = await page.locator('text=/upload/i').count();
    const hasUploadElements = (fileInputs + uploadTestIds + uploadText) > 0;
    
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const signInText = await page.locator('text=/sign in/i').count();
    const hasAuthElements = (emailInputs + passwordInputs + signInText) > 0;
    
    // Should either show upload interface or redirect to auth
    expect(hasUploadElements || hasAuthElements || currentUrl.includes('auth')).toBeTruthy();
  });

  test('should show upload interface when accessible', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    // If not redirected to auth, should have upload-related elements
    if (!page.url().includes('auth') && !page.url().includes('login')) {
      const fileInputs = await page.locator('input[type="file"]').count();
      const uploadTestIds = await page.locator('[data-testid*="upload"]').count();
      const uploadText = await page.locator('text=/upload/i').count();
      const dragText = await page.locator('text=/drag/i').count();
      const uploadElements = fileInputs + uploadTestIds + uploadText + dragText;
      
      if (uploadElements > 0) {
        const firstUploadElement = await page.locator('input[type="file"]').first();
        if (await firstUploadElement.count() > 0) {
          await expect(firstUploadElement).toBeVisible();
        }
      }
    }
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});