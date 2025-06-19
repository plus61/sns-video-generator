/**
 * Base Video Processor Interface
 * Common interface for all video processors (Vercel, Railway, Development)
 */

export interface VideoProcessorConfig {
  environment: 'vercel' | 'railway' | 'development'
  maxFileSize: number
  allowedFormats: string[]
  railwayBackendUrl?: string
}

export interface VideoProcessingResult {
  success: boolean
  videoId: string
  thumbnails: any[]
  metadata: {
    duration: number
    width: number
    height: number
    format: string
    size: number
    [key: string]: any
  }
  processingTime: number
  error?: string
}

export abstract class BaseVideoProcessor {
  protected config: VideoProcessorConfig

  constructor(config: VideoProcessorConfig) {
    this.config = config
  }

  abstract processVideo(file: File, options: any): Promise<VideoProcessingResult>
  abstract extractMetadata(file: File): Promise<any>
  abstract generateThumbnails(file: File, count?: number): Promise<any[]>

  validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${this.config.maxFileSize}`)
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !this.config.allowedFormats.includes(extension)) {
      throw new Error(`File format ${extension} not supported. Allowed: ${this.config.allowedFormats.join(', ')}`)
    }

    return true
  }

  getConfig(): VideoProcessorConfig {
    return this.config
  }
}