import { chromium, FullConfig } from '@playwright/test';

/**
 * Production environment setup
 * Verifies production deployment and prepares for production testing
 */
async function productionSetup(config: FullConfig) {
  console.log('🌐 Starting production environment test setup...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://sns-video-generator.vercel.app';
    console.log(`🔍 Verifying production deployment at ${baseURL}...`);
    
    // Check if production site is accessible
    const response = await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 90000 // 90 seconds for production
    });
    
    if (!response?.ok()) {
      throw new Error(`Production site returned ${response?.status()}: ${response?.statusText()}`);
    }
    
    console.log('✅ Production site is accessible');
    
    // Verify critical production features
    await page.waitForSelector('header', { timeout: 30000 });
    await page.waitForSelector('main', { timeout: 30000 });
    
    // Check for production-specific elements
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Verify HTTPS
    const url = page.url();
    if (!url.startsWith('https://')) {
      console.warn('⚠️  Production site is not using HTTPS');
    } else {
      console.log('🔒 HTTPS verified');
    }
    
    // Check performance basics
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    console.log(`⚡ Page load time: ${loadTime}ms`);
    
    if (loadTime > 5000) {
      console.warn('⚠️  Page load time is slower than expected (>5s)');
    }
    
    console.log('🎯 Production setup completed successfully');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default productionSetup;