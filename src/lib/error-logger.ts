// 基本的なエラーログ収集
export class ErrorLogger {
  private errors: Array<{
    timestamp: Date
    message: string
    stack?: string
    context?: any
  }> = []

  // エラーログ記録
  logError(error: Error | string, context?: any) {
    this.errors.push({
      timestamp: new Date(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context
    })
    
    // コンソールにも出力（開発中）
    console.error('[ErrorLogger]', error, context)
  }

  // 致命的エラーチェック
  hasCriticalErrors(): boolean {
    return this.errors.some(e => 
      e.message.includes('CRITICAL') || 
      e.message.includes('FATAL') ||
      e.message.includes('データ損失')
    )
  }

  // 最近のエラー取得
  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit)
  }

  // エラー統計
  getStats() {
    return {
      total: this.errors.length,
      critical: this.errors.filter(e => 
        e.message.includes('CRITICAL') || e.message.includes('FATAL')
      ).length,
      recent24h: this.errors.filter(e => 
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    }
  }
}