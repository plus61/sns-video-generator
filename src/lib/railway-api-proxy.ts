// Railway API Proxy for Vercel to Railway Backend communication

interface ProxyConfig {
  railwayApiUrl: string
  timeout: number
  retryAttempts: number
}

export class RailwayApiProxy {
  private config: ProxyConfig

  constructor() {
    this.config = {
      railwayApiUrl: process.env.RAILWAY_API_URL || process.env.NEXT_PUBLIC_RAILWAY_API_URL || '',
      timeout: 30000, // 30 seconds
      retryAttempts: 2
    }

    if (!this.config.railwayApiUrl) {
      console.warn('⚠️ RAILWAY_API_URL not configured - heavy processing will use local mock')
    } else {
      console.log(`🚀 Railway API Proxy initialized: ${this.config.railwayApiUrl}`)
    }
  }

  /**
   * Forward process-video requests to Railway backend
   */
  async forwardProcessVideo(data: any, headers: Record<string, string> = {}): Promise<any> {
    if (!this.config.railwayApiUrl) {
      console.log('📝 Using local mock processing (Railway API not configured)')
      return this.mockProcessVideo(data)
    }

    const url = `${this.config.railwayApiUrl}/api/process-video`
    
    try {
      console.log(`🔄 Forwarding process-video to Railway: ${url}`)
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Railway-Proxy/1.0',
          ...headers
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ Railway process-video response:`, result)
      
      return result
    } catch (error) {
      console.error('❌ Railway API forward failed:', error)
      
      // Fallback to mock processing
      console.log('🔄 Falling back to mock processing')
      return this.mockProcessVideo(data)
    }
  }

  /**
   * Forward queue stats requests to Railway backend
   */
  async forwardQueueStats(headers: Record<string, string> = {}): Promise<any> {
    if (!this.config.railwayApiUrl) {
      return this.mockQueueStats()
    }

    const url = `${this.config.railwayApiUrl}/api/queue/stats`
    
    try {
      console.log(`📊 Forwarding queue stats to Railway: ${url}`)
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Railway-Proxy/1.0',
          ...headers
        }
      })

      if (!response.ok) {
        throw new Error(`Railway queue stats error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('❌ Railway queue stats failed:', error)
      return this.mockQueueStats()
    }
  }

  /**
   * Check Railway backend health
   */
  async checkRailwayHealth(): Promise<{
    available: boolean
    responseTime?: number
    error?: string
  }> {
    if (!this.config.railwayApiUrl) {
      return { available: false, error: 'Railway API URL not configured' }
    }

    const url = `${this.config.railwayApiUrl}/api/health`
    const startTime = Date.now()
    
    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Vercel-Railway-Proxy/1.0'
        }
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return { available: true, responseTime }
      } else {
        return { 
          available: false, 
          responseTime,
          error: `HTTP ${response.status}` 
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return { 
        available: false, 
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get job status from Railway backend
   */
  async getJobStatus(jobId: string, headers: Record<string, string> = {}): Promise<any> {
    if (!this.config.railwayApiUrl) {
      return this.mockJobStatus(jobId)
    }

    const url = `${this.config.railwayApiUrl}/api/process-video?jobId=${jobId}`
    
    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Railway-Proxy/1.0',
          ...headers
        }
      })

      if (!response.ok) {
        throw new Error(`Railway job status error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Railway job status failed:', error)
      return this.mockJobStatus(jobId)
    }
  }

  // Private helper methods

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  private mockProcessVideo(data: any): any {
    const jobId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`📝 Mock processing video job: ${jobId}`)
    
    return {
      success: true,
      jobId,
      estimatedProcessingTime: 5000, // 5 seconds for mock
      queuePosition: 1,
      message: 'Mock processing started in Vercel environment'
    }
  }

  private mockQueueStats(): any {
    return {
      success: true,
      stats: {
        waiting: 0,
        active: 1,
        completed: 5,
        failed: 0,
        delayed: 0,
        paused: 0,
        total: 6
      },
      performance: {
        averageProcessingTime: 3000,
        throughputPerHour: 12,
        successRate: 100
      },
      resources: {
        concurrency: 1,
        memoryUsage: 45,
        activeWorkers: 1
      },
      recentJobs: [
        {
          id: 'mock-job-1',
          name: 'process-video',
          status: 'completed',
          progress: 100,
          priority: 5,
          createdAt: new Date(Date.now() - 300000).toISOString()
        }
      ]
    }
  }

  private mockJobStatus(jobId: string): any {
    return {
      success: true,
      job: {
        id: jobId,
        status: 'completed',
        progress: 100,
        created_at: new Date(Date.now() - 5000).toISOString(),
        completed_at: new Date().toISOString(),
        processing_time: 3000,
        results: {
          metadata: true,
          thumbnails: 3,
          chunks: 0,
          aiAnalysis: false
        }
      }
    }
  }
}

// Singleton instance
let railwayApiProxy: RailwayApiProxy | null = null

export const getRailwayApiProxy = (): RailwayApiProxy => {
  if (!railwayApiProxy) {
    railwayApiProxy = new RailwayApiProxy()
  }
  return railwayApiProxy
}

// Export default instance
export const railwayApiProxy = getRailwayApiProxy()

// Utility functions
export const forwardToRailway = async (
  endpoint: string,
  data?: any,
  headers?: Record<string, string>
): Promise<any> => {
  const proxy = getRailwayApiProxy()
  
  switch (endpoint) {
    case 'process-video':
      return proxy.forwardProcessVideo(data, headers)
    case 'queue-stats':
      return proxy.forwardQueueStats(headers)
    case 'job-status':
      return proxy.getJobStatus(data.jobId, headers)
    default:
      throw new Error(`Unknown Railway endpoint: ${endpoint}`)
  }
}