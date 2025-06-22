// シンプルなパフォーマンス監視
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  // レスポンス時間測定
  measureResponse(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    this.metrics.get(operation)!.push(duration)
  }

  // 平均レスポンス時間取得
  getAverageResponse(operation: string): number {
    const times = this.metrics.get(operation) || []
    if (times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  // 3秒以内チェック
  isAcceptableSpeed(operation: string): boolean {
    return this.getAverageResponse(operation) < 3000
  }

  // 簡易レポート
  getReport() {
    const report: Record<string, any> = {}
    this.metrics.forEach((times, operation) => {
      report[operation] = {
        average: Math.round(this.getAverageResponse(operation)),
        count: times.length,
        acceptable: this.isAcceptableSpeed(operation)
      }
    })
    return report
  }
}