// Universal queue wrapper for cross-platform compatibility
// Automatically selects appropriate implementation based on environment

// Environment detection
const isVercel = process.env.VERCEL === '1' || process.env.DISABLE_BULLMQ === 'true'
const isRailway = !!process.env.REDIS_URL && !isVercel

// Dynamic imports based on environment
let QueueImpl: any
let WorkerImpl: any  
let RedisImpl: any

if (isVercel) {
  // Vercel: Use mock implementations
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

// Queue configuration
export const getQueueConfig = () => {
  if (isVercel) {
    return {
      connection: null, // No Redis connection needed for mock
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 1 // Reduced for Vercel
      }
    }
  } else {
    // Railway configuration
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
      lazyConnect: true,
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
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    }
  }
}

// Environment info logging
console.log(`🔧 Queue Wrapper Environment:`)
console.log(`   Platform: ${isVercel ? 'Vercel' : isRailway ? 'Railway' : 'Local'}`)
console.log(`   VERCEL: ${process.env.VERCEL}`)
console.log(`   DISABLE_BULLMQ: ${process.env.DISABLE_BULLMQ}`)
console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'Set' : 'Not set'}`)
console.log(`   Implementation: ${isVercel ? 'Mock Queue' : 'BullMQ'}`)

export { isVercel, isRailway }