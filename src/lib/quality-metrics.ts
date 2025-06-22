// 基本的な品質メトリクス収集
export class QualityMetrics {
  private featureStatus: Map<string, boolean> = new Map()
  private criticalBugs = 0
  private userSessions = 0

  // 機能の動作状況記録
  recordFeatureStatus(feature: string, working: boolean) {
    this.featureStatus.set(feature, working)
  }

  // 主要機能の動作率計算
  getFeatureSuccessRate(): number {
    if (this.featureStatus.size === 0) return 0
    
    const workingCount = Array.from(this.featureStatus.values())
      .filter(status => status).length
    
    return (workingCount / this.featureStatus.size) * 100
  }

  // 致命的バグ記録
  recordCriticalBug() {
    this.criticalBugs++
  }

  // ユーザーセッション記録
  recordUserSession() {
    this.userSessions++
  }

  // 品質レポート生成
  getQualityReport() {
    return {
      featureSuccessRate: Math.round(this.getFeatureSuccessRate()),
      criticalBugs: this.criticalBugs,
      userSessions: this.userSessions,
      healthStatus: this.getHealthStatus()
    }
  }

  // 健全性判定
  private getHealthStatus(): 'good' | 'warning' | 'critical' {
    const successRate = this.getFeatureSuccessRate()
    
    if (this.criticalBugs > 0) return 'critical'
    if (successRate < 90) return 'warning'
    return 'good'
  }
}