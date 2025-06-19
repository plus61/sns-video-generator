// 公式BullMQドキュメント準拠の最適化設定
// https://docs.bullmq.io/guide/going-to-production

import { ConnectionOptions, JobOptions } from 'bullmq'
import { errorReporter } from './error-reporting'

// ジョブタイプ別の設定
export interface JobTypeConfig {
  attempts: number
  backoff: {
    type: 'exponential' | 'fixed'
    delay: number
  }
  delay?: number
  priority?: number
  removeOnComplete?: boolean | number
  removeOnFail?: boolean | number
  jobId?: string
}

// ジョブタイプ定義
export enum JobType {
  VIDEO_PROCESSING = 'video-processing',
  THUMBNAIL_GENERATION = 'thumbnail-generation', 
  AI_ANALYSIS = 'ai-analysis',
  FILE_UPLOAD = 'file-upload',
  WEBHOOK_DELIVERY = 'webhook-delivery',
  CLEANUP = 'cleanup'
}

// 失敗理由分類
export enum FailureReason {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  INVALID_INPUT = 'invalid_input',
  RESOURCE_EXHAUSTED = 'resource_exhausted',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN = 'unknown'
}

// ジョブタイプ別設定
const jobTypeConfigs: Record<JobType, JobTypeConfig> = {
  [JobType.VIDEO_PROCESSING]: {
    attempts: 5, // 動画処理は重要なので多めに試行
    backoff: {
      type: 'exponential',
      delay: 10000 // 10秒から開始
    },
    priority: 10, // 高優先度
    removeOnComplete: 10,
    removeOnFail: 20
  },
  [JobType.THUMBNAIL_GENERATION]: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    priority: 5,
    removeOnComplete: 20,
    removeOnFail: 10
  },
  [JobType.AI_ANALYSIS]: {
    attempts: 4, // AI分析は時間がかかるが重要
    backoff: {
      type: 'exponential',
      delay: 15000 // 15秒から開始（AI APIのレート制限考慮）
    },
    priority: 8,
    removeOnComplete: 5,
    removeOnFail: 15
  },
  [JobType.FILE_UPLOAD]: {
    attempts: 5, // ファイルアップロードは再試行が有効
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    priority: 3,
    removeOnComplete: 50,
    removeOnFail: 20
  },
  [JobType.WEBHOOK_DELIVERY]: {
    attempts: 10, // Webhookは確実に届けたい
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    priority: 1, // 低優先度（重要度は高いが緊急性は低い）
    removeOnComplete: 100,
    removeOnFail: 50
  },
  [JobType.CLEANUP]: {
    attempts: 2, // クリーンアップは軽い処理
    backoff: {
      type: 'fixed',
      delay: 30000 // 30秒後に再試行
    },
    priority: 1,
    removeOnComplete: 5,
    removeOnFail: 5
  }
}

// 失敗理由に基づく再試行判定
export const shouldRetryBasedOnError = (error: Error, attemptsMade: number, maxAttempts: number): boolean => {
  const failureReason = classifyFailure(error)
  
  // 試行回数が上限に達している場合は再試行しない
  if (attemptsMade >= maxAttempts) {
    return false
  }
  
  // 失敗理由に基づく判定
  switch (failureReason) {
    case FailureReason.NETWORK_ERROR:
    case FailureReason.TIMEOUT:
    case FailureReason.RESOURCE_EXHAUSTED:
    case FailureReason.EXTERNAL_SERVICE_ERROR:
      return true // 再試行価値あり
      
    case FailureReason.INVALID_INPUT:
    case FailureReason.VALIDATION_ERROR:
    case FailureReason.AUTHENTICATION_ERROR:
      return false // 再試行しても同じ結果
      
    case FailureReason.UNKNOWN:
    default:
      return attemptsMade < Math.floor(maxAttempts / 2) // 半分まで再試行
  }
}

// 失敗理由の分類
export const classifyFailure = (error: Error): FailureReason => {
  const message = error.message.toLowerCase()
  
  // ネットワークエラー
  if (message.includes('network') || 
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('timeout')) {
    return FailureReason.NETWORK_ERROR
  }
  
  // タイムアウト
  if (message.includes('timeout') || 
      message.includes('timed out')) {
    return FailureReason.TIMEOUT
  }
  
  // 入力検証エラー
  if (message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('malformed') ||
      message.includes('format')) {
    return FailureReason.INVALID_INPUT
  }
  
  // リソース不足
  if (message.includes('memory') ||
      message.includes('disk') ||
      message.includes('quota') ||
      message.includes('limit')) {
    return FailureReason.RESOURCE_EXHAUSTED
  }
  
  // 認証エラー
  if (message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('authentication') ||
      message.includes('401') ||
      message.includes('403')) {
    return FailureReason.AUTHENTICATION_ERROR
  }
  
  // 外部サービスエラー
  if (message.includes('api') ||
      message.includes('service') ||
      message.includes('server') ||
      message.includes('50') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')) {
    return FailureReason.EXTERNAL_SERVICE_ERROR
  }
  
  return FailureReason.UNKNOWN
}

// ジョブオプション生成
export const generateJobOptions = (jobType: JobType, customOptions: Partial<JobOptions> = {}): JobOptions => {
  const config = jobTypeConfigs[jobType]
  
  return {
    ...config,
    ...customOptions,
    // カスタムbackoff関数（公式ドキュメント準拠）
    backoff: (attemptsMade: number, type: string, err?: Error, job?: any) => {
      const baseDelay = config.backoff.delay
      
      if (err && !shouldRetryBasedOnError(err, attemptsMade, config.attempts)) {
        // 再試行しない場合はJobを即座に失敗させる
        throw new Error(`Non-retryable error: ${err.message}`)
      }
      
      // 失敗理由に基づく遅延調整
      const failureReason = err ? classifyFailure(err) : FailureReason.UNKNOWN
      let multiplier = 1
      
      switch (failureReason) {
        case FailureReason.NETWORK_ERROR:
          multiplier = 1.5 // ネットワークエラーは少し長めに待機
          break
        case FailureReason.EXTERNAL_SERVICE_ERROR:
          multiplier = 2.0 // 外部サービスエラーはさらに長めに待機
          break
        case FailureReason.RESOURCE_EXHAUSTED:
          multiplier = 3.0 // リソース不足は大幅に待機
          break
        default:
          multiplier = 1.0
      }
      
      // 指数バックオフまたは固定遅延
      let delay: number
      if (config.backoff.type === 'exponential') {
        delay = Math.min(
          baseDelay * Math.pow(2, attemptsMade - 1) * multiplier,
          300000 // 最大5分
        )
      } else {
        delay = baseDelay * multiplier
      }
      
      // ジッター追加（公式推奨）
      const jitter = Math.random() * 0.1 * delay
      delay += jitter
      
      // ログ記録
      console.log(`🔄 Job retry scheduled: attempt ${attemptsMade}/${config.attempts}, delay: ${Math.round(delay)}ms, reason: ${failureReason}`)
      
      // エラーレポート（統計用）
      if (err) {
        errorReporter.reportError(err, {
          category: 'job_retry',
          context: {
            jobType,
            attemptsMade,
            maxAttempts: config.attempts,
            failureReason,
            delay: Math.round(delay),
            jobId: job?.id
          }
        })
      }
      
      return delay
    }
  }
}

// 本番環境用Redis接続設定（公式ドキュメント準拠 + Boss1最適化）
export const getProductionRedisConfig = (): ConnectionOptions => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // BullMQ必須設定
    maxRetriesPerRequest: null,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxLoadingTimeout: 5000,
    lazyConnect: true,
    enableOfflineQueue: true,
    
    // 接続タイムアウト設定
    connectTimeout: 10000,
    commandTimeout: 5000,
    
    // 接続プール最適化（Boss1指示）
    family: 4, // IPv4
    keepAlive: true,
    
    // 革命的再接続戦略（指数関数的バックオフ）
    retryStrategy: (times: number) => {
      const delay = Math.max(Math.min(Math.exp(times), 20000), 1000)
      console.log(`🔄 Redis reconnection attempt ${times}, delay: ${delay}ms`)
      return delay
    },
    
    // メモリ使用量最適化
    dropBufferSupport: true,
    
    // セキュリティ設定
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    
    // デッドロック検出
    showFriendlyErrorStack: process.env.NODE_ENV === 'development'
  }
}

// デッドレターキュー設定
export const setupDeadLetterQueue = (queueName: string) => {
  const dlqName = `${queueName}-dlq`
  console.log(`💀 Setting up Dead Letter Queue: ${dlqName}`)
  
  // デッドレターキューの処理ロジック
  const handleDeadLetter = async (job: any) => {
    console.error(`💀 Job moved to DLQ: ${job.id}`, {
      jobType: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn
    })
    
    // 重要なジョブの場合は管理者に通知
    if (job.data?.priority === 'critical') {
      await errorReporter.reportError(new Error(`Critical job failed: ${job.id}`), {
        category: 'dead_letter_queue',
        severity: 'critical',
        context: {
          jobId: job.id,
          jobType: job.name,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade
        }
      })
    }
  }
  
  return { dlqName, handleDeadLetter }
}

// ヘルス監視設定
export const getHealthCheckConfig = () => {
  return {
    interval: 30000, // 30秒間隔
    checks: {
      redis: true,
      queue: true,
      worker: true,
      memory: true
    },
    thresholds: {
      maxMemoryUsage: 0.9, // 90%
      maxQueueSize: 1000,
      maxProcessingTime: 300000 // 5分
    }
  }
}

// 動的concurrency管理
export class AdaptiveConcurrencyManager {
  private currentConcurrency = parseInt(process.env.QUEUE_CONCURRENCY || '3')
  private maxConcurrency = parseInt(process.env.QUEUE_MAX_CONCURRENCY || '10')
  private metrics = {
    avgProcessingTime: 0,
    queueLength: 0,
    errorRate: 0,
    throughput: 0
  }

  updateMetrics(newMetrics: Partial<typeof this.metrics>) {
    this.metrics = { ...this.metrics, ...newMetrics }
  }

  adjustConcurrency(): number {
    const { queueLength, avgProcessingTime, errorRate, throughput } = this.metrics
    
    // 革命的アルゴリズム：多次元最適化
    if (queueLength > 20 && avgProcessingTime < 30000 && errorRate < 0.1 && throughput > 5) {
      // 高負荷だが高性能 → 並列度アップ
      this.currentConcurrency = Math.min(this.maxConcurrency, this.currentConcurrency + 2)
      console.log(`📈 Concurrency increased to ${this.currentConcurrency}`)
    } else if (errorRate > 0.2 || avgProcessingTime > 60000 || throughput < 2) {
      // エラー多発または低性能 → 並列度ダウン
      this.currentConcurrency = Math.max(1, this.currentConcurrency - 1)
      console.log(`📉 Concurrency decreased to ${this.currentConcurrency}`)
    } else if (queueLength < 5 && errorRate < 0.05 && avgProcessingTime < 15000) {
      // 低負荷かつ高性能 → 微調整
      this.currentConcurrency = Math.min(this.maxConcurrency, this.currentConcurrency + 1)
      console.log(`🔧 Concurrency fine-tuned to ${this.currentConcurrency}`)
    }
    
    return this.currentConcurrency
  }
}

// 共有接続プール（Boss1推奨）
class RedisConnectionPool {
  private static instance: RedisConnectionPool
  private connections: Map<string, any> = new Map()
  
  static getInstance(): RedisConnectionPool {
    if (!RedisConnectionPool.instance) {
      RedisConnectionPool.instance = new RedisConnectionPool()
    }
    return RedisConnectionPool.instance
  }
  
  getConnection(key: string = 'default') {
    if (!this.connections.has(key)) {
      const Redis = require('ioredis')
      const connection = new Redis(getProductionRedisConfig())
      this.connections.set(key, connection)
      console.log(`🔌 Created Redis connection pool: ${key}`)
    }
    return this.connections.get(key)
  }
  
  async closeAll() {
    for (const [key, connection] of this.connections) {
      await connection.quit()
      console.log(`🔌 Closed Redis connection: ${key}`)
    }
    this.connections.clear()
  }
}

export const redisPool = RedisConnectionPool.getInstance()
export const concurrencyManager = new AdaptiveConcurrencyManager()
export { jobTypeConfigs }