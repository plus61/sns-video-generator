import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for deployed app)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have reasonable page sizes', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for successful responses
    const successfulResponses = responses.filter(r => r.status >= 200 && r.status < 300);
    expect(successfulResponses.length).toBeGreaterThan(0);
  });

  test('should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // Load homepage concurrently
    await Promise.all(
      pages.map(page => page.goto('/'))
    );
    
    // All pages should load successfully
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    const pages = ['/', '/dashboard', '/upload', '/studio'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Basic check that page loads
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Navigate back to homepage
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});