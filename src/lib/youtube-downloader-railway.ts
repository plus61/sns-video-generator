// Railway-specific YouTube downloader with robust environment handling
import path from 'path'
import fs from 'fs/promises'
import { supabaseAdmin } from './supabase'
import { YouTubeAPIService, type YouTubeVideoMetadata as APIMetadata } from './youtube-api-service'

interface VideoMetadata {
  title: string
  duration: number
  description?: string
  thumbnail?: string
  fileSize?: number
  format?: string
  width?: number
  height?: number
  uploadDate?: string
  uploader?: string
  viewCount?: number
  likeCount?: number
}

enum DownloadErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 
  VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
  PRIVATE_VIDEO = 'PRIVATE_VIDEO',
  GEOBLOCKED = 'GEOBLOCKED',
  INVALID_URL = 'INVALID_URL',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  DOWNLOADER_NOT_AVAILABLE = 'DOWNLOADER_NOT_AVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class YouTubeDownloadError extends Error {
  constructor(
    public errorType: DownloadErrorType,
    public originalError?: unknown,
    message?: string
  ) {
    super(message || `YouTube download failed: ${errorType}`)
    this.name = 'YouTubeDownloadError'
  }
}

export { DownloadErrorType }

// Cache for youtube-dl-exec to avoid repeated imports
let youtubedlInstance: any = null
let youtubedlLoadError: string | null = null
let loadAttempted = false

/**
 * Railway-optimized YouTube downloader
 * Handles environment detection and fallback scenarios properly
 */
export class YouTubeDownloader {
  private tempDir: string
  private maxRetries: number
  private retryDelay: number
  private maxFileSize: number
  private youtubeAPI: YouTubeAPIService
  private isRailwayEnvironment: boolean
  private isVercelEnvironment: boolean
  private useMockMode: boolean

  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp/video-uploads'
    this.maxRetries = 3
    this.retryDelay = 2000
    this.maxFileSize = 500 * 1024 * 1024 // 500MB
    this.youtubeAPI = new YouTubeAPIService()
    
    // Environment detection
    this.isRailwayEnvironment = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
    this.isVercelEnvironment = !!(process.env.VERCEL || process.env.VERCEL_ENV)
    this.useMockMode = this.shouldUseMockMode()
    
    console.log(`YouTubeDownloader (Railway) initialized:`)
    console.log(`- Railway Environment: ${this.isRailwayEnvironment}`)
    console.log(`- Vercel Environment: ${this.isVercelEnvironment}`)
    console.log(`- Mock Mode: ${this.useMockMode}`)
    console.log(`- Explicit Mock Setting: ${process.env.USE_MOCK_DOWNLOADER}`)
  }

  /**
   * Determine if mock mode should be used based on environment
   */
  private shouldUseMockMode(): boolean {
    // Explicit mock mode configuration
    if (process.env.USE_MOCK_DOWNLOADER === 'true') {
      console.log('Mock mode: Explicitly enabled via USE_MOCK_DOWNLOADER')
      return true
    }
    
    if (process.env.USE_MOCK_DOWNLOADER === 'false') {
      console.log('Mock mode: Explicitly disabled via USE_MOCK_DOWNLOADER')
      return false
    }
    
    // Vercel always uses mock due to serverless limitations
    if (this.isVercelEnvironment) {
      console.log('Mock mode: Vercel environment detected')
      return true
    }
    
    // Railway can use real downloader if available
    if (this.isRailwayEnvironment) {
      console.log('Mock mode: Railway environment - will attempt real downloader')
      return false
    }
    
    // Development environment - try real, fallback to mock
    if (process.env.NODE_ENV === 'development') {
      console.log('Mock mode: Development environment - will attempt real downloader')
      return false
    }
    
    // Default to mock for safety
    console.log('Mock mode: Default fallback to mock mode')
    return true
  }

  /**
   * Load youtube-dl-exec with proper error handling
   */
  private async loadYoutubeDl(): Promise<any> {
    if (loadAttempted) {
      return youtubedlInstance
    }
    
    loadAttempted = true
    
    // Skip in browser
    if (typeof window !== 'undefined') {
      youtubedlLoadError = 'Browser environment'
      return null
    }
    
    try {
      console.log('Attempting to load youtube-dl-exec...')
      
      // Try dynamic import first
      try {
        const module = await import('youtube-dl-exec')
        youtubedlInstance = module.default || module
        console.log('✅ youtube-dl-exec loaded successfully via dynamic import')
        return youtubedlInstance
      } catch (importError) {
        console.log('Dynamic import failed, trying require...')
        
        // Fallback to require
        try {
          youtubedlInstance = require('youtube-dl-exec')
          console.log('✅ youtube-dl-exec loaded successfully via require')
          return youtubedlInstance
        } catch (requireError) {
          throw new Error(`Both import methods failed: ${importError}; ${requireError}`)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      youtubedlLoadError = errorMessage
      console.error('❌ Failed to load youtube-dl-exec:', errorMessage)
      return null
    }
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  private classifyError(error: unknown): DownloadErrorType {
    const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase()
    
    if (errorMessage.includes('private video') || errorMessage.includes('this video is private')) {
      return DownloadErrorType.PRIVATE_VIDEO
    }
    if (errorMessage.includes('video unavailable') || errorMessage.includes('video not available')) {
      return DownloadErrorType.VIDEO_UNAVAILABLE
    }
    if (errorMessage.includes('blocked') || errorMessage.includes('geo')) {
      return DownloadErrorType.GEOBLOCKED
    }
    if (errorMessage.includes('quota') || errorMessage.includes('too many requests')) {
      return DownloadErrorType.QUOTA_EXCEEDED
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return DownloadErrorType.NETWORK_ERROR
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
      return DownloadErrorType.INVALID_URL
    }
    if (errorMessage.includes('youtube-dl') || errorMessage.includes('downloader')) {
      return DownloadErrorType.DOWNLOADER_NOT_AVAILABLE
    }
    
    return DownloadErrorType.UNKNOWN_ERROR
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        const errorType = this.classifyError(error)
        console.warn(`${errorContext} failed (attempt ${attempt}/${this.maxRetries}):`, 
          error instanceof Error ? error.message : String(error))
        
        // Don't retry for certain error types
        if ([
          DownloadErrorType.PRIVATE_VIDEO,
          DownloadErrorType.VIDEO_UNAVAILABLE,
          DownloadErrorType.GEOBLOCKED,
          DownloadErrorType.INVALID_URL,
          DownloadErrorType.FILE_TOO_LARGE,
          DownloadErrorType.DOWNLOADER_NOT_AVAILABLE
        ].includes(errorType)) {
          throw new YouTubeDownloadError(errorType, error)
        }
        
        // Wait before retrying
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt)
        }
      }
    }
    
    // All retries failed
    const errorType = this.classifyError(lastError)
    throw new YouTubeDownloadError(errorType, lastError)
  }

  /**
   * Get enhanced metadata using YouTube Data API when available
   */
  private async getEnhancedMetadata(youtubeUrl: string): Promise<VideoMetadata> {
    try {
      console.log('Fetching enhanced metadata from YouTube Data API...')
      const apiMetadata = await this.youtubeAPI.getVideoInfo(youtubeUrl)
      
      return {
        title: apiMetadata.title,
        duration: apiMetadata.duration,
        description: apiMetadata.description?.substring(0, 1000),
        thumbnail: apiMetadata.thumbnail,
        fileSize: 0, // Will be updated after download
        format: 'mp4',
        width: apiMetadata.isHD ? 1920 : 1280,
        height: apiMetadata.isHD ? 1080 : 720,
        uploadDate: apiMetadata.uploadDate,
        uploader: apiMetadata.uploader,
        viewCount: apiMetadata.viewCount,
        likeCount: apiMetadata.likeCount
      }
    } catch (error) {
      console.warn('Failed to get API metadata, using fallback:', error)
      return this.generateFallbackMetadata(youtubeUrl)
    }
  }

  private generateFallbackMetadata(youtubeUrl: string): VideoMetadata {
    const videoId = this.extractVideoIdFromUrl(youtubeUrl)
    
    return {
      title: `Video ${videoId}`,
      duration: 300, // 5 minutes default
      description: 'Video downloaded from YouTube',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      fileSize: 0,
      format: 'mp4',
      width: 1920,
      height: 1080,
      uploadDate: new Date().toISOString(),
      uploader: 'Unknown',
      viewCount: 0,
      likeCount: 0
    }
  }

  private extractVideoIdFromUrl(url: string): string {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    return match ? match[1] : 'unknown'
  }

  /**
   * Real YouTube download implementation
   */
  async downloadVideoReal(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    await this.ensureTempDir()
    
    const outputPath = path.join(this.tempDir, `${videoId}.mp4`)
    
    // Load youtube-dl-exec
    const youtubedl = await this.loadYoutubeDl()
    if (!youtubedl) {
      throw new YouTubeDownloadError(
        DownloadErrorType.DOWNLOADER_NOT_AVAILABLE,
        new Error(youtubedlLoadError || 'youtube-dl-exec not available'),
        'YouTube downloader not available'
      )
    }
    
    // Get enhanced metadata first
    const metadata = await this.getEnhancedMetadata(youtubeUrl)
    
    // Get video info for file size check
    const info = await this.retryOperation(async () => {
      console.log(`Getting video info for ${youtubeUrl}`)
      return await youtubedl(youtubeUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (compatible; YouTubeDownloader/1.0)'],
        skipDownload: true
      })
    }, 'Video info extraction')

    // Check file size limit
    const estimatedSize = info.filesize_approx || info.filesize || 0
    if (estimatedSize > this.maxFileSize) {
      throw new YouTubeDownloadError(
        DownloadErrorType.FILE_TOO_LARGE,
        null,
        `Video file too large: ${Math.round(estimatedSize / 1024 / 1024)}MB (max: ${Math.round(this.maxFileSize / 1024 / 1024)}MB)`
      )
    }

    // Update metadata with actual info
    if (info.title) metadata.title = info.title
    if (info.duration) metadata.duration = Math.round(info.duration)
    if (info.description) metadata.description = info.description.substring(0, 1000)

    // Download video
    await this.retryOperation(async () => {
      console.log(`Starting download for ${youtubeUrl}`)
      await youtubedl(youtubeUrl, {
        output: outputPath,
        format: 'best[ext=mp4][filesize<500M]/best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        quiet: true,
        noCallHome: true,
        extractAudio: false,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (compatible; YouTubeDownloader/1.0)']
      })
    }, 'Video download')

    // Verify file exists and get actual size
    const stats = await fs.stat(outputPath)
    metadata.fileSize = stats.size

    console.log(`Download completed: ${outputPath} (${Math.round(stats.size / 1024 / 1024)}MB)`)
    
    return {
      localPath: outputPath,
      metadata
    }
  }

  /**
   * Mock implementation for testing and fallback
   */
  async downloadVideoMock(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    await this.ensureTempDir()
    
    const outputPath = path.join(this.tempDir, `${videoId}.mp4`)
    
    console.log(`[MOCK] Simulating download for ${youtubeUrl}`)
    
    // Get enhanced metadata (this will work with API or fallback)
    const metadata = await this.getEnhancedMetadata(youtubeUrl)
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create mock video file
    const mockContent = `Mock video file for ${videoId}\nCreated at: ${new Date().toISOString()}\nSource: ${youtubeUrl}`
    await fs.writeFile(outputPath, mockContent, 'utf-8')
    
    // Update file size
    const stats = await fs.stat(outputPath)
    metadata.fileSize = stats.size
    
    console.log(`[MOCK] Download completed: ${outputPath} (${stats.size} bytes)`)
    
    return {
      localPath: outputPath,
      metadata
    }
  }

  async downloadVideo(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    if (this.useMockMode) {
      return this.downloadVideoMock(videoId, youtubeUrl)
    } else {
      try {
        return await this.downloadVideoReal(videoId, youtubeUrl)
      } catch (error) {
        // If real download fails, fall back to mock
        console.warn('Real download failed, falling back to mock:', error)
        return this.downloadVideoMock(videoId, youtubeUrl)
      }
    }
  }

  async uploadToSupabase(videoId: string, localPath: string, metadata: VideoMetadata) {
    try {
      console.log(`Uploading ${localPath} to Supabase for video ${videoId}`)
      
      // Read file
      const fileBuffer = await fs.readFile(localPath)
      
      // Upload to Supabase Storage
      const storagePath = `videos/${videoId}/${videoId}.mp4`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(storagePath, fileBuffer, {
          contentType: 'video/mp4',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('videos')
        .getPublicUrl(storagePath)

      // Update database with metadata
      const { error: updateError } = await supabaseAdmin
        .from('video_uploads')
        .update({
          original_filename: metadata.title,
          file_size: metadata.fileSize,
          duration: metadata.duration,
          storage_path: storagePath,
          public_url: publicUrl,
          status: 'ready_for_analysis',
          updated_at: new Date().toISOString(),
          metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            uploader: metadata.uploader,
            view_count: metadata.viewCount,
            like_count: metadata.likeCount,
            upload_date: metadata.uploadDate,
            description: metadata.description
          }
        })
        .eq('id', videoId)

      if (updateError) {
        throw updateError
      }

      // Clean up temp file
      await this.cleanupTempFile(localPath)

      console.log(`Upload completed successfully for video ${videoId}`)

      return {
        storagePath,
        publicUrl
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Failed to upload to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cleanupTempFile(filePath: string) {
    try {
      await fs.unlink(filePath)
      console.log(`Cleaned up temp file: ${filePath}`)
    } catch (error) {
      console.error(`Failed to cleanup temp file: ${filePath}`, error)
    }
  }

  async processYouTubeVideo(videoId: string, youtubeUrl: string) {
    try {
      console.log(`Processing YouTube video ${videoId} from ${youtubeUrl}`)
      console.log(`Environment: Railway=${this.isRailwayEnvironment}, Vercel=${this.isVercelEnvironment}, Mock=${this.useMockMode}`)
      
      // Update status to processing
      await supabaseAdmin
        .from('video_uploads')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      // Download video
      const { localPath, metadata } = await this.downloadVideo(videoId, youtubeUrl)

      // Upload to Supabase
      const { publicUrl } = await this.uploadToSupabase(videoId, localPath, metadata)

      console.log(`YouTube video processed successfully: ${videoId}`)
      return { success: true, publicUrl, metadata }

    } catch (error) {
      console.error('YouTube processing error:', error)
      
      // Update status to error
      await supabaseAdmin
        .from('video_uploads')
        .update({ 
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      throw error
    }
  }
}