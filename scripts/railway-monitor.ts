#!/usr/bin/env tsx
/**
 * Railway固有監視システム
 * Worker3実装：Railway環境の継続的健全性監視と早期警告
 */

import { ProductionMonitor } from './production-monitor'
import fs from 'fs'
import path from 'path'

interface RailwayHealthMetrics {
  deploymentHealth: {
    standaloneBuiltCorrectly: boolean
    staticFilesCopied: boolean
    publicFilesCopied: boolean
    serverJsExists: boolean
  }
  runtimeHealth: {
    portConfigured: boolean
    environmentDetected: boolean
    publicDomainSet: boolean
    memoryUsage: number
    diskUsage?: number
  }
  applicationHealth: {
    serverResponding: boolean
    staticAssetsServing: boolean
    apiEndpointsWorking: boolean
    databaseConnected: boolean
  }
}

export class RailwayMonitor extends ProductionMonitor {
  private railwayMetrics: RailwayHealthMetrics = {
    deploymentHealth: {
      standaloneBuiltCorrectly: false,
      staticFilesCopied: false,
      publicFilesCopied: false,
      serverJsExists: false
    },
    runtimeHealth: {
      portConfigured: false,
      environmentDetected: false,
      publicDomainSet: false,
      memoryUsage: 0
    },
    applicationHealth: {
      serverResponding: false,
      staticAssetsServing: false,
      apiEndpointsWorking: false,
      databaseConnected: false
    }
  }

  async start(): Promise<void> {
    console.log('🚂 Starting Railway-specific monitoring...')
    
    // Check if we're actually running on Railway
    if (!this.isRailwayEnvironment()) {
      console.log('⚠️ Not running on Railway, using standard monitoring')
      return super.start()
    }

    console.log('✅ Railway environment detected, starting enhanced monitoring')
    
    // Perform initial Railway-specific checks
    await this.performRailwayHealthCheck()
    
    // Start standard monitoring with Railway enhancements
    await super.start()
    
    console.log('🚂 Railway monitoring system fully operational')
  }

  private isRailwayEnvironment(): boolean {
    return !!(process.env.RAILWAY_ENVIRONMENT || 
              process.env.RAILWAY_PROJECT_ID || 
              process.env.RAILWAY_SERVICE_ID)
  }

  private async performRailwayHealthCheck(): Promise<void> {
    console.log('🔍 Performing Railway-specific health check...')
    
    // Check deployment health
    await this.checkDeploymentHealth()
    
    // Check runtime health
    await this.checkRuntimeHealth()
    
    // Check application health
    await this.checkApplicationHealth()
    
    // Report findings
    await this.reportRailwayHealth()
  }

  private async checkDeploymentHealth(): Promise<void> {
    try {
      const projectRoot = process.cwd()
      
      // Check standalone build
      const nextDir = path.join(projectRoot, '.next')
      const standaloneDir = path.join(nextDir, 'standalone')
      
      this.railwayMetrics.deploymentHealth.standaloneBuiltCorrectly = fs.existsSync(standaloneDir)
      
      if (this.railwayMetrics.deploymentHealth.standaloneBuiltCorrectly) {
        // Check static files
        const staticDir = path.join(standaloneDir, '.next', 'static')
        this.railwayMetrics.deploymentHealth.staticFilesCopied = fs.existsSync(staticDir)
        
        // Check public files
        const publicDir = path.join(standaloneDir, 'public')
        this.railwayMetrics.deploymentHealth.publicFilesCopied = fs.existsSync(publicDir)
        
        // Check server.js
        const serverJs = path.join(standaloneDir, 'server.js')
        this.railwayMetrics.deploymentHealth.serverJsExists = fs.existsSync(serverJs)
      }
      
      console.log('📦 Deployment health check completed')
      
    } catch (error) {
      console.error('❌ Deployment health check failed:', error)
      await this.createAlert('critical', 'Railway Deployment Health Check Failed',
        `Unable to verify deployment structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deployment_health', 0, 0)
    }
  }

  private async checkRuntimeHealth(): Promise<void> {
    try {
      // Check Railway environment detection
      this.railwayMetrics.runtimeHealth.environmentDetected = !!process.env.RAILWAY_ENVIRONMENT
      
      // Check port configuration
      this.railwayMetrics.runtimeHealth.portConfigured = !!process.env.PORT
      
      // Check public domain
      this.railwayMetrics.runtimeHealth.publicDomainSet = !!process.env.RAILWAY_PUBLIC_DOMAIN
      
      // Check memory usage
      const memUsage = process.memoryUsage()
      this.railwayMetrics.runtimeHealth.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100
      
      console.log('⚙️ Runtime health check completed')
      
    } catch (error) {
      console.error('❌ Runtime health check failed:', error)
    }
  }

  private async checkApplicationHealth(): Promise<void> {
    try {
      // Check if server is responding (basic ping)
      this.railwayMetrics.applicationHealth.serverResponding = await this.checkServerResponse()
      
      // Check static assets serving
      this.railwayMetrics.applicationHealth.staticAssetsServing = await this.checkStaticAssets()
      
      // Check API endpoints
      this.railwayMetrics.applicationHealth.apiEndpointsWorking = await this.checkAPIEndpoints()
      
      // Check database connection
      this.railwayMetrics.applicationHealth.databaseConnected = await this.checkDatabaseConnection()
      
      console.log('🏥 Application health check completed')
      
    } catch (error) {
      console.error('❌ Application health check failed:', error)
    }
  }

  private async checkServerResponse(): Promise<boolean> {
    try {
      // Simple self-ping to check if server is responding
      const port = process.env.PORT || 3000
      const fetch = (await import('node-fetch')).default
      
      const response = await fetch(`http://localhost:${port}/api/health`, {
        timeout: 5000
      })
      
      return response.ok
    } catch (error) {
      console.warn('Server response check failed:', error)
      return false
    }
  }

  private async checkStaticAssets(): Promise<boolean> {
    try {
      // Check if we can access static files
      const port = process.env.PORT || 3000
      const fetch = (await import('node-fetch')).default
      
      // Try to access a common static file pattern
      const response = await fetch(`http://localhost:${port}/_next/static/css`, {
        timeout: 3000
      })
      
      // 404 is expected, but we want to make sure the server attempts to serve it
      return response.status === 404 || response.ok
    } catch (error) {
      console.warn('Static assets check failed:', error)
      return false
    }
  }

  private async checkAPIEndpoints(): Promise<boolean> {
    try {
      const port = process.env.PORT || 3000
      const fetch = (await import('node-fetch')).default
      
      // Check health endpoint
      const response = await fetch(`http://localhost:${port}/api/health`, {
        timeout: 5000
      })
      
      return response.ok
    } catch (error) {
      console.warn('API endpoints check failed:', error)
      return false
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Import Supabase client and test connection
      const { supabaseAdmin } = await import('../src/lib/supabase')
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1)
      
      return !error
    } catch (error) {
      console.warn('Database connection check failed:', error)
      return false
    }
  }

  private async reportRailwayHealth(): Promise<void> {
    const { deploymentHealth, runtimeHealth, applicationHealth } = this.railwayMetrics
    
    console.log('\n🚂 RAILWAY HEALTH REPORT')
    console.log('========================')
    
    // Deployment Health
    console.log('\n📦 Deployment Health:')
    console.log(`   Standalone Build: ${deploymentHealth.standaloneBuiltCorrectly ? '✅' : '❌'}`)
    console.log(`   Static Files: ${deploymentHealth.staticFilesCopied ? '✅' : '❌'}`)
    console.log(`   Public Files: ${deploymentHealth.publicFilesCopied ? '✅' : '❌'}`)
    console.log(`   Server.js: ${deploymentHealth.serverJsExists ? '✅' : '❌'}`)
    
    // Runtime Health
    console.log('\n⚙️ Runtime Health:')
    console.log(`   Railway Environment: ${runtimeHealth.environmentDetected ? '✅' : '❌'}`)
    console.log(`   Port Configured: ${runtimeHealth.portConfigured ? '✅' : '❌'}`)
    console.log(`   Public Domain: ${runtimeHealth.publicDomainSet ? '✅' : '❌'}`)
    console.log(`   Memory Usage: ${runtimeHealth.memoryUsage.toFixed(1)}%`)
    
    // Application Health
    console.log('\n🏥 Application Health:')
    console.log(`   Server Responding: ${applicationHealth.serverResponding ? '✅' : '❌'}`)
    console.log(`   Static Assets: ${applicationHealth.staticAssetsServing ? '✅' : '❌'}`)
    console.log(`   API Endpoints: ${applicationHealth.apiEndpointsWorking ? '✅' : '❌'}`)
    console.log(`   Database: ${applicationHealth.databaseConnected ? '✅' : '❌'}`)
    
    // Critical alerts
    await this.checkForCriticalIssues()
  }

  private async checkForCriticalIssues(): Promise<void> {
    const { deploymentHealth, applicationHealth } = this.railwayMetrics
    
    // Critical deployment issues
    if (!deploymentHealth.standaloneBuiltCorrectly) {
      await this.createAlert('critical', 'Railway Deployment Critical Issue',
        'Standalone build not found - Railway deployment will fail',
        'deployment', 0, 1)
    }
    
    if (!deploymentHealth.staticFilesCopied) {
      await this.createAlert('critical', 'Railway Static Files Missing',
        'Static files not copied to standalone build - will cause 404 errors',
        'static_files', 0, 1)
    }
    
    if (!deploymentHealth.serverJsExists) {
      await this.createAlert('critical', 'Railway Server Missing',
        'server.js not found - Railway cannot start application',
        'server', 0, 1)
    }
    
    // Critical application issues
    if (!applicationHealth.serverResponding) {
      await this.createAlert('critical', 'Railway Server Not Responding',
        'Application server not responding to health checks',
        'server_response', 0, 1)
    }
    
    if (!applicationHealth.databaseConnected) {
      await this.createAlert('critical', 'Railway Database Connection Failed',
        'Unable to connect to database - core functionality will fail',
        'database', 0, 1)
    }
  }

  // Override the parent method to add Railway-specific metrics
  async generateReport(): Promise<any> {
    const standardReport = await super.generateReport()
    
    // Add Railway-specific metrics to the report
    const railwayReport = {
      ...standardReport,
      railway_specific: {
        environment_detected: this.isRailwayEnvironment(),
        deployment_health: this.railwayMetrics.deploymentHealth,
        runtime_health: this.railwayMetrics.runtimeHealth,
        application_health: this.railwayMetrics.applicationHealth,
        overall_railway_health: this.calculateRailwayHealthScore()
      }
    }
    
    return railwayReport
  }

  private calculateRailwayHealthScore(): number {
    const { deploymentHealth, runtimeHealth, applicationHealth } = this.railwayMetrics
    
    let score = 0
    let totalChecks = 0
    
    // Deployment health (40% weight)
    const deploymentChecks = [
      deploymentHealth.standaloneBuiltCorrectly,
      deploymentHealth.staticFilesCopied,
      deploymentHealth.publicFilesCopied,
      deploymentHealth.serverJsExists
    ]
    score += deploymentChecks.filter(Boolean).length * 10
    totalChecks += deploymentChecks.length
    
    // Runtime health (30% weight)
    const runtimeChecks = [
      runtimeHealth.environmentDetected,
      runtimeHealth.portConfigured,
      runtimeHealth.memoryUsage < 80 // Memory under 80%
    ]
    score += runtimeChecks.filter(Boolean).length * 7.5
    totalChecks += runtimeChecks.length
    
    // Application health (30% weight)
    const applicationChecks = [
      applicationHealth.serverResponding,
      applicationHealth.staticAssetsServing,
      applicationHealth.apiEndpointsWorking,
      applicationHealth.databaseConnected
    ]
    score += applicationChecks.filter(Boolean).length * 7.5
    totalChecks += applicationChecks.length
    
    return Math.round((score / (totalChecks * 10)) * 100)
  }

  getRailwayMetrics(): RailwayHealthMetrics {
    return { ...this.railwayMetrics }
  }
}

// CLI execution for Railway-specific monitoring
if (require.main === module) {
  const railwayMonitor = new RailwayMonitor({
    interval: 30000, // 30 seconds
    alertThresholds: {
      responseTime: 3000, // Railway can be slightly slower
      errorRate: 0.02, // 2% error rate
      memoryUsage: 0.85, // 85% memory usage (Railway has memory limits)
      diskUsage: 0.9 // 90% disk usage
    },
    notificationChannels: {
      console: true,
      file: true,
      webhook: process.env.RAILWAY_WEBHOOK_URL
    }
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Railway monitoring...')
    await railwayMonitor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down Railway monitoring...')
    await railwayMonitor.stop()
    process.exit(0)
  })

  // Start Railway monitoring
  railwayMonitor.start().catch(error => {
    console.error('💥 Failed to start Railway monitoring:', error)
    process.exit(1)
  })
}

export { RailwayMonitor }