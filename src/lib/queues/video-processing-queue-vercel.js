// Mock Queue implementation for Vercel serverless environment

class MockQueue {
  constructor(name, options) {
    this.name = name
    this.jobs = new Map()
    console.log(`📝 MockQueue created: ${name}`)
  }

  async add(jobType, data, options) {
    const jobId = Math.random().toString(36).substr(2, 9)
    const job = {
      id: jobId,
      type: jobType,
      data,
      status: 'waiting',
      createdAt: new Date()
    }
    
    this.jobs.set(jobId, job)
    console.log(`📝 Mock job added: ${jobId}`)
    
    // Simulate immediate processing in serverless
    setTimeout(() => this.processJob(job), 100)
    
    return { id: jobId, data }
  }

  async processJob(job) {
    console.log(`📝 Mock processing job: ${job.id}`)
    job.status = 'completed'
    job.completedAt = new Date()
  }

  async getJob(id) {
    return this.jobs.get(id) || null
  }

  async getJobCounts() {
    const jobs = Array.from(this.jobs.values())
    return {
      waiting: jobs.filter(j => j.status === 'waiting').length,
      active: jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    }
  }

  async getWaiting() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'waiting')
  }

  async getActive() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'active')
  }

  async getCompleted() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'completed')
  }

  async getFailed() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'failed')
  }

  async close() {
    console.log(`📝 MockQueue closed: ${this.name}`)
    this.jobs.clear()
  }

  on(event, handler) {
    console.log(`📝 MockQueue event listener: ${event}`)
  }
}

class MockWorker {
  constructor(queueName, processor, options) {
    this.queueName = queueName
    this.processor = processor
    console.log(`👷 MockWorker created: ${queueName}`)
  }

  on(event, handler) {
    console.log(`👷 MockWorker event listener: ${event}`)
  }

  async close() {
    console.log(`👷 MockWorker closed: ${this.queueName}`)
  }
}

class MockJob {
  constructor(id, data) {
    this.id = id
    this.data = data
  }
  
  async updateProgress(progress) {
    console.log(`📝 MockJob ${this.id} progress: ${progress}%`)
  }
}

const mockRedis = {
  async disconnect() {
    console.log('📝 MockRedis disconnected')
  }
}

module.exports = {
  MockQueue,
  MockWorker,
  MockJob,
  mockRedis
}