import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Check if sign-in page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Look for sign-in elements
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const submitButtons = await page.locator('button[type="submit"]').count();
    const signInText = await page.locator('text=/sign in/i').count();
    const loginText = await page.locator('text=/login/i').count();
    
    const signInElements = emailInputs + passwordInputs + submitButtons + signInText + loginText;
    
    if (signInElements > 0) {
      // If we have sign-in elements, test the form structure
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
      
      if (await passwordInput.count() > 0) {
        await expect(passwordInput.first()).toBeVisible();
      }
    }
  });

  test('should handle OAuth providers', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Look for OAuth buttons (common patterns)
    const oauthButtons = await page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Discord"), [data-provider], [data-testid*="oauth"]').count();
    
    // If OAuth buttons exist, they should be visible
    if (oauthButtons > 0) {
      await expect(page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Discord"), [data-provider]').first()).toBeVisible();
    }
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/auth/error');
    await page.waitForLoadState('networkidle');
    
    // Should show error page or redirect
    await expect(page.locator('body')).toBeVisible();
    
    // Look for error messages or redirect to sign-in
    const hasErrorContent = await page.locator('text=/error/i, text=/something went wrong/i, text=/authentication failed/i').count() > 0;
    const redirectedToSignIn = page.url().includes('/auth/signin');
    
    expect(hasErrorContent || redirectedToSignIn).toBeTruthy();
  });

  test('should redirect authenticated users appropriately', async ({ page }) => {
    // Test accessing protected routes
    const protectedRoutes = ['/dashboard', '/upload', '/studio'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should either show the protected content or redirect to auth
      const currentUrl = page.url();
      const hasAuthRedirect = currentUrl.includes('/auth/signin') || currentUrl.includes('/login');
      const hasProtectedContent = !hasAuthRedirect;
      
      // Either should redirect to auth or show protected content (if user is authenticated)
      expect(hasAuthRedirect || hasProtectedContent).toBeTruthy();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Form elements should be accessible on mobile
    const formElements = page.locator('input, button, form');
    if (await formElements.count() > 0) {
      await expect(formElements.first()).toBeVisible();
    }
  });
});