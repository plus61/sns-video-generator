interface YouTubeVideoSnippet {
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
    standard?: { url: string; width: number; height: number }
    maxres?: { url: string; width: number; height: number }
  }
  tags?: string[]
  categoryId: string
  defaultLanguage?: string
  localized: {
    title: string
    description: string
  }
}

interface YouTubeVideoContentDetails {
  duration: string // ISO 8601 format (PT4M13S)
  dimension: string // "2d" or "3d"
  definition: string // "hd" or "sd"
  caption: string // "true" or "false"
  licensedContent: boolean
  projection: string // "rectangular" or "360"
}

interface YouTubeVideoStatistics {
  viewCount: string
  likeCount?: string
  commentCount?: string
}

interface YouTubeVideoItem {
  id: string
  snippet: YouTubeVideoSnippet
  contentDetails: YouTubeVideoContentDetails
  statistics: YouTubeVideoStatistics
}

interface YouTubeAPIResponse {
  items: YouTubeVideoItem[]
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

interface YouTubeVideoMetadata {
  id: string
  title: string
  description: string
  duration: number // in seconds
  thumbnail: string
  uploader: string
  uploadDate: string
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  category: string
  isHD: boolean
  language?: string
}

enum YouTubeAPIErrorType {
  INVALID_API_KEY = 'INVALID_API_KEY',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_VIDEO_ID = 'INVALID_VIDEO_ID',
  PRIVATE_VIDEO = 'PRIVATE_VIDEO',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class YouTubeAPIError extends Error {
  constructor(
    public errorType: YouTubeAPIErrorType,
    public originalError?: any,
    message?: string
  ) {
    super(message || `YouTube API error: ${errorType}`)
    this.name = 'YouTubeAPIError'
  }
}

export class YouTubeAPIService {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'
  private maxRetries = 3
  private retryDelay = 1000

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || ''
    
    if (!this.apiKey || this.apiKey === 'your_youtube_data_api_v3_key') {
      console.warn('YouTube API key not configured. API calls will be mocked.')
    }
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(youtubeUrl: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern)
      if (match) {
        return match[1]
      }
    }

    throw new YouTubeAPIError(
      YouTubeAPIErrorType.INVALID_VIDEO_ID,
      null,
      `Could not extract video ID from URL: ${youtubeUrl}`
    )
  }

  /**
   * Convert ISO 8601 duration to seconds
   */
  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)

    return hours * 3600 + minutes * 60 + seconds
  }

  /**
   * Classify error based on response
   */
  private classifyError(error: any, response?: Response): YouTubeAPIErrorType {
    if (!response) {
      return YouTubeAPIErrorType.NETWORK_ERROR
    }

    switch (response.status) {
      case 400:
        return YouTubeAPIErrorType.INVALID_VIDEO_ID
      case 403:
        return error.message?.includes('quota') 
          ? YouTubeAPIErrorType.QUOTA_EXCEEDED 
          : YouTubeAPIErrorType.INVALID_API_KEY
      case 404:
        return YouTubeAPIErrorType.VIDEO_NOT_FOUND
      default:
        return YouTubeAPIErrorType.UNKNOWN_ERROR
    }
  }

  /**
   * Retry mechanism for API calls
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        console.warn(`${errorContext} failed (attempt ${attempt}/${this.maxRetries}):`, 
          error instanceof Error ? error.message : String(error))

        // Don't retry for certain error types
        if (error instanceof YouTubeAPIError) {
          const nonRetryableErrors = [
            YouTubeAPIErrorType.INVALID_API_KEY,
            YouTubeAPIErrorType.INVALID_VIDEO_ID,
            YouTubeAPIErrorType.VIDEO_NOT_FOUND,
            YouTubeAPIErrorType.PRIVATE_VIDEO
          ]
          
          if (nonRetryableErrors.includes(error.errorType)) {
            throw error
          }
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }

    throw lastError
  }

  /**
   * Get video information from YouTube Data API v3
   */
  async getVideoInfo(youtubeUrl: string): Promise<YouTubeVideoMetadata> {
    // If no API key configured, return mock data
    if (!this.apiKey || this.apiKey === 'your_youtube_data_api_v3_key') {
      return this.getMockVideoInfo(youtubeUrl)
    }

    const videoId = this.extractVideoId(youtubeUrl)

    return this.retryOperation(async () => {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set('id', videoId)
      url.searchParams.set('key', this.apiKey)
      url.searchParams.set('part', 'snippet,contentDetails,statistics')

      console.log(`Fetching video info for ID: ${videoId}`)

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorType = this.classifyError(errorData, response)
        throw new YouTubeAPIError(errorType, errorData, 
          `API request failed: ${response.status} ${response.statusText}`)
      }

      const data: YouTubeAPIResponse = await response.json()

      if (!data.items || data.items.length === 0) {
        throw new YouTubeAPIError(
          YouTubeAPIErrorType.VIDEO_NOT_FOUND,
          null,
          `Video not found: ${videoId}`
        )
      }

      const video = data.items[0]
      
      return this.transformToMetadata(video)
    }, 'YouTube API video info fetch')
  }

  /**
   * Transform YouTube API response to our metadata format
   */
  private transformToMetadata(video: YouTubeVideoItem): YouTubeVideoMetadata {
    const snippet = video.snippet
    const contentDetails = video.contentDetails
    const statistics = video.statistics

    // Get the highest quality thumbnail available
    const thumbnail = snippet.thumbnails.maxres?.url ||
                     snippet.thumbnails.high?.url ||
                     snippet.thumbnails.medium?.url ||
                     snippet.thumbnails.default?.url ||
                     ''

    return {
      id: video.id,
      title: snippet.title,
      description: snippet.description,
      duration: this.parseDuration(contentDetails.duration),
      thumbnail,
      uploader: snippet.channelTitle,
      uploadDate: snippet.publishedAt,
      viewCount: parseInt(statistics.viewCount || '0', 10),
      likeCount: parseInt(statistics.likeCount || '0', 10),
      commentCount: parseInt(statistics.commentCount || '0', 10),
      tags: snippet.tags || [],
      category: snippet.categoryId,
      isHD: contentDetails.definition === 'hd',
      language: snippet.defaultLanguage
    }
  }

  /**
   * Mock implementation for when API key is not configured
   */
  private getMockVideoInfo(youtubeUrl: string): YouTubeVideoMetadata {
    const videoId = this.extractVideoId(youtubeUrl)
    
    // Generate consistent mock data based on video ID
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

    console.log(`[MOCK] Generating mock video info for ID: ${videoId}`)

    return {
      id: videoId,
      title: mockTitles[titleIndex],
      description: `これは${mockTitles[titleIndex]}のサンプル動画です。YouTube Data API v3のモック実装により生成されました。`,
      duration: 120 + (videoId.charCodeAt(2) % 300), // 120-420 seconds
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      uploader: mockUploaders[uploaderIndex],
      uploadDate: new Date().toISOString(),
      viewCount: 10000 + (videoId.charCodeAt(3) % 90000), // 10k-100k views
      likeCount: 500 + (videoId.charCodeAt(4) % 1500), // 500-2000 likes
      commentCount: 50 + (videoId.charCodeAt(5) % 500), // 50-550 comments
      tags: ['料理', 'レシピ', 'エンタメ', 'YouTube'],
      category: '22', // People & Blogs
      isHD: true,
      language: 'ja'
    }
  }

  /**
   * Check if video is accessible (not private, not deleted)
   */
  async isVideoAccessible(youtubeUrl: string): Promise<boolean> {
    try {
      await this.getVideoInfo(youtubeUrl)
      return true
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        return ![
          YouTubeAPIErrorType.VIDEO_NOT_FOUND,
          YouTubeAPIErrorType.PRIVATE_VIDEO,
          YouTubeAPIErrorType.INVALID_VIDEO_ID
        ].includes(error.errorType)
      }
      return false
    }
  }

  /**
   * Get video metadata optimized for social media
   */
  async getVideoMetadataForSocial(youtubeUrl: string): Promise<{
    title: string
    description: string
    duration: number
    isShortForm: boolean
    suggestedTags: string[]
    engagementScore: number
  }> {
    const metadata = await this.getVideoInfo(youtubeUrl)
    
    // Calculate engagement score (simplified)
    const engagementRate = metadata.likeCount / Math.max(metadata.viewCount, 1)
    const engagementScore = Math.min(Math.round(engagementRate * 1000), 10)
    
    // Determine if suitable for short-form content
    const isShortForm = metadata.duration <= 60 // 1 minute or less
    
    // Extract hashtag-friendly tags
    const suggestedTags = metadata.tags
      .filter(tag => tag.length <= 20) // Short tags work better
      .slice(0, 5) // Limit to 5 tags
      .map(tag => `#${tag.replace(/\s+/g, '')}`)
    
    return {
      title: metadata.title.substring(0, 100), // Limit title length
      description: metadata.description.substring(0, 300), // Limit description
      duration: metadata.duration,
      isShortForm,
      suggestedTags,
      engagementScore
    }
  }
}

export { YouTubeAPIErrorType, type YouTubeVideoMetadata }