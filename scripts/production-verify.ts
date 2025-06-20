#!/usr/bin/env node
/**
 * 本番環境完全検証スクリプト
 * 達成報告と実稼働状況の差異を自動検出
 */

import { WebFetch } from '@/lib/tools/web-fetch'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'

interface VerificationResult {
  timestamp: string
  environment: 'vercel' | 'railway'
  status: 'healthy' | 'degraded' | 'critical'
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warning'
      message: string
      details?: any
    }
  }
  summary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
    successRate: number
  }
}

class ProductionVerifier {
  private vercelUrl = 'https://sns-video-generator-plus62s-projects.vercel.app'
  private railwayUrl = 'https://sns-video-generator-production-ad7957.up.railway.app'
  
  private criticalEndpoints = [
    '/',
    '/auth/signin',
    '/dashboard',
    '/database-test'
  ]
  
  private apiEndpoints = [
    '/api/health',
    '/api/health/simple',
    '/api/upload/youtube',
    '/api/videos'
  ]

  async verifyAll(): Promise<{
    vercel: VerificationResult
    railway: VerificationResult
    combined: {
      overallStatus: 'healthy' | 'degraded' | 'critical'
      reportVsReality: {
        claimed: string
        actual: string
        gap: number // percentage
      }
    }
  }> {
    console.log('🔍 本番環境完全検証開始...\n')
    
    const [vercelResult, railwayResult] = await Promise.all([
      this.verifyEnvironment('vercel', this.vercelUrl),
      this.verifyEnvironment('railway', this.railwayUrl)
    ])
    
    const combined = this.calculateOverallStatus(vercelResult, railwayResult)
    
    // 結果をファイルに保存
    await this.saveResults({ vercel: vercelResult, railway: railwayResult, combined })
    
    // レポート生成
    this.generateReport(vercelResult, railwayResult, combined)
    
    return { vercel: vercelResult, railway: railwayResult, combined }
  }

  private async verifyEnvironment(
    env: 'vercel' | 'railway', 
    baseUrl: string
  ): Promise<VerificationResult> {
    const result: VerificationResult = {
      timestamp: new Date().toISOString(),
      environment: env,
      status: 'healthy',
      checks: {},
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        successRate: 0
      }
    }

    // 1. ベースURL接続確認
    result.checks['base_connectivity'] = await this.checkConnectivity(baseUrl)
    
    // 2. クリティカルページ確認
    for (const endpoint of this.criticalEndpoints) {
      const checkName = `page_${endpoint.replace(/\//g, '_')}`
      result.checks[checkName] = await this.checkPage(baseUrl + endpoint)
    }
    
    // 3. API エンドポイント確認
    for (const endpoint of this.apiEndpoints) {
      const checkName = `api_${endpoint.replace(/\//g, '_')}`
      result.checks[checkName] = await this.checkApi(baseUrl + endpoint)
    }
    
    // 4. パフォーマンス確認
    result.checks['performance'] = await this.checkPerformance(baseUrl)
    
    // 5. エラー率確認
    result.checks['error_rate'] = await this.checkErrorRate(baseUrl)
    
    // サマリー計算
    this.calculateSummary(result)
    
    return result
  }

  private async checkConnectivity(url: string): Promise<any> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      
      return {
        status: response.ok ? 'pass' : 'fail',
        message: `HTTP ${response.status}`,
        details: {
          statusCode: response.status,
          responseTime: Date.now() - Date.now()
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Connection failed',
        details: { error: error.message }
      }
    }
  }

  private async checkPage(url: string): Promise<any> {
    try {
      const start = Date.now()
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      })
      const responseTime = Date.now() - start
      
      if (!response.ok) {
        return {
          status: 'fail',
          message: `HTTP ${response.status}`,
          details: { statusCode: response.status, responseTime }
        }
      }
      
      const text = await response.text()
      
      // コンテンツ検証
      const hasContent = text.length > 1000
      const hasNoErrors = !text.includes('Error') && !text.includes('404')
      
      return {
        status: hasContent && hasNoErrors ? 'pass' : 'warning',
        message: hasContent && hasNoErrors ? 'Page loads successfully' : 'Page has issues',
        details: {
          responseTime,
          contentLength: text.length,
          hasErrors: !hasNoErrors
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Page check failed',
        details: { error: error.message }
      }
    }
  }

  private async checkApi(url: string): Promise<any> {
    try {
      const start = Date.now()
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })
      const responseTime = Date.now() - start
      
      if (!response.ok) {
        return {
          status: 'fail',
          message: `HTTP ${response.status}`,
          details: { statusCode: response.status, responseTime }
        }
      }
      
      const data = await response.json()
      
      return {
        status: 'pass',
        message: 'API responds correctly',
        details: {
          responseTime,
          dataReceived: true,
          sampleData: Object.keys(data).slice(0, 3)
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'API check failed',
        details: { error: error.message }
      }
    }
  }

  private async checkPerformance(baseUrl: string): Promise<any> {
    const timings = []
    
    // 5回アクセスして平均を取る
    for (let i = 0; i < 5; i++) {
      const start = Date.now()
      try {
        await fetch(baseUrl, { signal: AbortSignal.timeout(5000) })
        timings.push(Date.now() - start)
      } catch {
        // エラーは無視
      }
    }
    
    if (timings.length === 0) {
      return {
        status: 'fail',
        message: 'Performance check failed',
        details: { error: 'No successful requests' }
      }
    }
    
    const avgTime = timings.reduce((a, b) => a + b) / timings.length
    const status = avgTime < 1000 ? 'pass' : avgTime < 3000 ? 'warning' : 'fail'
    
    return {
      status,
      message: `Average response time: ${Math.round(avgTime)}ms`,
      details: {
        averageTime: avgTime,
        measurements: timings,
        threshold: { good: 1000, acceptable: 3000 }
      }
    }
  }

  private async checkErrorRate(baseUrl: string): Promise<any> {
    // 簡易的なエラー率チェック（実際の運用では監視ツールと連携）
    const totalRequests = 10
    let errors = 0
    
    for (let i = 0; i < totalRequests; i++) {
      try {
        const endpoint = this.criticalEndpoints[i % this.criticalEndpoints.length]
        const response = await fetch(baseUrl + endpoint, {
          signal: AbortSignal.timeout(5000)
        })
        if (!response.ok) errors++
      } catch {
        errors++
      }
    }
    
    const errorRate = (errors / totalRequests) * 100
    const status = errorRate === 0 ? 'pass' : errorRate < 5 ? 'warning' : 'fail'
    
    return {
      status,
      message: `Error rate: ${errorRate}%`,
      details: {
        totalRequests,
        errors,
        errorRate,
        threshold: { good: 0, acceptable: 5 }
      }
    }
  }

  private calculateSummary(result: VerificationResult): void {
    let passed = 0, failed = 0, warnings = 0
    
    Object.values(result.checks).forEach(check => {
      switch (check.status) {
        case 'pass': passed++; break
        case 'fail': failed++; break
        case 'warning': warnings++; break
      }
    })
    
    const total = passed + failed + warnings
    
    result.summary = {
      totalChecks: total,
      passed,
      failed,
      warnings,
      successRate: total > 0 ? (passed / total) * 100 : 0
    }
    
    // 全体ステータスの判定
    if (failed > 0) {
      result.status = 'critical'
    } else if (warnings > 2) {
      result.status = 'degraded'
    } else {
      result.status = 'healthy'
    }
  }

  private calculateOverallStatus(
    vercel: VerificationResult,
    railway: VerificationResult
  ): any {
    const totalChecks = vercel.summary.totalChecks + railway.summary.totalChecks
    const totalPassed = vercel.summary.passed + railway.summary.passed
    const overallSuccessRate = (totalPassed / totalChecks) * 100
    
    let overallStatus: 'healthy' | 'degraded' | 'critical'
    if (vercel.status === 'critical' || railway.status === 'critical') {
      overallStatus = 'critical'
    } else if (vercel.status === 'degraded' || railway.status === 'degraded') {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }
    
    // 報告と現実のギャップ計算
    const claimed = '100% 完成・全機能動作'
    const actual = `${Math.round(overallSuccessRate)}% 動作中`
    const gap = 100 - overallSuccessRate
    
    return {
      overallStatus,
      reportVsReality: {
        claimed,
        actual,
        gap
      }
    }
  }

  private async saveResults(results: any): Promise<void> {
    const dir = join(process.cwd(), 'ai-org', 'verification-results')
    await fs.mkdir(dir, { recursive: true })
    
    const filename = `verification-${Date.now()}.json`
    const filepath = join(dir, filename)
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2))
    console.log(`\n📁 結果を保存しました: ${filepath}`)
  }

  private generateReport(
    vercel: VerificationResult,
    railway: VerificationResult,
    combined: any
  ): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 本番環境検証レポート')
    console.log('='.repeat(60))
    
    // Vercel結果
    console.log('\n🔷 Vercel (フロントエンド)')
    console.log(`  状態: ${this.getStatusEmoji(vercel.status)} ${vercel.status.toUpperCase()}`)
    console.log(`  成功率: ${Math.round(vercel.summary.successRate)}%`)
    console.log(`  チェック数: ${vercel.summary.totalChecks}`)
    console.log(`  ✅ 成功: ${vercel.summary.passed}`)
    console.log(`  ❌ 失敗: ${vercel.summary.failed}`)
    console.log(`  ⚠️  警告: ${vercel.summary.warnings}`)
    
    // Railway結果
    console.log('\n🔶 Railway (バックエンド)')
    console.log(`  状態: ${this.getStatusEmoji(railway.status)} ${railway.status.toUpperCase()}`)
    console.log(`  成功率: ${Math.round(railway.summary.successRate)}%`)
    console.log(`  チェック数: ${railway.summary.totalChecks}`)
    console.log(`  ✅ 成功: ${railway.summary.passed}`)
    console.log(`  ❌ 失敗: ${railway.summary.failed}`)
    console.log(`  ⚠️  警告: ${railway.summary.warnings}`)
    
    // 統合結果
    console.log('\n📈 統合評価')
    console.log(`  全体状態: ${this.getStatusEmoji(combined.overallStatus)} ${combined.overallStatus.toUpperCase()}`)
    console.log('\n🎯 報告 vs 現実')
    console.log(`  報告内容: ${combined.reportVsReality.claimed}`)
    console.log(`  実際の状態: ${combined.reportVsReality.actual}`)
    console.log(`  ギャップ: ${Math.round(combined.reportVsReality.gap)}%`)
    
    // 詳細な失敗項目
    console.log('\n❌ 失敗した項目:')
    this.listFailedChecks(vercel, 'Vercel')
    this.listFailedChecks(railway, 'Railway')
    
    console.log('\n' + '='.repeat(60))
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'critical': return '🚨'
      default: return '❓'
    }
  }

  private listFailedChecks(result: VerificationResult, env: string): void {
    Object.entries(result.checks).forEach(([name, check]) => {
      if (check.status === 'fail') {
        console.log(`  [${env}] ${name}: ${check.message}`)
      }
    })
  }
}

// 実行
if (require.main === module) {
  const verifier = new ProductionVerifier()
  verifier.verifyAll()
    .then(results => {
      const exitCode = results.combined.overallStatus === 'critical' ? 1 : 0
      process.exit(exitCode)
    })
    .catch(error => {
      console.error('検証エラー:', error)
      process.exit(1)
    })
}

export { ProductionVerifier }