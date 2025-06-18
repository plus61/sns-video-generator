// Test environment detection
const fs = require('fs');

// Set test environments
const testCases = [
  { VERCEL: '1', name: 'Vercel' },
  { RAILWAY_ENVIRONMENT: 'production', name: 'Railway' },
  { NODE_ENV: 'development', name: 'Development' }
];

testCases.forEach(testCase => {
  // Clear environment
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.RAILWAY_ENVIRONMENT;
  
  // Set test environment
  Object.assign(process.env, testCase);
  
  console.log(`\n=== Testing ${testCase.name} Environment ===`);
  
  // Dynamic import compatibility layer
  import('./src/lib/compatibility-layer.js').then(({ 
    detectEnvironment, 
    getEnvironmentConfig, 
    validateEnvironment,
    getFeatureFlags,
    getApiEndpoints
  }) => {
    console.log('Environment detected:', detectEnvironment());
    console.log('Configuration:', JSON.stringify(getEnvironmentConfig(), null, 2));
    console.log('Feature flags:', JSON.stringify(getFeatureFlags(), null, 2));
    console.log('API endpoints:', JSON.stringify(getApiEndpoints(), null, 2));
    console.log('Validation:', JSON.stringify(validateEnvironment(), null, 2));
  }).catch(error => {
    console.error('Import error:', error.message);
  });
});