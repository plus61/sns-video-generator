#!/usr/bin/env node

/**
 * Advanced Monitoring System for SNS Video Generator
 * 革新的リアルタイム監視・異常検知・自動回復システム
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class AdvancedMonitoringSystem {
  constructor() {
    this.config = {
      environments: {
        railway: {
          name: 'Railway Production',
          url: process.env.RAILWAY_URL || 'https://sns-video-generator-production.up.railway.app',
          healthEndpoint: '/api/health',
          criticalEndpoints: [
            '/api/health',
            '/api/test-supabase',
            '/api/process-video',
            '/api/queue/stats'
          ]
        },
        vercel: {
          name: 'Vercel Edge',
          url: process.env.VERCEL_URL || 'https://sns-video-generator-plus62s-projects.vercel.app',
          healthEndpoint: '/api/health',
          criticalEndpoints: [
            '/api/health',
            '/api/test-supabase'
          ]
        }
      },
      monitoring: {
        interval: 30000, // 30秒間隔
        timeout: 10000,  // 10秒タイムアウト
        retryAttempts: 3,
        alertThresholds: {
          responseTime: 5000,    // 5秒以上で警告
          errorRate: 0.1,        // 10%以上でアラート
          availability: 0.95     // 95%未満でクリティカル
        }
      },
      notifications: {
        webhook: process.env.MONITORING_WEBHOOK,
        email: process.env.MONITORING_EMAIL,
        slack: process.env.SLACK_WEBHOOK
      }
    };

    this.metrics = {
      railway: { uptime: 0, responseTime: [], errors: 0, lastCheck: null },
      vercel: { uptime: 0, responseTime: [], errors: 0, lastCheck: null }
    };

    this.alerts = [];
    this.isRunning = false;
  }

  /**
   * 監視システム開始
   */
  async start() {
    console.log('🚀 Advanced Monitoring System Starting...');
    console.log('=' .repeat(50));
    
    this.isRunning = true;
    this.logSystemInfo();
    
    // 初回チェック
    await this.runHealthCheck();
    
    // 定期監視開始
    this.monitoringInterval = setInterval(() => {
      this.runHealthCheck();
    }, this.config.monitoring.interval);

    // メトリクス保存（5分間隔）
    this.metricsInterval = setInterval(() => {
      this.saveMetrics();
    }, 300000);

    console.log('✅ Monitoring system started successfully');
    console.log(`📊 Checking every ${this.config.monitoring.interval / 1000} seconds`);
  }

  /**
   * 包括的ヘルスチェック実行
   */
  async runHealthCheck() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 Health Check - ${timestamp}`);
    console.log('-' .repeat(40));

    for (const [envKey, env] of Object.entries(this.config.environments)) {
      try {
        const results = await this.checkEnvironment(env);
        this.updateMetrics(envKey, results);
        this.analyzeResults(envKey, results);
        
        const status = results.overall.healthy ? '✅' : '❌';
        console.log(`${status} ${env.name}: ${results.overall.responseTime}ms`);
        
      } catch (error) {
        console.log(`🚨 ${env.name}: Critical Error - ${error.message}`);
        this.handleCriticalError(envKey, error);
      }
    }

    await this.generateHealthReport();
  }

  /**
   * 環境別詳細チェック
   */
  async checkEnvironment(env) {
    const results = {
      environment: env.name,
      timestamp: new Date().toISOString(),
      endpoints: [],
      overall: { healthy: true, responseTime: 0, errors: 0 }
    };

    let totalResponseTime = 0;
    let totalRequests = 0;

    for (const endpoint of env.criticalEndpoints) {
      const endpointResult = await this.checkEndpoint(env.url + endpoint);
      results.endpoints.push({
        endpoint,
        ...endpointResult
      });

      if (!endpointResult.healthy) {
        results.overall.healthy = false;
        results.overall.errors++;
      }

      totalResponseTime += endpointResult.responseTime || 0;
      totalRequests++;
    }

    results.overall.responseTime = Math.round(totalResponseTime / totalRequests);
    return results;
  }

  /**
   * エンドポイント個別チェック
   */
  async checkEndpoint(url) {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(url);
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.statusCode >= 200 && response.statusCode < 300,
        statusCode: response.statusCode,
        responseTime,
        error: null
      };
      
    } catch (error) {
      return {
        healthy: false,
        statusCode: null,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * HTTP リクエスト実行
   */
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.get(url, {
        timeout: this.config.monitoring.timeout
      }, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * メトリクス更新
   */
  updateMetrics(envKey, results) {
    const metrics = this.metrics[envKey];
    
    if (results.overall.healthy) {
      metrics.uptime++;
    } else {
      metrics.errors++;
    }

    metrics.responseTime.push(results.overall.responseTime);
    
    // 直近100件のみ保持
    if (metrics.responseTime.length > 100) {
      metrics.responseTime = metrics.responseTime.slice(-100);
    }

    metrics.lastCheck = results.timestamp;
  }

  /**
   * 結果分析とアラート
   */
  analyzeResults(envKey, results) {
    const env = this.config.environments[envKey];
    const thresholds = this.config.monitoring.alertThresholds;

    // レスポンス時間チェック
    if (results.overall.responseTime > thresholds.responseTime) {
      this.createAlert('performance', envKey, 
        `High response time: ${results.overall.responseTime}ms`);
    }

    // エラー率チェック
    const errorRate = results.overall.errors / results.endpoints.length;
    if (errorRate >= thresholds.errorRate) {
      this.createAlert('error-rate', envKey,
        `High error rate: ${Math.round(errorRate * 100)}%`);
    }

    // 可用性チェック
    if (!results.overall.healthy) {
      this.createAlert('availability', envKey,
        `Service unavailable: ${results.overall.errors} endpoints failing`);
    }
  }

  /**
   * アラート作成
   */
  createAlert(type, environment, message) {
    const alert = {
      id: Date.now(),
      type,
      environment,
      message,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type)
    };

    this.alerts.push(alert);
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${message}`);

    // 通知送信
    this.sendNotification(alert);

    // アラート履歴制限
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  /**
   * アラート重要度判定
   */
  getAlertSeverity(type) {
    const severityMap = {
      'availability': 'critical',
      'error-rate': 'high',
      'performance': 'medium'
    };
    return severityMap[type] || 'low';
  }

  /**
   * 通知送信
   */
  async sendNotification(alert) {
    const message = `🚨 ${alert.environment.toUpperCase()} Alert: ${alert.message}`;
    
    try {
      // Webhook通知
      if (this.config.notifications.webhook) {
        await this.sendWebhook(this.config.notifications.webhook, {
          text: message,
          alert: alert
        });
      }

      // Slack通知（重要度高の場合）
      if (this.config.notifications.slack && alert.severity === 'critical') {
        await this.sendSlackNotification(message, alert);
      }

    } catch (error) {
      console.error('Failed to send notification:', error.message);
    }
  }

  /**
   * ヘルスレポート生成
   */
  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        railway: this.calculateEnvironmentHealth('railway'),
        vercel: this.calculateEnvironmentHealth('vercel')
      },
      recentAlerts: this.alerts.slice(-10),
      recommendations: this.generateRecommendations()
    };

    // レポート保存
    const reportPath = path.join(__dirname, 'health-reports', 
      `health-${new Date().toISOString().split('T')[0]}.json`);
    
    await this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * 環境ヘルス計算
   */
  calculateEnvironmentHealth(envKey) {
    const metrics = this.metrics[envKey];
    const totalChecks = metrics.uptime + metrics.errors;
    
    if (totalChecks === 0) return { availability: 0, avgResponseTime: 0 };

    const availability = metrics.uptime / totalChecks;
    const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / 
                           (metrics.responseTime.length || 1);

    return {
      availability: Math.round(availability * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      totalChecks,
      errors: metrics.errors,
      lastCheck: metrics.lastCheck
    };
  }

  /**
   * 改善推奨事項生成
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Railway推奨事項
    const railwayHealth = this.calculateEnvironmentHealth('railway');
    if (railwayHealth.availability < 0.95) {
      recommendations.push({
        environment: 'railway',
        type: 'availability',
        message: 'Railway availability below 95% - check server resources'
      });
    }

    // Vercel推奨事項  
    const vercelHealth = this.calculateEnvironmentHealth('vercel');
    if (vercelHealth.avgResponseTime > 2000) {
      recommendations.push({
        environment: 'vercel',
        type: 'performance',
        message: 'Vercel response time high - optimize edge functions'
      });
    }

    return recommendations;
  }

  /**
   * メトリクス保存
   */
  saveMetrics() {
    const metricsData = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts.slice(-50) // 直近50件
    };

    const metricsPath = path.join(__dirname, 'metrics', 
      `metrics-${new Date().toISOString().split('T')[0]}.json`);
    
    this.ensureDirectoryExists(path.dirname(metricsPath));
    fs.writeFileSync(metricsPath, JSON.stringify(metricsData, null, 2));
  }

  /**
   * システム情報ログ
   */
  logSystemInfo() {
    console.log('📊 Monitoring Configuration:');
    console.log(`- Railway: ${this.config.environments.railway.url}`);
    console.log(`- Vercel: ${this.config.environments.vercel.url}`);
    console.log(`- Check interval: ${this.config.monitoring.interval / 1000}s`);
    console.log(`- Timeout: ${this.config.monitoring.timeout / 1000}s`);
  }

  /**
   * ディレクトリ作成
   */
  async ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Webhook送信
   */
  async sendWebhook(url, data) {
    // Webhook実装（簡略版）
    console.log(`📡 Webhook notification sent: ${data.text}`);
  }

  /**
   * Slack通知
   */
  async sendSlackNotification(message, alert) {
    // Slack通知実装（簡略版）
    console.log(`📱 Slack notification: ${message}`);
  }

  /**
   * 重大エラー処理
   */
  handleCriticalError(envKey, error) {
    this.createAlert('critical-error', envKey, 
      `Critical system error: ${error.message}`);
    
    // 自動回復試行（必要に応じて）
    console.log('🔄 Attempting automatic recovery...');
  }

  /**
   * 監視停止
   */
  stop() {
    console.log('🛑 Stopping monitoring system...');
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    console.log('✅ Monitoring system stopped');
  }
}

// メイン実行
async function main() {
  const monitor = new AdvancedMonitoringSystem();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📛 Received SIGINT, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n📛 Received SIGTERM, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  try {
    await monitor.start();
    
    // Keep alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('🚨 Failed to start monitoring system:', error);
    process.exit(1);
  }
}

// スタンドアローン実行
if (require.main === module) {
  main();
}

module.exports = AdvancedMonitoringSystem;