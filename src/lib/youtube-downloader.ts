// Environment-specific imports
let youtubedl: unknown = null
try {
  // Only import youtube-dl-exec in non-Vercel environments
  if (!process.env.VERCEL && !process.env.USE_MOCK_DOWNLOADER) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    youtubedl = require('youtube-dl-exec')
  }
} catch {
  console.warn('youtube-dl-exec not available, using mock implementation')
}

import path from 'path'
import fs from 'fs/promises'
import { supabaseAdmin } from './supabase'

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

export class YouTubeDownloader {
  private tempDir: string
  private maxRetries: number
  private retryDelay: number
  private maxFileSize: number
  private useMockImplementation: boolean

  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp/video-uploads'
    this.maxRetries = 3
    this.retryDelay = 2000 // 2 seconds
    this.maxFileSize = 500 * 1024 * 1024 // 500MB
    
    // Use mock implementation in Vercel or when explicitly configured
    this.useMockImplementation = !!(
      process.env.VERCEL || 
      process.env.USE_MOCK_DOWNLOADER === 'true' ||
      !youtubedl
    )
    
    console.log(`YouTubeDownloader initialized - Mock mode: ${this.useMockImplementation}`)
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
        console.warn(`${errorContext} failed (attempt ${attempt}/${this.maxRetries}):`, error instanceof Error ? error.message : String(error))
        
        // Don't retry for certain error types
        if ([
          DownloadErrorType.PRIVATE_VIDEO,
          DownloadErrorType.VIDEO_UNAVAILABLE,
          DownloadErrorType.GEOBLOCKED,
          DownloadErrorType.INVALID_URL,
          DownloadErrorType.FILE_TOO_LARGE
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

  async downloadVideo(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    await this.ensureTempDir()
    
    const outputPath = path.join(this.tempDir, `${videoId}.mp4`)
    
    // Get video info with retry
    const info = await this.retryOperation(async () => {
      console.log(`Getting video info for ${youtubeUrl}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (youtubedl as any)(youtubeUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
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

    // Extract enhanced metadata
    const metadata: VideoMetadata = {
      title: info.title || 'Untitled Video',
      duration: Math.round(info.duration || 0),
      description: info.description?.substring(0, 1000), // Limit description length
      thumbnail: info.thumbnail,
      fileSize: estimatedSize,
      format: info.format || info.format_id,
      width: info.width,
      height: info.height,
      uploadDate: info.upload_date ? this.parseUploadDate(info.upload_date) : undefined,
      uploader: info.uploader || info.channel,
      viewCount: info.view_count,
      likeCount: info.like_count
    }

    // Download video with retry
    await this.retryOperation(async () => {
      console.log(`Starting download for ${youtubeUrl}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (youtubedl as any)(youtubeUrl, {
        output: outputPath,
        format: 'best[ext=mp4][filesize<500M]/best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        quiet: true,
        noCallHome: true,
        extractAudio: false,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
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

  private parseUploadDate(uploadDate: string): string {
    // Convert YYYYMMDD to ISO date
    if (uploadDate.length === 8) {
      const year = uploadDate.substring(0, 4)
      const month = uploadDate.substring(4, 6)
      const day = uploadDate.substring(6, 8)
      return `${year}-${month}-${day}`
    }
    return uploadDate
  }

  async uploadToSupabase(videoId: string, localPath: string, metadata: VideoMetadata) {
    try {
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
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      if (updateError) {
        throw updateError
      }

      // Clean up temp file
      await this.cleanupTempFile(localPath)

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
      // Update status to processing
      await supabaseAdmin
        .from('video_uploads')
        .update({ status: 'processing' })
        .eq('id', videoId)

      if (this.useMockImplementation) {
        return await this.processYouTubeVideoMock(videoId, youtubeUrl)
      }

      // Real implementation - Download video
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
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', videoId)

      throw error
    }
  }

  private async processYouTubeVideoMock(videoId: string, youtubeUrl: string) {
    console.log(`[MOCK] Processing YouTube video: ${youtubeUrl}`)
    
    // Extract video ID from URL
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
    const youtubeVideoId = match ? match[1] : 'unknown'

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock metadata
    const mockMetadata = {
      title: `React Tutorial Video ${youtubeVideoId}`,
      duration: 300, // 5 minutes
      description: 'This is a mock React tutorial video for testing purposes',
      thumbnail: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
      fileSize: 50 * 1024 * 1024, // 50MB
      uploadDate: new Date().toISOString(),
      uploader: 'React Learning Channel',
      viewCount: 10000,
      likeCount: 850
    }

    // Update database with mock data
    await supabaseAdmin
      .from('video_uploads')
      .update({
        original_filename: mockMetadata.title + '.mp4',
        file_size: mockMetadata.fileSize,
        duration: mockMetadata.duration,
        storage_path: `mock/videos/${videoId}/${videoId}.mp4`,
        public_url: `https://example.com/mock-videos/${videoId}.mp4`,
        status: 'ready_for_analysis',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    console.log(`[MOCK] YouTube video processed successfully: ${videoId}`)
    return { 
      success: true, 
      publicUrl: `https://example.com/mock-videos/${videoId}.mp4`, 
      metadata: mockMetadata 
    }
  }
}