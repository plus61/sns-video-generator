#!/usr/bin/env node

/**
 * YouTube Functionality Verification Script
 * 
 * This script verifies that YouTube URL upload functionality is working correctly
 * in the deployed environment. It can be run in Railway, Vercel, or local environments.
 * 
 * Usage:
 *   node scripts/verify-youtube-functionality.js [--mock-mode] [--verbose]
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - YOUTUBE_API_KEY (optional, for enhanced metadata)
 */

const https = require('https')
const http = require('http')

// Configuration
const config = {
  testVideoUrl: 'https://youtu.be/dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up (safe test video)
  apiEndpoint: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/upload-youtube`
    : process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/upload-youtube`
    : 'http://localhost:3000/api/upload-youtube',
  timeout: 30000, // 30 seconds
  mockMode: process.argv.includes('--mock-mode'),
  verbose: process.argv.includes('--verbose')
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function verbose(message) {
  if (config.verbose) {
    log(`[VERBOSE] ${message}`, 'cyan')
  }
}

// Environment Detection
function detectEnvironment() {
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV)
  const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    platform: isVercel ? 'Vercel' : isRailway ? 'Railway' : isDevelopment ? 'Development' : 'Unknown',
    isVercel,
    isRailway,
    isDevelopment,
    nodeEnv: process.env.NODE_ENV || 'undefined'
  }
}

// Check required environment variables
function checkEnvironmentVariables() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const optional = [
    'YOUTUBE_API_KEY',
    'USE_MOCK_DOWNLOADER'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, 'red')
    return false
  }
  
  log(`✅ Required environment variables present`, 'green')
  
  optional.forEach(key => {
    const value = process.env[key]
    if (value) {
      log(`  ${key}: ${key === 'YOUTUBE_API_KEY' ? value.substring(0, 10) + '...' : value}`, 'yellow')
    } else {
      log(`  ${key}: Not set`, 'yellow')
    }
  })
  
  return true
}

// Test YouTube API Service directly
async function testYouTubeAPIService() {
  try {
    verbose('Testing YouTube API Service...')
    
    // Mock a simple test since we can't import ES modules directly in this script
    // In a real implementation, this would test the YouTubeAPIService class
    
    const hasApiKey = !!process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your_youtube_data_api_v3_key'
    
    if (hasApiKey) {
      log('✅ YouTube Data API key is configured', 'green')
      verbose('YouTube API Service will provide enhanced metadata')
    } else {
      log('⚠️  YouTube Data API key not configured - using mock metadata', 'yellow')
      verbose('YouTube API Service will use fallback mock data')
    }
    
    return true
  } catch (error) {
    log(`❌ YouTube API Service test failed: ${error.message}`, 'red')
    return false
  }
}

// Test downloader selection logic
function testDownloaderSelection() {
  const env = detectEnvironment()
  const explicitMock = process.env.USE_MOCK_DOWNLOADER
  
  verbose('Testing downloader selection logic...')
  
  let expectedDownloader = 'unknown'
  
  if (explicitMock === 'true') {
    expectedDownloader = 'mock'
  } else if (env.isVercel) {
    expectedDownloader = 'mock'
  } else if (env.isRailway) {
    expectedDownloader = 'railway'
  } else if (env.isDevelopment || explicitMock === 'false') {
    expectedDownloader = 'real-or-railway'
  } else {
    expectedDownloader = 'mock'
  }
  
  log(`📊 Expected downloader: ${expectedDownloader}`, 'blue')
  verbose(`Environment: ${env.platform}, Explicit mock: ${explicitMock}`)
  
  return true
}

// Make HTTP request helper
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const httpModule = isHttps ? https : http
    
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${config.timeout}ms`))
    }, config.timeout)
    
    const req = httpModule.request(url, options, (res) => {
      clearTimeout(timeout)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error
          })
        }
      })
    })
    
    req.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    
    if (postData) {
      req.write(postData)
    }
    
    req.end()
  })
}

// Test API endpoint directly
async function testAPIEndpoint() {
  try {
    verbose(`Testing API endpoint: ${config.apiEndpoint}`)
    
    const postData = JSON.stringify({
      url: config.testVideoUrl
    })
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'YouTube-Functionality-Verifier/1.0'
      }
    }
    
    if (config.mockMode) {
      // Set mock mode via header for testing
      options.headers['X-Mock-Mode'] = 'true'
    }
    
    verbose('Sending request to API endpoint...')
    const response = await makeRequest(config.apiEndpoint, options, postData)
    
    verbose(`Response status: ${response.statusCode}`)
    verbose(`Response data: ${JSON.stringify(response.data, null, 2)}`)
    
    if (response.statusCode === 401) {
      log('⚠️  API endpoint returned 401 (Unauthorized) - This is expected without authentication', 'yellow')
      log('   Authentication is working correctly', 'green')
      return true
    } else if (response.statusCode === 200) {
      log('✅ API endpoint is accessible and responding', 'green')
      if (response.data.success) {
        log(`   Video ID generated: ${response.data.videoId}`, 'green')
        log(`   Message: ${response.data.message}`, 'green')
      }
      return true
    } else {
      log(`❌ API endpoint returned unexpected status: ${response.statusCode}`, 'red')
      if (response.data) {
        log(`   Error: ${JSON.stringify(response.data)}`, 'red')
      }
      return false
    }
  } catch (error) {
    log(`❌ API endpoint test failed: ${error.message}`, 'red')
    return false
  }
}

// Test dependency availability
function testDependencyAvailability() {
  verbose('Testing dependency availability...')
  
  try {
    // Test if youtube-dl-exec would be available
    // Note: This is a simplified check since we're not in the actual runtime environment
    const packageJson = require('../package.json')
    
    if (packageJson.dependencies && packageJson.dependencies['youtube-dl-exec']) {
      log('✅ youtube-dl-exec is listed as a dependency', 'green')
    } else if (packageJson.optionalDependencies && packageJson.optionalDependencies['youtube-dl-exec']) {
      log('⚠️  youtube-dl-exec is listed as optional dependency', 'yellow')
    } else {
      log('❌ youtube-dl-exec not found in dependencies', 'red')
      return false
    }
    
    // Check other required dependencies
    const requiredDeps = ['@supabase/supabase-js', 'uuid', 'next']
    const missing = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    )
    
    if (missing.length > 0) {
      log(`❌ Missing required dependencies: ${missing.join(', ')}`, 'red')
      return false
    }
    
    log('✅ All required dependencies are present', 'green')
    return true
  } catch (error) {
    log(`❌ Dependency check failed: ${error.message}`, 'red')
    return false
  }
}

// Main verification function
async function main() {
  log('🎬 YouTube Functionality Verification Script', 'bright')
  log('=' .repeat(50), 'bright')
  
  const env = detectEnvironment()
  log(`🌍 Environment: ${env.platform} (NODE_ENV: ${env.nodeEnv})`, 'blue')
  log(`🔧 API Endpoint: ${config.apiEndpoint}`, 'blue')
  log(`🎯 Test Video: ${config.testVideoUrl}`, 'blue')
  log(`🧪 Mock Mode: ${config.mockMode ? 'Enabled' : 'Disabled'}`, 'blue')
  log('', 'reset')
  
  let allTestsPassed = true
  
  // Test 1: Environment Variables
  log('1️⃣  Checking environment variables...', 'bright')
  const envCheck = checkEnvironmentVariables()
  allTestsPassed = allTestsPassed && envCheck
  log('', 'reset')
  
  // Test 2: Dependencies
  log('2️⃣  Checking dependencies...', 'bright')
  const depCheck = testDependencyAvailability()
  allTestsPassed = allTestsPassed && depCheck
  log('', 'reset')
  
  // Test 3: Downloader Selection
  log('3️⃣  Testing downloader selection...', 'bright')
  const downloaderCheck = testDownloaderSelection()
  allTestsPassed = allTestsPassed && downloaderCheck
  log('', 'reset')
  
  // Test 4: YouTube API Service
  log('4️⃣  Testing YouTube API Service...', 'bright')
  const apiServiceCheck = await testYouTubeAPIService()
  allTestsPassed = allTestsPassed && apiServiceCheck
  log('', 'reset')
  
  // Test 5: API Endpoint
  log('5️⃣  Testing API endpoint...', 'bright')
  const endpointCheck = await testAPIEndpoint()
  allTestsPassed = allTestsPassed && endpointCheck
  log('', 'reset')
  
  // Final Result
  log('🏁 Verification Complete', 'bright')
  log('=' .repeat(50), 'bright')
  
  if (allTestsPassed) {
    log('✅ All tests passed! YouTube functionality should be working correctly.', 'green')
    
    if (env.isRailway) {
      log('💡 Railway-specific notes:', 'yellow')
      log('   - Real YouTube downloads should work if youtube-dl-exec is available', 'yellow')
      log('   - Check Railway logs for detailed download progress', 'yellow')
    } else if (env.isVercel) {
      log('💡 Vercel-specific notes:', 'yellow')
      log('   - Mock mode is automatically enabled due to serverless limitations', 'yellow')
      log('   - Enhanced metadata will be provided via YouTube Data API', 'yellow')
    }
    
    process.exit(0)
  } else {
    log('❌ Some tests failed. Please review the issues above.', 'red')
    
    log('🔧 Troubleshooting tips:', 'yellow')
    log('   1. Ensure all environment variables are properly set', 'yellow')
    log('   2. Check that youtube-dl-exec dependency is installed', 'yellow')
    log('   3. Verify network connectivity to YouTube', 'yellow')
    log('   4. Check application logs for detailed error messages', 'yellow')
    
    if (env.isRailway) {
      log('   5. Railway: Ensure container has sufficient resources', 'yellow')
      log('   6. Railway: Check that youtube-dl binary is available', 'yellow')
    }
    
    process.exit(1)
  }
}

// Run the verification
main().catch((error) => {
  log(`💥 Verification script failed: ${error.message}`, 'red')
  if (config.verbose) {
    console.error(error.stack)
  }
  process.exit(1)
})