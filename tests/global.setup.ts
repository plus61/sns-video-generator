import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for local development testing
 * Prepares the testing environment and performs initial checks
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright E2E test setup...');
  
  // Launch browser for initial setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for development server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 Checking if server is ready at ${baseURL}...`);
    
    // Check if server responds
    await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 60000 // 1 minute timeout for server startup
    });
    
    console.log('✅ Development server is ready');
    
    // Perform any global authentication setup if needed
    // Example: Login as test user and store auth state
    
    // Check if critical resources are available
    const criticalElements = [
      'header', // Navigation header
      'main',   // Main content area
    ];
    
    for (const selector of criticalElements) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`✅ Critical element found: ${selector}`);
      } else {
        console.warn(`⚠️  Critical element not found: ${selector}`);
      }
    }
    
    console.log('🎯 Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;