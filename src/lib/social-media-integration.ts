// Social Media Integration Library
// Handles API connections and posting to various social media platforms

export interface PlatformConfig {
  name: string
  baseUrl: string
  apiVersion: string
  supportedFormats: string[]
  maxFileSize: number // in MB
  maxDuration: number // in seconds
  aspectRatios: string[]
  requiresAuth: boolean
}

export interface AuthCredentials {
  accessToken?: string
  refreshToken?: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  expiresAt?: number
}

export interface PostData {
  title?: string
  description?: string
  tags?: string[]
  videoFile: File | Blob
  thumbnail?: File | Blob
  scheduledTime?: Date
  visibility?: 'public' | 'private' | 'unlisted'
  category?: string
}

export interface PostResult {
  success: boolean
  postId?: string
  url?: string
  message?: string
  error?: string
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    apiVersion: 'v3',
    supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    maxFileSize: 256000, // 256GB
    maxDuration: 43200, // 12 hours
    aspectRatios: ['16:9', '4:3', '9:16'],
    requiresAuth: true
  },
  tiktok: {
    name: 'TikTok',
    baseUrl: 'https://open-api.tiktok.com',
    apiVersion: 'v1.3',
    supportedFormats: ['mp4', 'mov', 'webm'],
    maxFileSize: 4096, // 4GB
    maxDuration: 180, // 3 minutes
    aspectRatios: ['9:16', '1:1'],
    requiresAuth: true
  },
  instagram: {
    name: 'Instagram',
    baseUrl: 'https://graph.facebook.com',
    apiVersion: 'v18.0',
    supportedFormats: ['mp4', 'mov'],
    maxFileSize: 4096, // 4GB
    maxDuration: 3600, // 60 minutes
    aspectRatios: ['1:1', '4:5', '9:16'],
    requiresAuth: true
  },
  twitter: {
    name: 'Twitter/X',
    baseUrl: 'https://upload.twitter.com/1.1',
    apiVersion: 'v1.1',
    supportedFormats: ['mp4', 'mov'],
    maxFileSize: 512, // 512MB
    maxDuration: 140, // 2 minutes 20 seconds
    aspectRatios: ['16:9', '1:1', '9:16'],
    requiresAuth: true
  }
}

export class SocialMediaIntegration {
  private credentials: Map<string, AuthCredentials> = new Map()
  private apiCallCount: Map<string, number> = new Map()
  private lastApiCall: Map<string, number> = new Map()

  constructor() {
    this.loadStoredCredentials()
  }

  // Credential Management
  setCredentials(platform: string, credentials: AuthCredentials): void {
    this.credentials.set(platform, credentials)
    this.saveCredentials()
  }

  getCredentials(platform: string): AuthCredentials | null {
    return this.credentials.get(platform) || null
  }

  isAuthenticated(platform: string): boolean {
    const creds = this.credentials.get(platform)
    if (!creds) return false

    // Check if token is expired
    if (creds.expiresAt && Date.now() > creds.expiresAt) {
      return false
    }

    return !!(creds.accessToken || creds.apiKey)
  }

  // Platform Validation
  validateVideoForPlatform(platform: string, videoFile: File, duration: number): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const config = PLATFORM_CONFIGS[platform]
    if (!config) {
      return { valid: false, errors: ['Platform not supported'], warnings: [] }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // File size check
    const fileSizeMB = videoFile.size / (1024 * 1024)
    if (fileSizeMB > config.maxFileSize) {
      errors.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${config.maxFileSize}MB`)
    }

    // Duration check
    if (duration > config.maxDuration) {
      errors.push(`Duration ${duration}s exceeds limit of ${config.maxDuration}s`)
    }

    // Format check
    const fileExtension = videoFile.name.split('.').pop()?.toLowerCase()
    if (fileExtension && !config.supportedFormats.includes(fileExtension)) {
      errors.push(`Format .${fileExtension} not supported. Supported: ${config.supportedFormats.join(', ')}`)
    }

    // Platform-specific checks
    if (platform === 'tiktok' && duration < 15) {
      warnings.push('TikTok videos shorter than 15 seconds may have reduced visibility')
    }

    if (platform === 'instagram' && duration > 60) {
      warnings.push('Instagram Reels longer than 60 seconds may have reduced reach')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Rate Limiting
  private checkRateLimit(platform: string): boolean {
    const now = Date.now()
    const lastCall = this.lastApiCall.get(platform) || 0
    const callCount = this.apiCallCount.get(platform) || 0

    // Reset counter if more than 1 hour has passed
    if (now - lastCall > 3600000) {
      this.apiCallCount.set(platform, 0)
      return true
    }

    // Platform-specific rate limits
    const limits: Record<string, number> = {
      youtube: 10000, // 10,000 requests per day
      tiktok: 1000,   // 1,000 requests per day
      instagram: 200, // 200 requests per hour
      twitter: 300    // 300 requests per 15 minutes
    }

    const limit = limits[platform] || 100
    return callCount < limit
  }

  private updateRateLimit(platform: string): void {
    const now = Date.now()
    const currentCount = this.apiCallCount.get(platform) || 0
    this.apiCallCount.set(platform, currentCount + 1)
    this.lastApiCall.set(platform, now)
  }

  // YouTube Integration
  async postToYouTube(postData: PostData): Promise<PostResult> {
    if (!this.isAuthenticated('youtube')) {
      return { success: false, error: 'Not authenticated with YouTube' }
    }

    if (!this.checkRateLimit('youtube')) {
      return { success: false, error: 'Rate limit exceeded for YouTube' }
    }

    try {
      const credentials = this.getCredentials('youtube')!
      
      // Step 1: Upload video
      const uploadResponse = await this.uploadToYouTube(postData.videoFile, credentials)
      if (!uploadResponse.success) {
        return uploadResponse
      }

      // Step 2: Set video metadata
      const metadataResponse = await this.setYouTubeMetadata(
        uploadResponse.videoId!,
        postData,
        credentials
      )

      this.updateRateLimit('youtube')
      return metadataResponse

    } catch (error) {
      return {
        success: false,
        error: `YouTube upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async uploadToYouTube(videoFile: File | Blob, credentials: AuthCredentials): Promise<PostResult & { videoId?: string }> {
    const formData = new FormData()
    formData.append('video', videoFile)

    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: {
          privacyStatus: 'private'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`YouTube upload initiation failed: ${response.statusText}`)
    }

    const resumableUri = response.headers.get('Location')
    if (!resumableUri) {
      throw new Error('No resumable upload URI received')
    }

    // Upload the actual video file
    const uploadResponse = await fetch(resumableUri, {
      method: 'PUT',
      body: videoFile
    })

    if (!uploadResponse.ok) {
      throw new Error(`YouTube video upload failed: ${uploadResponse.statusText}`)
    }

    const result = await uploadResponse.json()
    return {
      success: true,
      videoId: result.id,
      url: `https://youtube.com/watch?v=${result.id}`
    }
  }

  private async setYouTubeMetadata(videoId: string, postData: PostData, credentials: AuthCredentials): Promise<PostResult> {
    const metadata = {
      id: videoId,
      snippet: {
        title: postData.title || 'Untitled Video',
        description: postData.description || '',
        tags: postData.tags || [],
        categoryId: '22' // People & Blogs
      },
      status: {
        privacyStatus: postData.visibility || 'private'
      }
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error(`YouTube metadata update failed: ${response.statusText}`)
    }

    return {
      success: true,
      postId: videoId,
      url: `https://youtube.com/watch?v=${videoId}`,
      message: 'Video uploaded to YouTube successfully'
    }
  }

  // TikTok Integration
  async postToTikTok(postData: PostData): Promise<PostResult> {
    if (!this.isAuthenticated('tiktok')) {
      return { success: false, error: 'Not authenticated with TikTok' }
    }

    if (!this.checkRateLimit('tiktok')) {
      return { success: false, error: 'Rate limit exceeded for TikTok' }
    }

    try {
      const credentials = this.getCredentials('tiktok')!
      
      // TikTok requires video to be uploaded to their servers first
      const uploadResponse = await this.uploadToTikTok(postData.videoFile, credentials)
      if (!uploadResponse.success) {
        return uploadResponse
      }

      // Publish the video
      const publishResponse = await this.publishTikTokVideo(
        uploadResponse.uploadId!,
        postData,
        credentials
      )

      this.updateRateLimit('tiktok')
      return publishResponse

    } catch (error) {
      return {
        success: false,
        error: `TikTok upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async uploadToTikTok(videoFile: File | Blob, credentials: AuthCredentials): Promise<PostResult & { uploadId?: string }> {
    // Step 1: Get upload URL
    const initResponse = await fetch('https://open-api.tiktok.com/v1.3/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!initResponse.ok) {
      throw new Error(`TikTok upload init failed: ${initResponse.statusText}`)
    }

    const initData = await initResponse.json()
    const uploadUrl = initData.data.upload_url
    const uploadId = initData.data.upload_id

    // Step 2: Upload video file
    const formData = new FormData()
    formData.append('video', videoFile)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error(`TikTok video upload failed: ${uploadResponse.statusText}`)
    }

    return {
      success: true,
      uploadId: uploadId
    }
  }

  private async publishTikTokVideo(uploadId: string, postData: PostData, credentials: AuthCredentials): Promise<PostResult> {
    const publishData = {
      upload_id: uploadId,
      post_info: {
        title: postData.title || '',
        description: postData.description || '',
        privacy_level: postData.visibility === 'public' ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY'
      }
    }

    const response = await fetch('https://open-api.tiktok.com/v1.3/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(publishData)
    })

    if (!response.ok) {
      throw new Error(`TikTok publish failed: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      postId: result.data.publish_id,
      message: 'Video uploaded to TikTok successfully'
    }
  }

  // Instagram Integration
  async postToInstagram(postData: PostData): Promise<PostResult> {
    if (!this.isAuthenticated('instagram')) {
      return { success: false, error: 'Not authenticated with Instagram' }
    }

    if (!this.checkRateLimit('instagram')) {
      return { success: false, error: 'Rate limit exceeded for Instagram' }
    }

    try {
      const credentials = this.getCredentials('instagram')!
      
      // Instagram requires video to be uploaded via URL
      const uploadResponse = await this.uploadToInstagram(postData.videoFile, credentials)
      if (!uploadResponse.success) {
        return uploadResponse
      }

      this.updateRateLimit('instagram')
      return uploadResponse

    } catch (error) {
      return {
        success: false,
        error: `Instagram upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async uploadToInstagram(_videoFile: File | Blob, credentials: AuthCredentials): Promise<PostResult> {
    // Note: Instagram Graph API requires video to be accessible via public URL
    // In a real implementation, you'd need to upload to a temporary storage service first
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`
      },
      body: new FormData() // This is simplified - real implementation needs video URL
    })

    if (!response.ok) {
      throw new Error(`Instagram upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      postId: result.id,
      message: 'Video uploaded to Instagram successfully'
    }
  }

  // Storage Management
  private loadStoredCredentials(): void {
    try {
      // Check if we're running in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('social_media_credentials')
        if (stored) {
          const credentials = JSON.parse(stored)
          for (const [platform, creds] of Object.entries(credentials)) {
            this.credentials.set(platform, creds as AuthCredentials)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load stored credentials:', error)
    }
  }

  private saveCredentials(): void {
    try {
      // Check if we're running in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const allCredentials: Record<string, AuthCredentials> = {}
        
        for (const [key, value] of this.credentials.entries()) {
          allCredentials[key] = value
        }
        
        localStorage.setItem('social_media_credentials', JSON.stringify(allCredentials))
      }
    } catch (error) {
      console.warn('Failed to save credentials:', error)
    }
  }

  // Utility Methods
  getSupportedPlatforms(): string[] {
    return Object.keys(PLATFORM_CONFIGS)
  }

  getPlatformConfig(platform: string): PlatformConfig | null {
    return PLATFORM_CONFIGS[platform] || null
  }

  clearCredentials(platform?: string): void {
    if (platform) {
      this.credentials.delete(platform)
    } else {
      this.credentials.clear()
    }
    
    try {
      // Check if we're running in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        if (platform) {
          const stored = localStorage.getItem('social_media_credentials')
          if (stored) {
            const credentials = JSON.parse(stored)
            delete credentials[platform]
            localStorage.setItem('social_media_credentials', JSON.stringify(credentials))
          }
        } else {
          localStorage.removeItem('social_media_credentials')
        }
      }
    } catch (error) {
      console.warn('Failed to clear credentials:', error)
    }
  }
}

export const socialMediaIntegration = new SocialMediaIntegration()