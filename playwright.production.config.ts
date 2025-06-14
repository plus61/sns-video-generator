import { defineConfig, devices } from '@playwright/test';

/**
 * Production environment Playwright configuration
 * Optimized for stability and comprehensive testing against deployed application
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Output directories for production testing */
  outputDir: './test-results-production',
  
  /* Run tests sequentially in production for stability */
  fullyParallel: false,
  
  /* Fail the build if test.only is found */
  forbidOnly: true,
  
  /* Retry failed tests more aggressively in production */
  retries: process.env.CI ? 3 : 2,
  
  /* Use single worker in production for stability */
  workers: 1,
  
  /* Production-focused reporters */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report-production',
      open: 'never'
    }],
    ['json', { outputFile: 'test-results-production/production-results.json' }],
    ['junit', { outputFile: 'test-results-production/production-junit.xml' }],
    ['github'], // For GitHub Actions integration
  ],
  
  /* Extended timeouts for production environment */
  timeout: 90 * 1000, // 90 seconds per test (slower production environment)
  expect: {
    timeout: 30 * 1000, // 30 seconds for assertions (network latency)
  },
  
  /* Shared settings optimized for production testing */
  use: {
    /* Production URL - should be set via environment variable */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://sns-video-generator.vercel.app',
    
    /* Browser context options for production */
    viewport: { width: 1280, height: 720 },
    
    /* Comprehensive tracing for production issues */
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    /* Extended timeouts for production environment */
    actionTimeout: 30 * 1000, // 30 seconds for actions
    navigationTimeout: 60 * 1000, // 60 seconds for navigation
    
    /* Production environment settings */
    ignoreHTTPSErrors: false, // Enforce HTTPS in production
    
    /* Accept downloads for file testing */
    acceptDownloads: true,
    
    /* Enable JavaScript */
    javaScriptEnabled: true,
    
    /* User agent for production testing */
    userAgent: 'Playwright-Production-Testing/1.0',
    
    /* Production context options */
    bypassCSP: false, // Don't bypass CSP in production
    colorScheme: 'light',
    
    /* Additional headers for production testing */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
    },
  },

  /* Production testing projects - focus on critical paths */
  projects: [
    /* Setup project for production */
    {
      name: 'production-setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'production-cleanup',
    },
    
    {
      name: 'production-cleanup',
      testMatch: /.*\.cleanup\.ts/,
    },

    /* Critical desktop browsers only in production */
    {
      name: 'chromium-production',
      use: { 
        ...devices['Desktop Chrome'],
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/homepage.spec.ts',
        '**/authentication.spec.ts',
        '**/upload.spec.ts',
        '**/studio.spec.ts',
        '**/dashboard.spec.ts',
      ],
    },
    
    {
      name: 'firefox-production',
      use: { 
        ...devices['Desktop Firefox'],
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/homepage.spec.ts',
        '**/authentication.spec.ts',
        '**/upload.spec.ts',
      ],
    },
    
    {
      name: 'webkit-production',
      use: { 
        ...devices['Desktop Safari'],
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/homepage.spec.ts',
        '**/authentication.spec.ts',
      ],
    },

    /* Mobile testing for critical user flows */
    {
      name: 'mobile-chrome-production',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/homepage.spec.ts',
        '**/responsive-design.spec.ts',
      ],
    },
    
    {
      name: 'mobile-safari-production',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/homepage.spec.ts',
        '**/responsive-design.spec.ts',
      ],
    },

    /* Performance testing project */
    {
      name: 'performance-production',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/performance.spec.ts',
      ],
    },

    /* Accessibility testing */
    {
      name: 'accessibility-production',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['production-setup'],
      testMatch: [
        '**/accessibility.spec.ts',
      ],
    },
  ],

  /* Production environment doesn't need webServer (testing deployed app) */
  
  /* Test matching patterns - exclude development-only tests */
  testIgnore: [
    '**/test-environment-check.spec.ts', // Not needed in production
    '**/local-*.spec.ts', // Development-only tests
    '**/mock-*.spec.ts', // Skip mock tests in production
  ],
  
  /* Global setup for production testing */
  globalSetup: require.resolve('./tests/production.setup.ts'),
  globalTeardown: require.resolve('./tests/production.teardown.ts'),
  
  /* Additional production-specific configurations */
  metadata: {
    environment: 'production',
    url: process.env.PLAYWRIGHT_BASE_URL || 'https://sns-video-generator.vercel.app',
    testingMode: 'e2e-production',
  },
});