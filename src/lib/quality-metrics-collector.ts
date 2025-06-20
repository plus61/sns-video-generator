/**
 * 革新的品質メトリクス収集システム
 * Worker3実装：AIによる品質分析と予測的アラート
 */

import { supabaseAdmin } from './supabase'
import OpenAI from 'openai'

// Initialize OpenAI for quality analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface QualityMetric {
  id: string
  timestamp: string
  category: 'performance' | 'reliability' | 'security' | 'usability' | 'maintainability'
  metric_name: string
  value: number
  unit: string
  target_value?: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  source: string
  metadata?: Record<string, any>
}

export interface QualityTrend {
  metric_name: string
  category: string
  trend_direction: 'improving' | 'stable' | 'degrading'
  trend_percentage: number
  prediction_24h: number
  confidence_score: number
  recommendations: string[]
}

export interface QualityReport {
  overall_score: number
  category_scores: Record<string, number>
  trends: QualityTrend[]
  critical_issues: string[]
  improvement_suggestions: string[]
  generated_at: string
  period: {
    start: string
    end: string
  }
}

export class QualityMetricsCollector {
  private metrics: QualityMetric[] = []
  private isCollecting = false
  private collectionInterval?: NodeJS.Timeout

  async startCollection(intervalMs: number = 60000): Promise<void> {
    if (this.isCollecting) {
      console.log('📊 Quality metrics collection already running')
      return
    }

    this.isCollecting = true
    console.log('🚀 Starting quality metrics collection...')

    // Initial collection
    await this.collectAllMetrics()

    // Start periodic collection
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics()
      } catch (error) {
        console.error('❌ Quality metrics collection error:', error)
      }
    }, intervalMs)

    console.log(`✅ Quality metrics collection started (interval: ${intervalMs / 1000}s)`)
  }

  stopCollection(): void {
    if (!this.isCollecting) return

    this.isCollecting = false
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = undefined
    }

    console.log('🛑 Quality metrics collection stopped')
  }

  private async collectAllMetrics(): Promise<void> {
    const timestamp = new Date().toISOString()
    
    // Performance Metrics
    await this.collectPerformanceMetrics(timestamp)
    
    // Reliability Metrics
    await this.collectReliabilityMetrics(timestamp)
    
    // Security Metrics
    await this.collectSecurityMetrics(timestamp)
    
    // Usability Metrics
    await this.collectUsabilityMetrics(timestamp)
    
    // Maintainability Metrics
    await this.collectMaintainabilityMetrics(timestamp)

    // Store metrics in database
    await this.storeMetrics()

    console.log(`📈 Collected ${this.metrics.length} quality metrics`)
  }

  private async collectPerformanceMetrics(timestamp: string): Promise<void> {
    try {
      // Response time metric
      const startTime = Date.now()
      await this.performHealthPing()
      const responseTime = Date.now() - startTime

      await this.addMetric({
        timestamp,
        category: 'performance',
        metric_name: 'api_response_time',
        value: responseTime,
        unit: 'ms',
        target_value: 500,
        source: 'health_check'
      })

      // Memory usage metric
      const memoryUsage = process.memoryUsage()
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

      await this.addMetric({
        timestamp,
        category: 'performance',
        metric_name: 'memory_usage',
        value: memoryPercentage,
        unit: 'percent',
        target_value: 70,
        source: 'system_monitor'
      })

      // CPU usage (simulated - would use real CPU monitoring in production)
      const cpuUsage = Math.random() * 100 // Placeholder

      await this.addMetric({
        timestamp,
        category: 'performance',
        metric_name: 'cpu_usage',
        value: cpuUsage,
        unit: 'percent',
        target_value: 80,
        source: 'system_monitor'
      })

    } catch (error) {
      console.error('Failed to collect performance metrics:', error)
    }
  }

  private async collectReliabilityMetrics(timestamp: string): Promise<void> {
    try {
      // Service uptime (simulated)
      const uptime = process.uptime() / 3600 // Convert to hours
      
      await this.addMetric({
        timestamp,
        category: 'reliability',
        metric_name: 'service_uptime',
        value: uptime,
        unit: 'hours',
        target_value: 24,
        source: 'uptime_monitor'
      })

      // Error rate
      const errorRate = await this.calculateErrorRate()
      
      await this.addMetric({
        timestamp,
        category: 'reliability',
        metric_name: 'error_rate',
        value: errorRate,
        unit: 'percent',
        target_value: 1,
        source: 'error_tracker'
      })

      // Database connection health
      const dbHealth = await this.checkDatabaseHealth()
      
      await this.addMetric({
        timestamp,
        category: 'reliability',
        metric_name: 'database_health',
        value: dbHealth ? 100 : 0,
        unit: 'percent',
        target_value: 100,
        source: 'db_monitor'
      })

    } catch (error) {
      console.error('Failed to collect reliability metrics:', error)
    }
  }

  private async collectSecurityMetrics(timestamp: string): Promise<void> {
    try {
      // SSL certificate validity (simulated)
      const sslScore = 95 // Would check actual SSL certificate
      
      await this.addMetric({
        timestamp,
        category: 'security',
        metric_name: 'ssl_score',
        value: sslScore,
        unit: 'score',
        target_value: 90,
        source: 'ssl_checker'
      })

      // Security headers score
      const securityHeaders = await this.checkSecurityHeaders()
      
      await this.addMetric({
        timestamp,
        category: 'security',
        metric_name: 'security_headers',
        value: securityHeaders,
        unit: 'score',
        target_value: 80,
        source: 'security_scanner'
      })

      // Vulnerability count (from dependency scan)
      const vulnerabilities = await this.scanDependencyVulnerabilities()
      
      await this.addMetric({
        timestamp,
        category: 'security',
        metric_name: 'vulnerability_count',
        value: vulnerabilities,
        unit: 'count',
        target_value: 0,
        source: 'dependency_scanner'
      })

    } catch (error) {
      console.error('Failed to collect security metrics:', error)
    }
  }

  private async collectUsabilityMetrics(timestamp: string): Promise<void> {
    try {
      // Page load time (simulated - would use real user monitoring)
      const pageLoadTime = 800 + Math.random() * 1200
      
      await this.addMetric({
        timestamp,
        category: 'usability',
        metric_name: 'page_load_time',
        value: pageLoadTime,
        unit: 'ms',
        target_value: 2000,
        source: 'rum_monitor'
      })

      // Accessibility score
      const accessibilityScore = await this.calculateAccessibilityScore()
      
      await this.addMetric({
        timestamp,
        category: 'usability',
        metric_name: 'accessibility_score',
        value: accessibilityScore,
        unit: 'score',
        target_value: 90,
        source: 'accessibility_checker'
      })

      // Mobile compatibility
      const mobileScore = 85 // Would run actual mobile compatibility checks
      
      await this.addMetric({
        timestamp,
        category: 'usability',
        metric_name: 'mobile_score',
        value: mobileScore,
        unit: 'score',
        target_value: 80,
        source: 'mobile_tester'
      })

    } catch (error) {
      console.error('Failed to collect usability metrics:', error)
    }
  }

  private async collectMaintainabilityMetrics(timestamp: string): Promise<void> {
    try {
      // Code complexity (simulated)
      const codeComplexity = await this.calculateCodeComplexity()
      
      await this.addMetric({
        timestamp,
        category: 'maintainability',
        metric_name: 'code_complexity',
        value: codeComplexity,
        unit: 'score',
        target_value: 20,
        source: 'code_analyzer'
      })

      // Test coverage
      const testCoverage = await this.calculateTestCoverage()
      
      await this.addMetric({
        timestamp,
        category: 'maintainability',
        metric_name: 'test_coverage',
        value: testCoverage,
        unit: 'percent',
        target_value: 80,
        source: 'test_runner'
      })

      // Technical debt score
      const techDebtScore = await this.calculateTechnicalDebt()
      
      await this.addMetric({
        timestamp,
        category: 'maintainability',
        metric_name: 'technical_debt',
        value: techDebtScore,
        unit: 'score',
        target_value: 10,
        source: 'debt_analyzer'
      })

    } catch (error) {
      console.error('Failed to collect maintainability metrics:', error)
    }
  }

  private async addMetric(metricData: Omit<QualityMetric, 'id' | 'status'>): Promise<void> {
    const status = this.calculateMetricStatus(metricData.value, metricData.target_value)
    
    const metric: QualityMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status,
      ...metricData
    }

    this.metrics.push(metric)
  }

  private calculateMetricStatus(value: number, target?: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (!target) return 'good'

    const ratio = value / target
    
    if (ratio <= 0.8) return 'excellent'
    if (ratio <= 1.0) return 'good'
    if (ratio <= 1.5) return 'warning'
    return 'critical'
  }

  // Helper methods for metric collection
  private async performHealthPing(): Promise<void> {
    // Simulate API health check
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
  }

  private async calculateErrorRate(): Promise<number> {
    try {
      // In a real implementation, this would query error logs
      // For now, return a simulated low error rate
      return Math.random() * 2 // 0-2% error rate
    } catch {
      return 0
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }

  private async checkSecurityHeaders(): Promise<number> {
    // Simulate security headers check
    // In production, would check actual headers
    return 75 + Math.random() * 20
  }

  private async scanDependencyVulnerabilities(): Promise<number> {
    // Simulate vulnerability scan
    // In production, would run actual security scanning
    return Math.floor(Math.random() * 3)
  }

  private async calculateAccessibilityScore(): Promise<number> {
    // Simulate accessibility scoring
    // In production, would run actual accessibility tests
    return 80 + Math.random() * 15
  }

  private async calculateCodeComplexity(): Promise<number> {
    // Simulate code complexity analysis
    // In production, would analyze actual code metrics
    return 10 + Math.random() * 20
  }

  private async calculateTestCoverage(): Promise<number> {
    // Simulate test coverage calculation
    // In production, would get actual coverage data
    return 70 + Math.random() * 25
  }

  private async calculateTechnicalDebt(): Promise<number> {
    // Simulate technical debt scoring
    // In production, would analyze code quality metrics
    return Math.random() * 15
  }

  private async storeMetrics(): Promise<void> {
    if (this.metrics.length === 0) return

    try {
      // In a real implementation, would store to database
      // For now, we'll store to a JSON file for demonstration
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const metricsDir = path.join(process.cwd(), 'logs', 'quality-metrics')
      await fs.mkdir(metricsDir, { recursive: true })
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = path.join(metricsDir, `quality-metrics-${timestamp}.jsonl`)
      
      for (const metric of this.metrics) {
        await fs.appendFile(filename, JSON.stringify(metric) + '\n')
      }

      console.log(`💾 Stored ${this.metrics.length} quality metrics to ${filename}`)
      
      // Clear metrics after storing
      this.metrics = []
      
    } catch (error) {
      console.error('Failed to store quality metrics:', error)
    }
  }

  async generateQualityReport(periodHours: number = 24): Promise<QualityReport> {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - (periodHours * 3600000))

    // Load metrics from the period (in production, would query database)
    const metrics = await this.loadMetricsFromPeriod(startTime, endTime)
    
    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(metrics)
    
    // Analyze trends
    const trends = await this.analyzeTrends(metrics)
    
    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(metrics)
    
    // Generate AI-powered improvement suggestions
    const improvementSuggestions = await this.generateImprovementSuggestions(metrics, trends)
    
    // Calculate overall score
    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length

    return {
      overall_score: Math.round(overallScore),
      category_scores: categoryScores,
      trends,
      critical_issues: criticalIssues,
      improvement_suggestions: improvementSuggestions,
      generated_at: new Date().toISOString(),
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }
    }
  }

  private async loadMetricsFromPeriod(startTime: Date, endTime: Date): Promise<QualityMetric[]> {
    // Placeholder - in production would load from database
    return this.metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp)
      return metricTime >= startTime && metricTime <= endTime
    })
  }

  private calculateCategoryScores(metrics: QualityMetric[]): Record<string, number> {
    const categories = ['performance', 'reliability', 'security', 'usability', 'maintainability']
    const scores: Record<string, number> = {}

    for (const category of categories) {
      const categoryMetrics = metrics.filter(m => m.category === category)
      if (categoryMetrics.length === 0) {
        scores[category] = 50 // Default score if no metrics
        continue
      }

      const statusScores = categoryMetrics.map(m => {
        switch (m.status) {
          case 'excellent': return 100
          case 'good': return 80
          case 'warning': return 60
          case 'critical': return 20
          default: return 50
        }
      })

      scores[category] = Math.round(statusScores.reduce((sum, score) => sum + score, 0) / statusScores.length)
    }

    return scores
  }

  private async analyzeTrends(metrics: QualityMetric[]): Promise<QualityTrend[]> {
    const trends: QualityTrend[] = []
    const metricNames = [...new Set(metrics.map(m => m.metric_name))]

    for (const metricName of metricNames) {
      const metricData = metrics
        .filter(m => m.metric_name === metricName)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      if (metricData.length < 2) continue

      const firstValue = metricData[0].value
      const lastValue = metricData[metricData.length - 1].value
      const trendPercentage = ((lastValue - firstValue) / firstValue) * 100

      let trendDirection: 'improving' | 'stable' | 'degrading' = 'stable'
      if (Math.abs(trendPercentage) > 5) {
        // For metrics where lower is better (like response time, error rate)
        const lowerIsBetter = ['api_response_time', 'error_rate', 'vulnerability_count', 'code_complexity', 'technical_debt'].includes(metricName)
        
        if (lowerIsBetter) {
          trendDirection = trendPercentage < 0 ? 'improving' : 'degrading'
        } else {
          trendDirection = trendPercentage > 0 ? 'improving' : 'degrading'
        }
      }

      // Simple linear prediction for next 24h
      const prediction24h = lastValue + (trendPercentage / 100) * lastValue

      trends.push({
        metric_name: metricName,
        category: metricData[0].category,
        trend_direction: trendDirection,
        trend_percentage: Math.round(trendPercentage * 100) / 100,
        prediction_24h: Math.round(prediction24h * 100) / 100,
        confidence_score: Math.min(metricData.length * 10, 100), // More data = higher confidence
        recommendations: this.getTrendRecommendations(metricName, trendDirection, trendPercentage)
      })
    }

    return trends
  }

  private getTrendRecommendations(metricName: string, direction: string, percentage: number): string[] {
    const recommendations: string[] = []

    if (direction === 'degrading') {
      switch (metricName) {
        case 'api_response_time':
          recommendations.push('Optimize database queries', 'Consider caching strategies', 'Review API endpoints for performance bottlenecks')
          break
        case 'error_rate':
          recommendations.push('Investigate recent error patterns', 'Improve error handling', 'Add more comprehensive testing')
          break
        case 'memory_usage':
          recommendations.push('Check for memory leaks', 'Optimize data structures', 'Consider garbage collection tuning')
          break
        case 'security_headers':
          recommendations.push('Review security header configuration', 'Update security policies', 'Audit third-party integrations')
          break
        default:
          recommendations.push(`Monitor ${metricName} closely`, 'Investigate root causes of degradation')
      }
    } else if (direction === 'improving') {
      recommendations.push(`Continue current practices for ${metricName}`, 'Document successful improvements for future reference')
    }

    return recommendations
  }

  private identifyCriticalIssues(metrics: QualityMetric[]): string[] {
    const criticalMetrics = metrics.filter(m => m.status === 'critical')
    const issues = criticalMetrics.map(m => `${m.metric_name}: ${m.value} ${m.unit}`)
    
    return [...new Set(issues)]
  }

  private async generateImprovementSuggestions(metrics: QualityMetric[], trends: QualityTrend[]): Promise<string[]> {
    if (!process.env.OPENAI_API_KEY) {
      return [
        'Configure OpenAI API key to enable AI-powered quality analysis',
        'Review critical metrics and implement immediate fixes',
        'Establish baseline quality targets for all categories'
      ]
    }

    try {
      const prompt = `You are a quality assurance expert analyzing system metrics. Based on the following data, provide 3-5 specific, actionable improvement suggestions:

QUALITY METRICS SUMMARY:
${JSON.stringify(metrics.slice(-10), null, 2)}

TRENDS:
${JSON.stringify(trends, null, 2)}

Provide suggestions that are:
1. Specific and actionable
2. Prioritized by impact
3. Focused on preventing future issues
4. Realistic to implement

Format as a simple array of strings.`

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        // Extract suggestions from AI response
        const suggestions = content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 10)

        return suggestions.slice(0, 5)
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    }

    // Fallback suggestions
    return [
      'Establish continuous monitoring for all critical metrics',
      'Implement automated alerts for quality degradation',
      'Create quality improvement roadmap based on trend analysis',
      'Regular security audits and dependency updates',
      'Performance optimization based on usage patterns'
    ]
  }

  // Public getter methods
  getCurrentMetrics(): QualityMetric[] {
    return [...this.metrics]
  }

  isCollectionActive(): boolean {
    return this.isCollecting
  }
}

// Singleton instance
export const qualityMetricsCollector = new QualityMetricsCollector()