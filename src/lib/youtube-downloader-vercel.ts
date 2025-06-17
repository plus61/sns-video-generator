import { supabaseAdmin } from './supabase'

// Vercel環境用のモック実装
export enum DownloadErrorType {
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

export class YouTubeDownloader {
  async processYouTubeVideo(videoId: string, youtubeUrl: string) {
    try {
      console.log(`[MOCK] Processing YouTube video: ${youtubeUrl}`)
      
      // Update status to processing
      await supabaseAdmin
        .from('video_uploads')
        .update({ status: 'processing' })
        .eq('id', videoId)

      // Extract video ID from URL
      const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
      const youtubeVideoId = match ? match[1] : 'unknown'

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock metadata
      const mockMetadata = {
        title: `YouTube Video ${youtubeVideoId}`,
        duration: 300, // 5 minutes
        description: 'This is a mock video for testing purposes',
        thumbnail: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
        fileSize: 50 * 1024 * 1024, // 50MB
        uploadDate: new Date().toISOString(),
        uploader: 'Mock Channel',
        viewCount: 1000,
        likeCount: 100
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

    } catch (error) {
      console.error('[MOCK] YouTube processing error:', error)
      
      // Update status to error
      await supabaseAdmin
        .from('video_uploads')
        .update({ 
          status: 'error',
          error_message: 'Mock processing failed - this is a test environment'
        })
        .eq('id', videoId)

      throw error
    }
  }

  // Stub methods for compatibility
  async downloadVideo() {
    throw new Error('Download not available in Vercel environment')
  }

  async uploadToSupabase() {
    throw new Error('Upload not available in Vercel environment')
  }

  async cleanupTempFile() {
    // No-op in mock environment
  }
}