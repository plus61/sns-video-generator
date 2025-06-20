#!/usr/bin/env node
/**
 * シンプルな本番環境検証スクリプト（即座に実行可能）
 */

const https = require('https')
const http = require('http')

const VERCEL_URL = 'https://sns-video-generator-plus62s-projects.vercel.app'
const RAILWAY_URL = 'https://sns-video-generator-production-ad7957.up.railway.app'

const CRITICAL_ENDPOINTS = [
  '/',
  '/auth/signin',
  '/dashboard',
  '/database-test'
]

const API_ENDPOINTS = [
  '/api/health',
  '/api/health/simple',
  '/api/upload/youtube',
  '/api/videos'
]

async function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    
    const req = protocol.get(url, { timeout: 5000 }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 400,
        headers: res.headers
      })
    })
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        ok: false,
        error: err.message
      })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({
        url,
        status: 0,
        ok: false,
        error: 'Timeout'
      })
    })
  })
}

async function verifyEnvironment(name, baseUrl) {
  console.log(`\n🔍 ${name} 環境検証開始...`)
  console.log(`URL: ${baseUrl}`)
  
  const results = {
    name,
    baseUrl,
    timestamp: new Date().toISOString(),
    pages: [],
    apis: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0,
      successRate: 0
    }
  }
  
  // ベースURL確認
  console.log('\n📄 ページ確認:')
  for (const endpoint of CRITICAL_ENDPOINTS) {
    const result = await checkUrl(baseUrl + endpoint)
    results.pages.push(result)
    console.log(`  ${result.ok ? '✅' : '❌'} ${endpoint} - ${result.status || result.error}`)
  }
  
  // API確認
  console.log('\n🔌 API確認:')
  for (const endpoint of API_ENDPOINTS) {
    const result = await checkUrl(baseUrl + endpoint)
    results.apis.push(result)
    console.log(`  ${result.ok ? '✅' : '❌'} ${endpoint} - ${result.status || result.error}`)
  }
  
  // サマリー計算
  const allResults = [...results.pages, ...results.apis]
  results.summary.total = allResults.length
  results.summary.success = allResults.filter(r => r.ok).length
  results.summary.failed = allResults.filter(r => !r.ok).length
  results.summary.successRate = (results.summary.success / results.summary.total) * 100
  
  return results
}

async function main() {
  console.log('🚀 本番環境検証スクリプト v1.0')
  console.log('=' .repeat(60))
  
  const vercelResults = await verifyEnvironment('Vercel', VERCEL_URL)
  const railwayResults = await verifyEnvironment('Railway', RAILWAY_URL)
  
  // 総合レポート
  console.log('\n' + '='.repeat(60))
  console.log('📊 検証結果サマリー')
  console.log('='.repeat(60))
  
  console.log(`\n🔷 Vercel: ${vercelResults.summary.successRate.toFixed(1)}% (${vercelResults.summary.success}/${vercelResults.summary.total})`)
  console.log(`🔶 Railway: ${railwayResults.summary.successRate.toFixed(1)}% (${railwayResults.summary.success}/${railwayResults.summary.total})`)
  
  const totalChecks = vercelResults.summary.total + railwayResults.summary.total
  const totalSuccess = vercelResults.summary.success + railwayResults.summary.success
  const overallRate = (totalSuccess / totalChecks) * 100
  
  console.log(`\n📈 全体成功率: ${overallRate.toFixed(1)}%`)
  
  // ギャップ分析
  console.log('\n🎯 報告 vs 現実:')
  console.log(`  報告: "100% 完成・全機能動作"`)
  console.log(`  現実: "${overallRate.toFixed(1)}% 動作中"`)
  console.log(`  ギャップ: ${(100 - overallRate).toFixed(1)}%`)
  
  // 問題のあるエンドポイント
  console.log('\n❌ 問題のあるエンドポイント:')
  
  const allFailures = [
    ...vercelResults.pages.filter(r => !r.ok).map(r => ({ env: 'Vercel', ...r })),
    ...vercelResults.apis.filter(r => !r.ok).map(r => ({ env: 'Vercel', ...r })),
    ...railwayResults.pages.filter(r => !r.ok).map(r => ({ env: 'Railway', ...r })),
    ...railwayResults.apis.filter(r => !r.ok).map(r => ({ env: 'Railway', ...r }))
  ]
  
  allFailures.forEach(failure => {
    const path = failure.url.replace(failure.env === 'Vercel' ? VERCEL_URL : RAILWAY_URL, '')
    console.log(`  [${failure.env}] ${path}: ${failure.error || `HTTP ${failure.status}`}`)
  })
  
  // 結果をファイルに保存
  const fs = require('fs')
  const path = require('path')
  const resultsDir = path.join(__dirname, '..', 'ai-org', 'verification-results')
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }
  
  const filename = `verify-${Date.now()}.json`
  const filepath = path.join(resultsDir, filename)
  
  fs.writeFileSync(filepath, JSON.stringify({
    vercel: vercelResults,
    railway: railwayResults,
    overall: {
      successRate: overallRate,
      gap: 100 - overallRate,
      timestamp: new Date().toISOString()
    }
  }, null, 2))
  
  console.log(`\n📁 詳細結果を保存: ${filepath}`)
  console.log('\n' + '='.repeat(60))
  
  // エラーがある場合は終了コード1
  process.exit(overallRate < 100 ? 1 : 0)
}

// 実行
main().catch(console.error)