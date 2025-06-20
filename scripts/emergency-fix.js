#!/usr/bin/env node
/**
 * 緊急修復スクリプト
 * 75%のギャップを解消するための自動修復
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

class EmergencyFixer {
  constructor() {
    this.issues = []
    this.fixes = []
  }

  async run() {
    console.log('🚨 緊急修復プロセス開始...\n')
    
    // 1. 問題の詳細分析
    await this.analyzeIssues()
    
    // 2. 修正アクションの実行
    await this.applyFixes()
    
    // 3. 結果レポート
    this.generateReport()
  }

  async analyzeIssues() {
    console.log('📋 問題分析中...')
    
    // Railway問題
    this.issues.push({
      severity: 'critical',
      component: 'Railway',
      issue: 'Complete deployment failure (404 on all endpoints)',
      possibleCauses: [
        'Docker build failed',
        'Server not starting',
        'Static files not found',
        'Health check failing'
      ]
    })
    
    // Vercel API問題
    this.issues.push({
      severity: 'high',
      component: 'Vercel',
      issue: 'API routes returning 404',
      possibleCauses: [
        'API routes not built',
        'Next.js configuration issue',
        'Missing environment variables'
      ]
    })
    
    console.log(`\n発見された問題: ${this.issues.length}件`)
  }

  async applyFixes() {
    console.log('\n🔧 修正アクション実行中...\n')
    
    // Fix 1: API routes修正
    console.log('1. API routes確認と修正...')
    const apiDir = path.join(process.cwd(), 'src/app/api')
    
    // health/simple が存在するか確認
    const healthSimplePath = path.join(apiDir, 'health/simple/route.ts')
    if (!fs.existsSync(healthSimplePath)) {
      console.log('  ❌ /api/health/simple が見つかりません')
      this.fixes.push({
        action: 'Create missing API route',
        file: 'src/app/api/health/simple/route.ts',
        status: 'needed'
      })
    }
    
    // Fix 2: Railway設定確認
    console.log('\n2. Railway設定確認...')
    const railwayConfig = {
      dockerfile: fs.existsSync(path.join(process.cwd(), 'Dockerfile')),
      railwayToml: fs.existsSync(path.join(process.cwd(), 'railway.toml')),
      startScript: fs.existsSync(path.join(process.cwd(), 'start-railway.js'))
    }
    
    Object.entries(railwayConfig).forEach(([file, exists]) => {
      console.log(`  ${exists ? '✅' : '❌'} ${file}`)
      if (!exists) {
        this.fixes.push({
          action: `Create missing ${file}`,
          file: file,
          status: 'needed'
        })
      }
    })
    
    // Fix 3: Next.js設定確認
    console.log('\n3. Next.js設定確認...')
    const nextConfig = path.join(process.cwd(), 'next.config.ts')
    if (fs.existsSync(nextConfig)) {
      const content = fs.readFileSync(nextConfig, 'utf8')
      if (!content.includes("output: 'standalone'")) {
        console.log('  ⚠️  standalone出力が設定されていません')
        this.fixes.push({
          action: 'Add standalone output to next.config.ts',
          file: 'next.config.ts',
          status: 'needed'
        })
      }
    }
    
    // Fix 4: 環境変数確認
    console.log('\n4. 環境変数確認...')
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])
    if (missingEnvVars.length > 0) {
      console.log(`  ⚠️  ${missingEnvVars.length}個の環境変数が未設定`)
      this.fixes.push({
        action: 'Configure missing environment variables',
        details: missingEnvVars,
        status: 'needed'
      })
    }
    
    // Fix 5: ビルド確認
    console.log('\n5. ビルド状態確認...')
    const buildExists = fs.existsSync(path.join(process.cwd(), '.next'))
    if (!buildExists) {
      console.log('  ❌ ビルドが存在しません')
      this.fixes.push({
        action: 'Run build process',
        command: 'npm run build',
        status: 'needed'
      })
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 緊急修復レポート')
    console.log('='.repeat(60))
    
    console.log('\n🔍 発見された問題:')
    this.issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.component}`)
      console.log(`   問題: ${issue.issue}`)
      console.log('   考えられる原因:')
      issue.possibleCauses.forEach(cause => {
        console.log(`   - ${cause}`)
      })
    })
    
    console.log('\n🔧 必要な修正アクション:')
    const neededFixes = this.fixes.filter(f => f.status === 'needed')
    neededFixes.forEach((fix, i) => {
      console.log(`\n${i + 1}. ${fix.action}`)
      if (fix.file) console.log(`   ファイル: ${fix.file}`)
      if (fix.command) console.log(`   コマンド: ${fix.command}`)
      if (fix.details) console.log(`   詳細: ${JSON.stringify(fix.details)}`)
    })
    
    console.log('\n📝 推奨される次のステップ:')
    console.log('1. 上記の修正アクションを実行')
    console.log('2. ローカルでビルドとテストを実行')
    console.log('3. 修正をコミットしてプッシュ')
    console.log('4. デプロイメントの監視')
    console.log('5. 再度検証スクリプトを実行')
    
    // レポートをファイルに保存
    const reportPath = path.join(process.cwd(), 'ai-org', 'emergency-fix-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      issues: this.issues,
      fixes: this.fixes,
      status: 'analysis_complete'
    }, null, 2))
    
    console.log(`\n📁 詳細レポート保存: ${reportPath}`)
    console.log('\n' + '='.repeat(60))
  }
}

// 実行
const fixer = new EmergencyFixer()
fixer.run().catch(console.error)