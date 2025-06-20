#!/usr/bin/env tsx
/**
 * 革新的本番環境監視システム
 * Worker3実装：リアルタイム品質監視とアラートシステム
 */

import { ProductionEnvironmentTester } from '../src/lib/production-environment-test'
import fs from 'fs/promises'
import path from 'path'

interface MonitoringConfig {
  interval: number // milliseconds
  alertThresholds: {
    responseTime: number
    errorRate: number
    memoryUsage: number
    diskUsage: number
  }
  notificationChannels: {
    console: boolean
    file: boolean
    webhook?: string
  }
  retentionPeriod: number // days
}

interface MetricPoint {
  timestamp: string
  metric: string
  value: number
  status: 'normal' | 'warning' | 'critical'
  source: string
}

interface AlertEvent {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'critical'
  title: string
  description: string
  metric: string
  value: number
  threshold: number
  resolved: boolean
  resolvedAt?: string
}

interface MonitoringReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalChecks: number
    healthyPercentage: number
    averageResponseTime: number
    criticalAlerts: number
    warningAlerts: number
  }
  metrics: MetricPoint[]
  alerts: AlertEvent[]
  recommendations: string[]
}

export class ProductionMonitor {
  private config: MonitoringConfig
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  private metrics: MetricPoint[] = []
  private alerts: AlertEvent[] = []
  private lastHealthCheck?: any

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      interval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        diskUsage: 0.9 // 90%
      },
      notificationChannels: {
        console: true,
        file: true
      },
      retentionPeriod: 7, // 7 days
      ...config
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Monitor is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting production monitoring system...')
    console.log(`📊 Monitoring interval: ${this.config.interval / 1000}s`)
    console.log(`🔔 Alert thresholds configured`)

    // Initial health check
    await this.performHealthCheck()

    // Start monitoring loop
    this.intervalId = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('❌ Monitoring error:', error)
        await this.createAlert('critical', 'Monitoring System Error', 
          `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'system', 0, 0)
      }
    }, this.config.interval)

    // Cleanup old data periodically (every hour)
    setInterval(() => {
      this.cleanupOldData()
    }, 3600000)

    console.log('✅ Production monitoring started successfully')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    // Save final report
    await this.generateReport()
    
    console.log('🛑 Production monitoring stopped')
  }

  private async performHealthCheck(): Promise<void> {
    const tester = new ProductionEnvironmentTester()
    const startTime = Date.now()
    
    try {
      const healthReport = await tester.runComprehensiveTest()
      this.lastHealthCheck = healthReport
      
      const responseTime = Date.now() - startTime
      
      // Record metrics
      await this.recordMetric('response_time', responseTime, 'health_check')
      await this.recordMetric('health_score', this.calculateHealthScore(healthReport), 'health_check')
      await this.recordMetric('memory_usage', this.getMemoryUsagePercentage(), 'system')
      
      // Check for alerts
      await this.checkAlerts(healthReport, responseTime)
      
      // Log status
      const status = healthReport.overall === 'healthy' ? '🟢' : 
                    healthReport.overall === 'degraded' ? '🟡' : '🔴'
      
      if (this.config.notificationChannels.console) {
        console.log(`${status} Health: ${healthReport.overall} | Response: ${responseTime}ms | Memory: ${this.getMemoryUsagePercentage().toFixed(1)}%`)
      }
      
    } catch (error) {
      await this.createAlert('critical', 'Health Check Failed', 
        `Unable to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'health_check', 0, 0)
    }
  }

  private async recordMetric(metric: string, value: number, source: string): Promise<void> {
    const threshold = this.getThresholdForMetric(metric)
    let status: 'normal' | 'warning' | 'critical' = 'normal'
    
    if (metric === 'response_time' && value > threshold * 2) {
      status = 'critical'
    } else if (metric === 'response_time' && value > threshold) {
      status = 'warning'
    } else if (metric.includes('usage') && value > 0.9) {
      status = 'critical'
    } else if (metric.includes('usage') && value > 0.7) {
      status = 'warning'
    }

    const metricPoint: MetricPoint = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      status,
      source
    }

    this.metrics.push(metricPoint)

    // Save to file if enabled
    if (this.config.notificationChannels.file) {
      await this.saveMetricToFile(metricPoint)
    }
  }

  private async checkAlerts(healthReport: any, responseTime: number): Promise<void> {
    // Response time alert
    if (responseTime > this.config.alertThresholds.responseTime) {
      const level = responseTime > this.config.alertThresholds.responseTime * 2 ? 'critical' : 'warning'
      await this.createAlert(level, 'High Response Time', 
        `Health check response time: ${responseTime}ms (threshold: ${this.config.alertThresholds.responseTime}ms)`,
        'response_time', responseTime, this.config.alertThresholds.responseTime)
    }

    // Memory usage alert
    const memoryUsage = this.getMemoryUsagePercentage()
    if (memoryUsage > this.config.alertThresholds.memoryUsage * 100) {
      await this.createAlert('warning', 'High Memory Usage', 
        `Memory usage: ${memoryUsage.toFixed(1)}% (threshold: ${(this.config.alertThresholds.memoryUsage * 100).toFixed(1)}%)`,
        'memory_usage', memoryUsage, this.config.alertThresholds.memoryUsage * 100)
    }

    // Health degradation alert
    if (healthReport.overall === 'critical') {
      await this.createAlert('critical', 'System Health Critical', 
        `Critical issues detected: ${healthReport.criticalIssues.join(', ')}`,
        'health_status', 0, 0)
    } else if (healthReport.overall === 'degraded') {
      await this.createAlert('warning', 'System Health Degraded', 
        `System performance degraded. Issues: ${healthReport.criticalIssues.length}`,
        'health_status', healthReport.criticalIssues.length, 0)
    }

    // Error rate monitoring
    const errorRate = this.calculateErrorRate(healthReport)
    if (errorRate > this.config.alertThresholds.errorRate) {
      await this.createAlert('warning', 'High Error Rate', 
        `Error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%)`,
        'error_rate', errorRate * 100, this.config.alertThresholds.errorRate * 100)
    }
  }

  private async createAlert(level: 'info' | 'warning' | 'critical', title: string, description: string, metric: string, value: number, threshold: number): Promise<void> {
    const alert: AlertEvent = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      title,
      description,
      metric,
      value,
      threshold,
      resolved: false
    }

    this.alerts.push(alert)

    // Console notification
    if (this.config.notificationChannels.console) {
      const icon = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`${icon} ALERT [${level.toUpperCase()}]: ${title}`)
      console.log(`   ${description}`)
    }

    // File notification
    if (this.config.notificationChannels.file) {
      await this.saveAlertToFile(alert)
    }

    // Webhook notification
    if (this.config.notificationChannels.webhook) {
      await this.sendWebhookAlert(alert)
    }
  }

  private calculateHealthScore(healthReport: any): number {
    const totalTests = healthReport.summary.totalTests
    const passed = healthReport.summary.passed
    
    if (totalTests === 0) return 0
    
    return (passed / totalTests) * 100
  }

  private getMemoryUsagePercentage(): number {
    const memUsage = process.memoryUsage()
    const totalMemory = memUsage.heapTotal
    const usedMemory = memUsage.heapUsed
    
    return (usedMemory / totalMemory) * 100
  }

  private calculateErrorRate(healthReport: any): number {
    const totalTests = healthReport.summary.totalTests
    const failed = healthReport.summary.failed
    
    if (totalTests === 0) return 0
    
    return failed / totalTests
  }

  private getThresholdForMetric(metric: string): number {
    switch (metric) {
      case 'response_time':
        return this.config.alertThresholds.responseTime
      case 'memory_usage':
        return this.config.alertThresholds.memoryUsage * 100
      case 'error_rate':
        return this.config.alertThresholds.errorRate * 100
      default:
        return 100
    }
  }

  private async saveMetricToFile(metric: MetricPoint): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs', 'monitoring')
      await fs.mkdir(logsDir, { recursive: true })
      
      const date = new Date().toISOString().split('T')[0]
      const filename = path.join(logsDir, `metrics-${date}.jsonl`)
      
      await fs.appendFile(filename, JSON.stringify(metric) + '\n')
    } catch (error) {
      console.error('Failed to save metric to file:', error)
    }
  }

  private async saveAlertToFile(alert: AlertEvent): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs', 'monitoring')
      await fs.mkdir(logsDir, { recursive: true })
      
      const date = new Date().toISOString().split('T')[0]
      const filename = path.join(logsDir, `alerts-${date}.jsonl`)
      
      await fs.appendFile(filename, JSON.stringify(alert) + '\n')
    } catch (error) {
      console.error('Failed to save alert to file:', error)
    }
  }

  private async sendWebhookAlert(alert: AlertEvent): Promise<void> {
    if (!this.config.notificationChannels.webhook) return

    try {
      const fetch = (await import('node-fetch')).default
      
      await fetch(this.config.notificationChannels.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'production_alert',
          alert,
          system: 'sns-video-generator',
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod)
    
    const cutoffTime = cutoffDate.toISOString()
    
    // Clean old metrics
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime)
    
    // Clean old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime)
    
    console.log(`🧹 Cleaned up monitoring data older than ${this.config.retentionPeriod} days`)
  }

  async generateReport(): Promise<MonitoringReport> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)
    
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp) > oneHourAgo
    )
    
    const recentAlerts = this.alerts.filter(a => 
      new Date(a.timestamp) > oneHourAgo
    )

    const healthyChecks = recentMetrics.filter(m => 
      m.metric === 'health_score' && m.value > 80
    ).length
    
    const totalHealthChecks = recentMetrics.filter(m => 
      m.metric === 'health_score'
    ).length

    const responseTimes = recentMetrics
      .filter(m => m.metric === 'response_time')
      .map(m => m.value)
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    const report: MonitoringReport = {
      period: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      },
      summary: {
        totalChecks: totalHealthChecks,
        healthyPercentage: totalHealthChecks > 0 ? (healthyChecks / totalHealthChecks) * 100 : 100,
        averageResponseTime: avgResponseTime,
        criticalAlerts: recentAlerts.filter(a => a.level === 'critical').length,
        warningAlerts: recentAlerts.filter(a => a.level === 'warning').length
      },
      metrics: recentMetrics,
      alerts: recentAlerts,
      recommendations: this.generateRecommendations(recentMetrics, recentAlerts)
    }

    // Save report to file
    if (this.config.notificationChannels.file) {
      try {
        const reportsDir = path.join(process.cwd(), 'logs', 'monitoring', 'reports')
        await fs.mkdir(reportsDir, { recursive: true })
        
        const timestamp = now.toISOString().replace(/[:.]/g, '-')
        const filename = path.join(reportsDir, `monitoring-report-${timestamp}.json`)
        
        await fs.writeFile(filename, JSON.stringify(report, null, 2))
        console.log(`📊 Monitoring report saved: ${filename}`)
      } catch (error) {
        console.error('Failed to save monitoring report:', error)
      }
    }

    return report
  }

  private generateRecommendations(metrics: MetricPoint[], alerts: AlertEvent[]): string[] {
    const recommendations: string[] = []
    
    // High response time recommendation
    const highResponseTimes = metrics.filter(m => 
      m.metric === 'response_time' && m.value > this.config.alertThresholds.responseTime
    )
    if (highResponseTimes.length > 0) {
      recommendations.push('Consider optimizing database queries and API response times')
    }
    
    // High memory usage recommendation
    const highMemoryUsage = metrics.filter(m => 
      m.metric === 'memory_usage' && m.value > this.config.alertThresholds.memoryUsage * 100
    )
    if (highMemoryUsage.length > 0) {
      recommendations.push('Monitor memory leaks and consider scaling up server resources')
    }
    
    // Frequent alerts recommendation
    if (alerts.length > 5) {
      recommendations.push('High alert frequency detected - review system stability and alert thresholds')
    }
    
    // Critical alerts recommendation
    const criticalAlerts = alerts.filter(a => a.level === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical alerts immediately to prevent service disruption')
    }
    
    return recommendations
  }

  // Public methods for external access
  getMetrics(): MetricPoint[] {
    return [...this.metrics]
  }

  getAlerts(): AlertEvent[] {
    return [...this.alerts]
  }

  getLastHealthCheck(): any {
    return this.lastHealthCheck
  }

  isMonitoringActive(): boolean {
    return this.isRunning
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new ProductionMonitor({
    interval: process.env.MONITOR_INTERVAL ? parseInt(process.env.MONITOR_INTERVAL) : 30000,
    notificationChannels: {
      console: true,
      file: true,
      webhook: process.env.MONITOR_WEBHOOK_URL
    }
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down monitoring system...')
    await monitor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down monitoring system...')
    await monitor.stop()
    process.exit(0)
  })

  // Start monitoring
  monitor.start().catch(error => {
    console.error('💥 Failed to start monitoring:', error)
    process.exit(1)
  })
}

export { ProductionMonitor }
export type { MonitoringConfig, MetricPoint, AlertEvent, MonitoringReport }