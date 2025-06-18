// import { v4 as uuidv4 } from 'uuid' // Not used in mock
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
  private youtubeAPI: YouTubeAPIService

  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp/video-uploads'
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second for mock
    this.maxFileSize = 500 * 1024 * 1024 // 500MB
    this.youtubeAPI = new YouTubeAPIService()
    
    console.log('YouTubeDownloader initialized - Mock implementation with YouTube Data API v3')
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  private extractVideoIdFromUrl(url: string): string {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    return match ? match[1] : 'mock_video_id'
  }

  private async getEnhancedMetadata(youtubeUrl: string): Promise<VideoMetadata> {
    try {
      // Try to get real metadata from YouTube Data API
      const apiMetadata = await this.youtubeAPI.getVideoInfo(youtubeUrl)
      
      console.log(`Enhanced metadata retrieved from YouTube Data API for: ${apiMetadata.title}`)
      
      return {
        title: apiMetadata.title,
        duration: apiMetadata.duration,
        description: apiMetadata.description,
        thumbnail: apiMetadata.thumbnail,
        fileSize: 25 * 1024 * 1024, // Mock file size
        format: 'mp4',
        width: apiMetadata.isHD ? 1920 : 1280,
        height: apiMetadata.isHD ? 1080 : 720,
        uploadDate: apiMetadata.uploadDate,
        uploader: apiMetadata.uploader,
        viewCount: apiMetadata.viewCount,
        likeCount: apiMetadata.likeCount
      }
    } catch (error) {
      console.warn('Failed to get API metadata, falling back to mock:', error instanceof Error ? error.message : String(error))
      return this.generateFallbackMetadata(youtubeUrl)
    }
  }

  private generateFallbackMetadata(youtubeUrl: string): VideoMetadata {
    const videoId = this.extractVideoIdFromUrl(youtubeUrl)
    
    // Generate deterministic mock data based on video ID
    const mockTitles = [
      '美味しい料理の作り方 - プロのコツ',
      '驚きの旅行スポット発見！',
      '簡単10分レシピ - 時短料理',
      'エンターテイメント動画サンプル',
      '人気YouTuber風動画コンテンツ'
    ]
    
    const mockUploaders = [
      'クッキングマスター',
      'トラベラーJP',
      'レシピの神様',
      'エンタメチャンネル',
      'バイラルクリエイター'
    ]

    const titleIndex = videoId.charCodeAt(0) % mockTitles.length
    const uploaderIndex = videoId.charCodeAt(1) % mockUploaders.length
    
    return {
      title: mockTitles[titleIndex],
      duration: 120 + (videoId.charCodeAt(2) % 300), // 120-420 seconds
      description: `これは${mockTitles[titleIndex]}のサンプル動画です。エンターテイメント性の高いコンテンツとして作成されました。`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      fileSize: 25 * 1024 * 1024, // 25MB mock size
      format: 'mp4',
      width: 1920,
      height: 1080,
      uploadDate: '2024-06-17',
      uploader: mockUploaders[uploaderIndex],
      viewCount: 10000 + (videoId.charCodeAt(3) % 90000), // 10k-100k views
      likeCount: 500 + (videoId.charCodeAt(4) % 1500) // 500-2000 likes
    }
  }

  private async createMockVideoFile(outputPath: string): Promise<void> {
    // Create a small mock video file (just a text file for testing)
    const mockContent = `Mock video file created at ${new Date().toISOString()}\nThis is a placeholder for actual video content.`
    await fs.writeFile(outputPath, mockContent, 'utf-8')
  }

  async downloadVideo(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    await this.ensureTempDir()
    
    const outputPath = path.join(this.tempDir, `${videoId}.mp4`)
    
    console.log(`Mock: Getting video info for ${youtubeUrl}`)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get enhanced metadata (API + fallback)
    const metadata = await this.getEnhancedMetadata(youtubeUrl)
    
    console.log(`Mock: Starting download for ${youtubeUrl}`)
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create mock video file
    await this.createMockVideoFile(outputPath)
    
    // Get actual file size
    const stats = await fs.stat(outputPath)
    metadata.fileSize = stats.size
    
    console.log(`Mock: Download completed: ${outputPath} (${Math.round(stats.size / 1024)}KB)`)
    
    return {
      localPath: outputPath,
      metadata
    }
  }

  async uploadToSupabase(videoId: string, localPath: string, metadata: VideoMetadata) {
    try {
      console.log(`Mock: Uploading ${localPath} to Supabase for video ${videoId}`)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock Supabase storage path
      const storagePath = `videos/${videoId}/${videoId}.mp4`
      const publicUrl = `https://mock-storage.supabase.co/videos/${videoId}/${videoId}.mp4`
      
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
            upload_date: metadata.uploadDate
          }
        })
        .eq('id', videoId)

      if (updateError) {
        throw updateError
      }

      // Clean up temp file
      await this.cleanupTempFile(localPath)

      console.log(`Mock: Upload completed successfully for video ${videoId}`)

      return {
        storagePath,
        publicUrl
      }
    } catch (error) {
      console.error('Mock Supabase upload error:', error)
      throw new Error(`Failed to upload to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cleanupTempFile(filePath: string) {
    try {
      await fs.unlink(filePath)
      console.log(`Mock: Cleaned up temp file: ${filePath}`)
    } catch (error) {
      console.error(`Mock: Failed to cleanup temp file: ${filePath}`, error)
    }
  }

  async processYouTubeVideo(videoId: string, youtubeUrl: string) {
    try {
      console.log(`Mock: Processing YouTube video ${videoId} from ${youtubeUrl}`)
      
      // Update status to processing
      await supabaseAdmin
        .from('video_uploads')
        .update({ status: 'processing' })
        .eq('id', videoId)

      // Simulate total processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Download video (mock)
      const { localPath, metadata } = await this.downloadVideo(videoId, youtubeUrl)

      // Upload to Supabase (mock)
      const { publicUrl } = await this.uploadToSupabase(videoId, localPath, metadata)

      console.log(`Mock: YouTube video processed successfully: ${videoId}`)
      return { success: true, publicUrl, metadata }

    } catch (error) {
      console.error('Mock: YouTube processing error:', error)
      
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
}