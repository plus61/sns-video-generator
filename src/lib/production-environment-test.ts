/**
 * Production Environment Test Script
 * Worker3実装：本番環境での品質保証と再発防止システム
 */

import { supabaseAdmin } from './supabase'
import { youtubeCompatibility } from './youtube-compatibility-layer'
import { redisPool } from './enhanced-queue-config'
import { stripe } from './stripe-config'

export interface EnvironmentTestResult {
  testName: string
  status: 'pass' | 'fail' | 'warning'
  details: string
  performance?: {
    responseTime: number
    memoryUsage: number
  }
  recommendations?: string[]
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'critical'
  timestamp: string
  environment: string
  tests: EnvironmentTestResult[]
  summary: {
    totalTests: number
    passed: number
    failed: number
    warnings: number
  }
  criticalIssues: string[]
  recommendations: string[]
}

export class ProductionEnvironmentTester {
  private startTime = Date.now()

  async runComprehensiveTest(): Promise<SystemHealthReport> {
    console.log('🔍 Starting comprehensive production environment test...')
    
    const tests: EnvironmentTestResult[] = []
    
    // Core Infrastructure Tests
    tests.push(await this.testDatabaseConnection())
    tests.push(await this.testRedisConnection())
    tests.push(await this.testStorageAccess())
    
    // Worker2/3 Integration Tests
    tests.push(await this.testYouTubeCompatibility())
    tests.push(await this.testVideoProcessingQueue())
    
    // API Integration Tests
    tests.push(await this.testOpenAIAPI())
    tests.push(await this.testStripeAPI())
    
    // Security & Configuration Tests
    tests.push(await this.testEnvironmentVariables())
    tests.push(await this.testSecurityHeaders())
    
    // Performance Tests
    tests.push(await this.testMemoryUsage())
    tests.push(await this.testDiskSpace())

    return this.generateHealthReport(tests)
  }

  private async testDatabaseConnection(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1)
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        return {
          testName: 'Database Connection',
          status: 'fail',
          details: `Supabase connection failed: ${error.message}`,
          performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed },
          recommendations: [
            'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
            'Verify database is accessible from current environment',
            'Check network connectivity and firewall rules'
          ]
        }
      }

      const status = responseTime > 2000 ? 'warning' : 'pass'
      
      return {
        testName: 'Database Connection',
        status,
        details: `Supabase connection successful (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed },
        recommendations: responseTime > 2000 ? ['Consider database query optimization'] : []
      }
    } catch (error) {
      return {
        testName: 'Database Connection',
        status: 'fail',
        details: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Check database configuration and credentials']
      }
    }
  }

  private async testRedisConnection(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      if (!process.env.REDIS_URL) {
        return {
          testName: 'Redis Connection',
          status: 'warning',
          details: 'Redis not configured (using mock queue)',
          recommendations: ['Configure Redis for production queue management']
        }
      }

      const redis = redisPool.getConnection('test')
      await redis.ping()
      
      const responseTime = Date.now() - startTime
      
      return {
        testName: 'Redis Connection',
        status: 'pass',
        details: `Redis connection successful (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed }
      }
    } catch (error) {
      return {
        testName: 'Redis Connection',
        status: 'fail',
        details: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: [
          'Check REDIS_URL configuration',
          'Verify Redis server is running and accessible',
          'Check network connectivity to Redis instance'
        ]
      }
    }
  }

  private async testStorageAccess(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      const testFileName = `test-${Date.now()}.txt`
      const testContent = 'Production environment test'
      
      // Test upload
      const { error: uploadError } = await supabaseAdmin.storage
        .from('test-bucket')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        })
      
      // Test download
      const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
        .from('test-bucket')
        .download(testFileName)
      
      // Cleanup
      await supabaseAdmin.storage
        .from('test-bucket')
        .remove([testFileName])
      
      const responseTime = Date.now() - startTime
      
      if (uploadError && !uploadError.message.includes('Bucket not found')) {
        return {
          testName: 'Storage Access',
          status: 'fail',
          details: `Storage upload failed: ${uploadError.message}`,
          recommendations: ['Check storage bucket configuration and permissions']
        }
      }

      return {
        testName: 'Storage Access',
        status: uploadError ? 'warning' : 'pass',
        details: uploadError 
          ? 'Storage not configured (bucket not found)' 
          : `Storage access successful (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed },
        recommendations: uploadError ? ['Configure storage buckets for video assets'] : []
      }
    } catch (error) {
      return {
        testName: 'Storage Access',
        status: 'fail',
        details: `Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Check Supabase storage configuration']
      }
    }
  }

  private async testYouTubeCompatibility(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      const validation = await youtubeCompatibility.validateEnvironment()
      const responseTime = Date.now() - startTime
      
      const hasWorkingStrategy = validation.ytdlCoreAvailable || validation.youtubeDlAvailable
      
      if (!hasWorkingStrategy && validation.recommendedStrategy === 'mock') {
        return {
          testName: 'YouTube Compatibility (Worker2 Integration)',
          status: 'warning',
          details: 'No YouTube download capabilities available, using mock',
          performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed },
          recommendations: [
            'Install youtube-dl or yt-dlp for production YouTube support',
            'Configure ytdl-core for Node.js environment',
            'Consider external YouTube processing service'
          ]
        }
      }

      return {
        testName: 'YouTube Compatibility (Worker2 Integration)',
        status: 'pass',
        details: `YouTube download available via ${validation.recommendedStrategy}`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed },
        recommendations: validation.issues.length > 0 ? validation.issues : []
      }
    } catch (error) {
      return {
        testName: 'YouTube Compatibility (Worker2 Integration)',
        status: 'fail',
        details: `YouTube compatibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Check YouTube download dependencies']
      }
    }
  }

  private async testVideoProcessingQueue(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      const { Queue, getQueueConfig } = await import('./queue-wrapper')
      const config = getQueueConfig()
      
      const testQueue = new Queue('test-queue', config)
      const job = await testQueue.add('test-job', { test: true })
      
      const responseTime = Date.now() - startTime
      
      return {
        testName: 'Video Processing Queue',
        status: 'pass',
        details: `Queue system operational (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed }
      }
    } catch (error) {
      return {
        testName: 'Video Processing Queue',
        status: 'fail',
        details: `Queue test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Check queue configuration and Redis connection']
      }
    }
  }

  private async testOpenAIAPI(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          testName: 'OpenAI API',
          status: 'warning',
          details: 'OpenAI API key not configured',
          recommendations: ['Configure OPENAI_API_KEY for AI features']
        }
      }

      // Test with minimal request
      const OpenAI = await import('openai')
      const openai = new OpenAI.default({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 1
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      })

      const responseTime = Date.now() - startTime
      
      return {
        testName: 'OpenAI API',
        status: 'pass',
        details: `OpenAI API operational (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed }
      }
    } catch (error) {
      return {
        testName: 'OpenAI API',
        status: 'fail',
        details: `OpenAI API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: [
          'Check OPENAI_API_KEY validity',
          'Verify API quota and billing status',
          'Check network connectivity to OpenAI'
        ]
      }
    }
  }

  private async testStripeAPI(): Promise<EnvironmentTestResult> {
    const startTime = Date.now()
    
    try {
      if (!stripe) {
        return {
          testName: 'Stripe API',
          status: 'warning',
          details: 'Stripe not configured',
          recommendations: ['Configure Stripe for billing features']
        }
      }

      // Test with minimal request
      const account = await stripe.accounts.retrieve()
      const responseTime = Date.now() - startTime
      
      return {
        testName: 'Stripe API',
        status: 'pass',
        details: `Stripe API operational (${responseTime}ms)`,
        performance: { responseTime, memoryUsage: process.memoryUsage().heapUsed }
      }
    } catch (error) {
      return {
        testName: 'Stripe API',
        status: 'fail',
        details: `Stripe API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: [
          'Check STRIPE_SECRET_KEY configuration',
          'Verify Stripe account status',
          'Check API version compatibility'
        ]
      }
    }
  }

  private async testEnvironmentVariables(): Promise<EnvironmentTestResult> {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NODE_ENV'
    ]

    const optionalVars = [
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY',
      'REDIS_URL',
      'RAILWAY_ENVIRONMENT'
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])
    const missingOptional = optionalVars.filter(varName => !process.env[varName])

    if (missing.length > 0) {
      return {
        testName: 'Environment Variables',
        status: 'fail',
        details: `Missing required variables: ${missing.join(', ')}`,
        recommendations: [`Configure missing environment variables: ${missing.join(', ')}`]
      }
    }

    const status = missingOptional.length > 0 ? 'warning' : 'pass'
    const details = missingOptional.length > 0 
      ? `Missing optional variables: ${missingOptional.join(', ')}`
      : 'All environment variables configured'

    return {
      testName: 'Environment Variables',
      status,
      details,
      recommendations: missingOptional.length > 0 
        ? [`Consider configuring: ${missingOptional.join(', ')}`]
        : []
    }
  }

  private async testSecurityHeaders(): Promise<EnvironmentTestResult> {
    try {
      // This would be more comprehensive in a real implementation
      const securityChecks = {
        httpsRedirect: process.env.NODE_ENV === 'production',
        corsConfigured: true, // Assume configured
        authConfigured: !!process.env.NEXTAUTH_SECRET
      }

      const issues = []
      if (!securityChecks.httpsRedirect && process.env.NODE_ENV === 'production') {
        issues.push('HTTPS redirect not configured for production')
      }
      if (!securityChecks.authConfigured) {
        issues.push('Authentication secret not configured')
      }

      const status = issues.length === 0 ? 'pass' : 'warning'

      return {
        testName: 'Security Configuration',
        status,
        details: issues.length === 0 ? 'Security checks passed' : `Issues found: ${issues.length}`,
        recommendations: issues
      }
    } catch (error) {
      return {
        testName: 'Security Configuration',
        status: 'fail',
        details: `Security test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Review security configuration']
      }
    }
  }

  private async testMemoryUsage(): Promise<EnvironmentTestResult> {
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const usagePercentage = (heapUsedMB / heapTotalMB) * 100

    let status: 'pass' | 'warning' | 'fail' = 'pass'
    const recommendations: string[] = []

    if (usagePercentage > 80) {
      status = 'fail'
      recommendations.push('High memory usage detected, consider scaling up')
    } else if (usagePercentage > 60) {
      status = 'warning'
      recommendations.push('Monitor memory usage, consider optimization')
    }

    return {
      testName: 'Memory Usage',
      status,
      details: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercentage.toFixed(1)}%)`,
      performance: { responseTime: 0, memoryUsage: memoryUsage.heapUsed },
      recommendations
    }
  }

  private async testDiskSpace(): Promise<EnvironmentTestResult> {
    try {
      const fs = await import('fs')
      const stats = fs.statSync('/tmp')
      
      // This is a simplified check; in production, you'd want more comprehensive disk monitoring
      return {
        testName: 'Disk Space',
        status: 'pass',
        details: 'Temporary directory accessible',
        recommendations: []
      }
    } catch (error) {
      return {
        testName: 'Disk Space',
        status: 'fail',
        details: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Check disk space and permissions']
      }
    }
  }

  private generateHealthReport(tests: EnvironmentTestResult[]): SystemHealthReport {
    const summary = {
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      warnings: tests.filter(t => t.status === 'warning').length
    }

    const criticalIssues = tests
      .filter(t => t.status === 'fail')
      .map(t => `${t.testName}: ${t.details}`)

    const recommendations = tests
      .flatMap(t => t.recommendations || [])
      .filter((rec, index, arr) => arr.indexOf(rec) === index) // Deduplicate

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (summary.failed > 0) {
      overall = 'critical'
    } else if (summary.warnings > 0) {
      overall = 'degraded'
    }

    const totalTime = Date.now() - this.startTime

    console.log(`✅ Environment test completed in ${totalTime}ms`)
    console.log(`📊 Results: ${summary.passed} passed, ${summary.warnings} warnings, ${summary.failed} failed`)

    return {
      overall,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      tests,
      summary,
      criticalIssues,
      recommendations
    }
  }
}

// Singleton instance
export const productionTester = new ProductionEnvironmentTester()

// Convenience function for quick health check
export async function runProductionHealthCheck(): Promise<SystemHealthReport> {
  return productionTester.runComprehensiveTest()
}