import { FullConfig } from '@playwright/test';

/**
 * Global teardown for local development testing
 * Cleans up testing environment and performs final checks
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright E2E test teardown...');
  
  try {
    // Clean up any test data or temporary files
    console.log('🗑️  Cleaning up test artifacts...');
    
    // Clear any test databases or reset state if needed
    // Example: Clear test user sessions, reset test data
    
    // Log test completion statistics
    console.log('📊 Test run completed');
    
    // Optional: Send test results to monitoring services
    // Example: Send metrics to analytics or monitoring platforms
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;