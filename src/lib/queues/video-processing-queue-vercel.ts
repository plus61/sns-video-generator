// Vercel-compatible video processing queue (mock implementation)
// This file provides a Redis-free implementation for Vercel environment

interface MockJob {
  id: string
  data: any
  progress: number
  timestamp: number
  status: 'waiting' | 'active' | 'completed' | 'failed'
  attempts: number
  error?: string
  result?: any
}

interface MockJobCounts {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

class MockQueue {
  private jobs: Map<string, MockJob> = new Map()
  private listeners: Map<string, Function[]> = new Map()

  constructor(private name: string) {
    console.log(`📝 MockQueue initialized for Vercel: ${name}`)
  }

  async add(jobName: string, data: any, options: any = {}): Promise<MockJob> {
    const jobId = options.jobId || `mock-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const job: MockJob = {
      id: jobId,
      data,
      progress: 0,
      timestamp: Date.now(),
      status: 'waiting',
      attempts: 0
    }

    this.jobs.set(jobId, job)
    
    console.log(`📋 Mock job added: ${jobId}`)
    this.emit('waiting', jobId)

    // Simulate immediate processing in Vercel (no Redis queue)
    setTimeout(() => this.processJob(job), 100)

    return job
  }

  private async processJob(job: MockJob) {
    try {
      job.status = 'active'
      job.attempts++
      this.emit('active', job)
      
      console.log(`🔄 Mock processing job: ${job.id}`)
      
      // Simulate processing with progress updates
      for (let progress = 10; progress <= 100; progress += 10) {
        job.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Mock successful result
      job.result = {
        success: true,
        processingTime: 1000,
        metadata: {
          width: 1920,
          height: 1080,
          duration: 60,
          format: 'mp4'
        },
        thumbnails: [
          { index: 0, timestamp: 10, size: 1024 },
          { index: 1, timestamp: 30, size: 1024 },
          { index: 2, timestamp: 50, size: 1024 }
        ],
        message: 'Mock processing completed in Vercel environment'
      }

      job.status = 'completed'
      this.emit('completed', job, job.result)
      
      console.log(`✅ Mock job completed: ${job.id}`)
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Mock processing failed'
      this.emit('failed', job, new Error(job.error))
      
      console.error(`❌ Mock job failed: ${job.id}`, error)
    }
  }

  async getJob(jobId: string): Promise<MockJob | null> {
    return this.jobs.get(jobId) || null
  }

  async getJobCounts(): Promise<MockJobCounts> {
    const jobs = Array.from(this.jobs.values())
    
    return {
      waiting: jobs.filter(j => j.status === 'waiting').length,
      active: jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      delayed: 0,
      paused: 0
    }
  }

  async getWaiting(start = 0, end = -1): Promise<MockJob[]> {
    const waiting = Array.from(this.jobs.values()).filter(j => j.status === 'waiting')
    return end === -1 ? waiting.slice(start) : waiting.slice(start, end + 1)
  }

  async getActive(start = 0, end = -1): Promise<MockJob[]> {
    const active = Array.from(this.jobs.values()).filter(j => j.status === 'active')
    return end === -1 ? active.slice(start) : active.slice(start, end + 1)
  }

  async getCompleted(start = 0, end = -1): Promise<MockJob[]> {
    const completed = Array.from(this.jobs.values()).filter(j => j.status === 'completed')
    return end === -1 ? completed.slice(start) : completed.slice(start, end + 1)
  }

  async getFailed(start = 0, end = -1): Promise<MockJob[]> {
    const failed = Array.from(this.jobs.values()).filter(j => j.status === 'failed')
    return end === -1 ? failed.slice(start) : failed.slice(start, end + 1)
  }

  async pause(): Promise<void> {
    console.log(`⏸️ Mock queue paused: ${this.name}`)
  }

  async resume(): Promise<void> {
    console.log(`▶️ Mock queue resumed: ${this.name}`)
  }

  async clean(grace: number, status: string): Promise<void> {
    const cutoff = Date.now() - grace
    const toRemove = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.timestamp < cutoff && job.status === status)
      .map(([id, _]) => id)
    
    toRemove.forEach(id => this.jobs.delete(id))
    console.log(`🧹 Mock queue cleaned: removed ${toRemove.length} ${status} jobs`)
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in mock queue listener for ${event}:`, error)
      }
    })
  }
}

class MockWorker {
  constructor(
    private queueName: string,
    private processor: Function,
    private options: any = {}
  ) {
    console.log(`👷 MockWorker initialized for Vercel: ${queueName}`)
  }

  on(event: string, listener: Function): void {
    console.log(`📡 MockWorker event listener registered: ${event}`)
  }

  async close(): Promise<void> {
    console.log(`🛑 MockWorker closed: ${this.queueName}`)
  }
}

// Environment detection
const isVercel = process.env.VERCEL === '1' || process.env.DISABLE_BULLMQ === 'true'
const isRailway = !!process.env.REDIS_URL && !isVercel

// Export appropriate implementation based on environment
export const videoProcessingQueue = isVercel 
  ? new MockQueue('video-processing')
  : require('./video-processing-queue').videoProcessingQueue

export const createWorker = (queueName: string, processor: Function, options: any = {}) => {
  if (isVercel) {
    return new MockWorker(queueName, processor, options)
  } else {
    const { Worker } = require('bullmq')
    return new Worker(queueName, processor, options)
  }
}

// Mock Redis for Vercel
export const mockRedis = {
  disconnect: async () => {
    console.log('📱 Mock Redis disconnected (Vercel)')
  }
}

// Environment info
console.log(`🔍 Queue Environment Detection:`)
console.log(`   VERCEL: ${process.env.VERCEL}`)
console.log(`   DISABLE_BULLMQ: ${process.env.DISABLE_BULLMQ}`)
console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'Set' : 'Not set'}`)
console.log(`   Using: ${isVercel ? 'Mock Queue (Vercel)' : 'BullMQ (Railway)'}`)

export default isVercel ? new MockWorker('video-processing', () => {}, {}) : null