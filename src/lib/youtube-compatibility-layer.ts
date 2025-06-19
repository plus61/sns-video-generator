/**
 * YouTube Download Compatibility Layer
 * Worker2とWorker3の統合最適化：Node.js 18環境でのWorker2 YouTube機能サポート
 */

import { getEnvironmentConfig } from './compatibility-layer'

export interface YouTubeDownloadResult {
  success: boolean
  videoPath?: string
  videoId: string
  title?: string
  duration?: number
  error?: string
  metadata?: {
    width: number
    height: number
    fps: number
    format: string
    size: number
  }
}

export interface YouTubeDownloadOptions {
  quality?: 'highest' | 'high' | 'medium' | 'low'
  format?: 'mp4' | 'webm' | 'mkv'
  maxFileSize?: number
  enableAudio?: boolean
  tempDir?: string
}

/**
 * Worker2統合：Multi-strategy YouTube downloader with Node.js 18 compatibility
 */
export class YouTubeCompatibilityLayer {
  private config = getEnvironmentConfig()
  
  async downloadVideo(
    url: string, 
    options: YouTubeDownloadOptions = {}
  ): Promise<YouTubeDownloadResult> {
    const videoId = this.extractVideoId(url)
    if (!videoId) {
      return {
        success: false,
        videoId: '',
        error: 'Invalid YouTube URL'
      }
    }

    console.log(`🔄 Worker2/3統合: YouTube download starting for ${videoId}`)

    // Strategy 1: Worker2のytdl-core（Node.js 18互換）
    try {
      const result = await this.downloadWithYtdlCore(url, options)
      if (result.success) {
        console.log(`✅ Worker2 ytdl-core strategy succeeded`)
        return result
      }
    } catch (error) {
      console.warn(`⚠️ Worker2 ytdl-core failed:`, error)
    }

    // Strategy 2: Worker3のyoutube-dl-exec（安定性重視）
    try {
      const result = await this.downloadWithYoutubeDl(url, options)
      if (result.success) {
        console.log(`✅ Worker3 youtube-dl-exec strategy succeeded`)
        return result
      }
    } catch (error) {
      console.warn(`⚠️ Worker3 youtube-dl-exec failed:`, error)
    }

    // Strategy 3: Mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
      console.log(`🧪 Using mock YouTube download for development`)
      return this.createMockDownloadResult(videoId, options)
    }

    return {
      success: false,
      videoId,
      error: 'All download strategies failed'
    }
  }

  /**
   * Worker2 Strategy: ytdl-core with Node.js 18 compatibility
   */
  private async downloadWithYtdlCore(
    url: string, 
    options: YouTubeDownloadOptions
  ): Promise<YouTubeDownloadResult> {
    try {
      const ytdl = await import('ytdl-core')
      const fs = await import('fs')
      const path = await import('path')
      
      const videoId = this.extractVideoId(url)
      const tempDir = options.tempDir || '/tmp'
      const outputPath = path.join(tempDir, `youtube_${videoId}_${Date.now()}.mp4`)

      // Get video info first
      const info = await ytdl.getInfo(url)
      const title = info.videoDetails.title
      const duration = parseInt(info.videoDetails.lengthSeconds)

      // Select best format based on options
      const format = ytdl.chooseFormat(info.formats, {
        quality: this.mapQualityToYtdl(options.quality || 'high'),
        filter: 'videoandaudio'
      })

      if (!format) {
        throw new Error('No suitable format found')
      }

      // Download video
      await new Promise<void>((resolve, reject) => {
        const stream = ytdl(url, { format })
        const writeStream = fs.createWriteStream(outputPath)
        
        stream.pipe(writeStream)
        
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        stream.on('error', reject)
      })

      // Get file stats
      const stats = fs.statSync(outputPath)

      return {
        success: true,
        videoPath: outputPath,
        videoId,
        title,
        duration,
        metadata: {
          width: format.width || 1920,
          height: format.height || 1080,
          fps: format.fps || 30,
          format: 'mp4',
          size: stats.size
        }
      }
    } catch (error) {
      throw new Error(`ytdl-core download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Worker3 Strategy: youtube-dl-exec (stable, external binary)
   */
  private async downloadWithYoutubeDl(
    url: string, 
    options: YouTubeDownloadOptions
  ): Promise<YouTubeDownloadResult> {
    try {
      const youtubedl = await import('youtube-dl-exec')
      const path = await import('path')
      const fs = await import('fs')
      
      const videoId = this.extractVideoId(url)
      const tempDir = options.tempDir || '/tmp'
      const outputTemplate = path.join(tempDir, `youtube_${videoId}_%(title)s.%(ext)s`)

      const result = await youtubedl.exec(url, {
        output: outputTemplate,
        format: this.mapQualityToYoutubeDl(options.quality || 'high'),
        noPlaylist: true,
        extractFlat: false,
        writeInfoJson: true,
        writeThumbnail: false
      })

      // Parse output to find downloaded file
      const outputLines = result.split('\n')
      const downloadedFile = outputLines.find(line => 
        line.includes('[download]') && line.includes('100%')
      )

      if (!downloadedFile) {
        throw new Error('Could not determine downloaded file path')
      }

      // Extract file path from output
      const filePathMatch = downloadedFile.match(/([^[\]]+\.(mp4|webm|mkv))/)
      if (!filePathMatch) {
        throw new Error('Could not parse file path from output')
      }

      const filePath = filePathMatch[1]
      const stats = fs.statSync(filePath)

      return {
        success: true,
        videoPath: filePath,
        videoId,
        title: 'Downloaded Video',
        metadata: {
          width: 1920, // Default values, would need ffprobe for accurate info
          height: 1080,
          fps: 30,
          format: path.extname(filePath).slice(1),
          size: stats.size
        }
      }
    } catch (error) {
      throw new Error(`youtube-dl-exec download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Development/Testing Strategy: Mock download
   */
  private createMockDownloadResult(
    videoId: string, 
    options: YouTubeDownloadOptions
  ): YouTubeDownloadResult {
    return {
      success: true,
      videoPath: `/tmp/mock_youtube_${videoId}.mp4`,
      videoId,
      title: `Mock YouTube Video ${videoId}`,
      duration: 120, // 2 minutes
      metadata: {
        width: 1920,
        height: 1080,
        fps: 30,
        format: 'mp4',
        size: 50 * 1024 * 1024 // 50MB mock
      }
    }
  }

  /**
   * Utility: Extract video ID from YouTube URL
   */
  private extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return ''
  }

  /**
   * Quality mapping for ytdl-core
   */
  private mapQualityToYtdl(quality: string): string {
    const qualityMap: Record<string, string> = {
      'highest': 'highestvideo',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    }
    return qualityMap[quality] || 'high'
  }

  /**
   * Quality mapping for youtube-dl-exec
   */
  private mapQualityToYoutubeDl(quality: string): string {
    const qualityMap: Record<string, string> = {
      'highest': 'best[height<=1080]',
      'high': 'best[height<=720]',
      'medium': 'best[height<=480]',
      'low': 'worst'
    }
    return qualityMap[quality] || 'best[height<=720]'
  }

  /**
   * Environment validation for YouTube download capabilities
   */
  async validateEnvironment(): Promise<{
    ytdlCoreAvailable: boolean
    youtubeDlAvailable: boolean
    recommendedStrategy: 'ytdl-core' | 'youtube-dl-exec' | 'mock'
    issues: string[]
  }> {
    const issues: string[] = []
    let ytdlCoreAvailable = false
    let youtubeDlAvailable = false

    // Test ytdl-core
    try {
      await import('ytdl-core')
      ytdlCoreAvailable = true
    } catch (error) {
      issues.push('ytdl-core not available or incompatible')
    }

    // Test youtube-dl-exec
    try {
      await import('youtube-dl-exec')
      youtubeDlAvailable = true
    } catch (error) {
      issues.push('youtube-dl-exec not available')
    }

    // Determine recommended strategy
    let recommendedStrategy: 'ytdl-core' | 'youtube-dl-exec' | 'mock' = 'mock'
    
    if (this.config.environment === 'railway' && ytdlCoreAvailable) {
      recommendedStrategy = 'ytdl-core'
    } else if (youtubeDlAvailable) {
      recommendedStrategy = 'youtube-dl-exec'
    }

    return {
      ytdlCoreAvailable,
      youtubeDlAvailable,
      recommendedStrategy,
      issues
    }
  }
}

// Singleton instance for Worker2/3 integration
export const youtubeCompatibility = new YouTubeCompatibilityLayer()

// Worker2 compatible interface
export async function downloadYouTubeVideo(
  url: string, 
  options?: YouTubeDownloadOptions
): Promise<YouTubeDownloadResult> {
  return youtubeCompatibility.downloadVideo(url, options)
}

// Environment validation for integrated system
export async function validateYouTubeEnvironment() {
  return youtubeCompatibility.validateEnvironment()
}