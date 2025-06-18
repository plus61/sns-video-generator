/**
 * Vercel-compatible video processor
 * Avoids FFmpeg binary issues by delegating heavy processing to Railway backend
 */

export interface VideoProcessorConfig {
  environment: 'vercel' | 'railway' | 'development'
  railwayBackendUrl?: string
  maxFileSize: number
  allowedFormats: string[]
}

export interface VideoProcessingJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl: string
  outputUrl?: string
  progress: number
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fileSize: number
  format: string
  frameRate: number
  bitrate: number
  aspectRatio: string
  hasAudio: boolean
  audioCodec?: string
  audioBitrate?: number
}

export class VercelVideoProcessor {
  private config: VideoProcessorConfig
  private railwayApiKey: string

  constructor(config: VideoProcessorConfig) {
    this.config = config
    this.railwayApiKey = process.env.RAILWAY_API_KEY || ''
    
    if (!this.railwayApiKey && config.environment === 'vercel') {
      console.warn('Railway API key not configured for video processing')
    }
  }

  /**
   * Process video by delegating to Railway backend
   */
  async processVideo(
    videoUrl: string,
    options: {
      segments?: Array<{ start: number; end: number }>
      optimize?: boolean
      format?: string
    } = {}
  ): Promise<VideoProcessingJob> {
    if (this.config.environment === 'development') {
      return this.mockVideoProcessing(videoUrl, options)
    }

    const jobId = this.generateJobId()
    
    try {
      // Create processing job on Railway backend
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`,
          'X-Processing-Environment': 'vercel'
        },
        body: JSON.stringify({
          jobId,
          videoUrl,
          options,
          callbackUrl: `${process.env.NEXTAUTH_URL}/api/video-processing/callback`
        })
      })

      if (!response.ok) {
        throw new Error(`Railway backend error: ${response.statusText}`)
      }

      const jobData = await response.json()

      return {
        id: jobId,
        status: 'pending',
        videoUrl,
        progress: 0,
        createdAt: new Date(),
        ...jobData
      }
    } catch (error) {
      console.error('Video processing error:', error)
      
      return {
        id: jobId,
        status: 'failed',
        videoUrl,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date()
      }
    }
  }

  /**
   * Get video metadata without heavy processing
   */
  async getVideoMetadata(videoUrl: string): Promise<VideoMetadata | null> {
    if (this.config.environment === 'development') {
      return this.mockVideoMetadata()
    }

    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`
        },
        body: JSON.stringify({ videoUrl })
      })

      if (!response.ok) {
        throw new Error(`Metadata extraction failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Metadata extraction error:', error)
      return null
    }
  }

  /**
   * Check processing job status
   */
  async getJobStatus(jobId: string): Promise<VideoProcessingJob | null> {
    if (this.config.environment === 'development') {
      return this.mockJobStatus(jobId)
    }

    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.railwayApiKey}`
        }
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Job status check error:', error)
      return null
    }
  }

  /**
   * Validate video file before processing
   */
  validateVideoFile(file: { size: number; type: string; name: string }): {
    valid: boolean
    error?: string
  } {
    // Size check
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds limit (${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`
      }
    }

    // Format check
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !this.config.allowedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported format. Allowed: ${this.config.allowedFormats.join(', ')}`
      }
    }

    // MIME type check
    if (!file.type.startsWith('video/')) {
      return {
        valid: false,
        error: 'File is not a video'
      }
    }

    return { valid: true }
  }

  /**
   * Create thumbnail for video (delegated to Railway)
   */
  async createThumbnail(
    videoUrl: string, 
    timeOffset: number = 5
  ): Promise<string | null> {
    if (this.config.environment === 'development') {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD' // Mock base64 image
    }

    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`
        },
        body: JSON.stringify({ videoUrl, timeOffset })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.thumbnailUrl
    } catch (error) {
      console.error('Thumbnail creation error:', error)
      return null
    }
  }

  /**
   * Extract audio from video (delegated to Railway)
   */
  async extractAudio(videoUrl: string): Promise<string | null> {
    if (this.config.environment === 'development') {
      return 'mock-audio-url.mp3'
    }

    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/extract-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`
        },
        body: JSON.stringify({ videoUrl })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.audioUrl
    } catch (error) {
      console.error('Audio extraction error:', error)
      return null
    }
  }

  /**
   * Optimize video for different platforms
   */
  async optimizeForPlatform(
    videoUrl: string,
    platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter'
  ): Promise<string | null> {
    const platformConfigs = {
      tiktok: { width: 1080, height: 1920, bitrate: '2000k' },
      instagram: { width: 1080, height: 1920, bitrate: '3500k' },
      youtube: { width: 1080, height: 1920, bitrate: '5000k' },
      twitter: { width: 1280, height: 720, bitrate: '2500k' }
    }

    const config = platformConfigs[platform]
    
    if (this.config.environment === 'development') {
      return `mock-optimized-${platform}-url.mp4`
    }

    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`
        },
        body: JSON.stringify({ videoUrl, platform, config })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.optimizedUrl
    } catch (error) {
      console.error('Video optimization error:', error)
      return null
    }
  }

  /**
   * Legacy API compatibility methods
   */
  async extractMetadata(videoFile: File | ArrayBuffer): Promise<VideoMetadata> {
    const fileSize = videoFile instanceof File ? videoFile.size : videoFile.byteLength
    
    if (this.config.environment === 'development') {
      return this.mockVideoMetadata()
    }

    // For Vercel, we delegate to Railway backend
    const videoUrl = videoFile instanceof File ? URL.createObjectURL(videoFile) : ''
    const metadata = await this.getVideoMetadata(videoUrl)
    
    return metadata || this.mockVideoMetadata()
  }

  async generateThumbnails(videoUrl: string, count: number = 3): Promise<string[]> {
    if (this.config.environment === 'development') {
      return Array(count).fill(0).map((_, i) => `mock-thumbnail-${i}.jpg`)
    }

    const thumbnails: string[] = []
    for (let i = 0; i < count; i++) {
      const timeOffset = (i + 1) * 10 // Every 10 seconds
      const thumbnail = await this.createThumbnail(videoUrl, timeOffset)
      if (thumbnail) thumbnails.push(thumbnail)
    }
    
    return thumbnails
  }

  async createChunks(videoUrl: string, chunkDuration: number = 30): Promise<Array<{ start: number; end: number; url: string }>> {
    if (this.config.environment === 'development') {
      return [
        { start: 0, end: 30, url: 'mock-chunk-1.mp4' },
        { start: 30, end: 60, url: 'mock-chunk-2.mp4' },
        { start: 60, end: 90, url: 'mock-chunk-3.mp4' }
      ]
    }

    // Delegate to Railway backend for actual chunking
    try {
      const response = await fetch(`${this.config.railwayBackendUrl}/api/video/chunks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.railwayApiKey}`
        },
        body: JSON.stringify({ videoUrl, chunkDuration })
      })

      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('Video chunking error:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private mockVideoProcessing(videoUrl: string, options: any): VideoProcessingJob {
    const jobId = this.generateJobId()
    
    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      console.log(`[MOCK] Video processing completed for job ${jobId}`)
    }, 3000)

    return {
      id: jobId,
      status: 'processing',
      videoUrl,
      progress: 25,
      createdAt: new Date()
    }
  }

  private mockVideoMetadata(): VideoMetadata {
    return {
      duration: 120,
      width: 1920,
      height: 1080,
      fileSize: 50 * 1024 * 1024, // 50MB
      format: 'mp4',
      frameRate: 30,
      bitrate: 2500000,
      aspectRatio: '16:9',
      hasAudio: true,
      audioCodec: 'aac',
      audioBitrate: 128000
    }
  }

  private mockJobStatus(jobId: string): VideoProcessingJob {
    const now = new Date()
    const createdAt = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
    
    return {
      id: jobId,
      status: 'completed',
      videoUrl: 'mock-video-url.mp4',
      outputUrl: 'mock-processed-video-url.mp4',
      progress: 100,
      createdAt,
      completedAt: now
    }
  }
}

/**
 * Factory function to create appropriate video processor based on environment
 */
export function createVideoProcessor(): VercelVideoProcessor {
  const environment = process.env.VERCEL ? 'vercel' : 
                     process.env.RAILWAY_ENVIRONMENT ? 'railway' : 
                     'development'

  const config: VideoProcessorConfig = {
    environment,
    railwayBackendUrl: process.env.RAILWAY_BACKEND_URL || 'https://your-railway-backend.railway.app',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
  }

  return new VercelVideoProcessor(config)
}

// Export singleton instance
export const videoProcessor = createVideoProcessor()

// Legacy export for compatibility
export function getVideoProcessor(): VercelVideoProcessor {
  return videoProcessor
}