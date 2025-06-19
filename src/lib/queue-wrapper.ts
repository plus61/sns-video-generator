// Universal queue wrapper for cross-platform compatibility
// Automatically selects appropriate implementation based on environment

// Environment detection
const isVercel = process.env.VERCEL === '1' || process.env.DISABLE_BULLMQ === 'true'
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.REDIS_URL
const isRailway = !!process.env.REDIS_URL && !isVercel && !isBuildTime

// Dynamic imports based on environment
let QueueImpl: any
let WorkerImpl: any  
let RedisImpl: any

if (isVercel || isBuildTime) {
  // Vercel/Build: Use mock implementations
  const mockModule = require('./queues/video-processing-queue-vercel')
  QueueImpl = mockModule.MockQueue || class MockQueue {
    constructor(name: string) {
      console.log(`📝 Fallback MockQueue: ${name}`)
    }
    async add() { return { id: 'mock', data: {} } }
    async getJob() { return null }
    async getJobCounts() { return { waiting: 0, active: 0, completed: 0, failed: 0 } }
    on() {}
  }
  WorkerImpl = mockModule.MockWorker || class MockWorker {
    constructor() { console.log('👷 Fallback MockWorker') }
    on() {}
    async close() {}
  }
  RedisImpl = mockModule.mockRedis || { disconnect: async () => {} }
} else {
  // Railway/Production: Use real BullMQ only if not in Vercel-like environment
  try {
    if (typeof window === 'undefined' && !process.env.VERCEL && !process.env.USE_MOCK) {
      const bullmq = require('bullmq')
      const ioredis = require('ioredis')
      QueueImpl = bullmq.Queue
      WorkerImpl = bullmq.Worker
      RedisImpl = ioredis.default || ioredis
    } else {
      throw new Error('Using mock implementation for serverless environment')
    }
  } catch (error) {
    console.warn('BullMQ not available, falling back to mock:', error.message)
    // Fallback to mock if BullMQ import fails
    QueueImpl = class MockQueue {
      constructor(name: string) { console.log(`📝 Fallback MockQueue: ${name}`) }
      async add() { return { id: 'mock', data: {} } }
      async getJob() { return null }
      async getJobCounts() { return { waiting: 0, active: 0, completed: 0, failed: 0 } }
      on() {}
    }
    WorkerImpl = class MockWorker {
      constructor() { console.log('👷 Fallback MockWorker') }
      on() {}
      async close() {}
    }
    RedisImpl = { disconnect: async () => {} }
  }
}

// Export unified interface
export const Queue = QueueImpl
export const Worker = WorkerImpl  
export const Redis = RedisImpl

// Export Job type for proper TypeScript support
export type Job<T = any> = {
  id: string | number
  data: T
  progress?: number
  updateProgress(progress: number): Promise<void>
  opts?: any
}

// Mock Job implementation for environments without BullMQ
export class MockJob<T = any> implements Job<T> {
  constructor(
    public id: string | number,
    public data: T,
    public progress?: number,
    public opts?: any
  ) {}

  async updateProgress(progress: number): Promise<void> {
    this.progress = progress
    console.log(`📊 Mock job ${this.id} progress: ${progress}%`)
  }
}

// Queue configuration
export const getQueueConfig = () => {
  if (isVercel || isBuildTime) {
    return {
      connection: null, // No Redis connection needed for mock
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 1 // Reduced for Vercel
      }
    }
  } else {
    // Railway configuration with BullMQ optimizations
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null, // Required by BullMQ
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
      lazyConnect: true,
      // Boss1革命的最適化設定
      retryStrategy: (times: number) => {
        const delay = Math.max(Math.min(Math.exp(times), 20000), 1000)
        console.log(`🔄 Redis retry attempt ${times}, delay: ${delay}ms`)
        return delay
      },
      maxRetriesPerRequest: null, // BullMQ requirement - disable retries
      enableOfflineQueue: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Connection pool optimization（Boss1指示）
      family: 4, // Use IPv4
      keepAlive: true,
      // パフォーマンス設定（IORedis対応）
      // 注: 高度設定は実装環境で調整
    }

    // Parse Railway Redis URL if available
    if (process.env.REDIS_URL) {
      try {
        const redisUrl = new URL(process.env.REDIS_URL)
        redisConfig.host = redisUrl.hostname
        redisConfig.port = parseInt(redisUrl.port || '6379')
        if (redisUrl.password) {
          redisConfig.password = redisUrl.password
        }
      } catch (error) {
        console.warn('Failed to parse REDIS_URL:', error)
      }
    }

    return {
      connection: new RedisImpl(redisConfig),
      defaultJobOptions: {
        removeOnComplete: 100, // 増量（パフォーマンス分析用）
        removeOnFail: 50, // 最適化
        attempts: 5, // Boss1推奨値
        backoff: {
          type: 'exponential',
          delay: 3000, // 高速化
        },
        // 追加の最適化オプション
        priority: 5,
        jobId: undefined, // 自動生成
        repeat: undefined,
        delay: 0
      },
      // 追加のキュー設定
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 1,
        retryProcessDelay: 5000
      }
    }
  }
}

// Environment info logging
console.log(`🔧 Queue Wrapper Environment:`)
console.log(`   Platform: ${isVercel ? 'Vercel' : isRailway ? 'Railway' : isBuildTime ? 'Build' : 'Local'}`)
console.log(`   VERCEL: ${process.env.VERCEL}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`   DISABLE_BULLMQ: ${process.env.DISABLE_BULLMQ}`)
console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'Set' : 'Not set'}`)
console.log(`   Implementation: ${(isVercel || isBuildTime) ? 'Mock Queue' : 'BullMQ'}`)

export { isVercel, isRailway, isBuildTime }