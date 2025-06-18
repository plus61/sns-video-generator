import { 
  SocialPlatform, 
  SocialMediaAccount, 
  PostContent, 
  ScheduledPost, 
  PostResult, 
  PublishOptions,
  SocialPlatformConfig,
  PlatformOptimization
} from '@/types/social-platform'
import { supabaseAdmin } from './supabase'

// Platform configurations
export const PLATFORM_CONFIGS: Record<SocialPlatform, SocialPlatformConfig> = {
  tiktok: {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok',
    icon: '🎵',
    color: '#000000',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxDuration: 180, // 3 minutes
    supportedFormats: ['mp4', 'mov'],
    aspectRatios: [
      { width: 9, height: 16, label: '9:16 (縦型)' },
      { width: 1, height: 1, label: '1:1 (正方形)' }
    ],
    captionMaxLength: 2200,
    hashtagLimit: 20,
    features: {
      scheduling: true,
      analytics: true,
      multipleVideos: false,
      stories: false,
      reels: true
    }
  },
  instagram: {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 90, // 90 seconds for Reels
    supportedFormats: ['mp4', 'mov'],
    aspectRatios: [
      { width: 9, height: 16, label: '9:16 (リール)' },
      { width: 1, height: 1, label: '1:1 (正方形)' },
      { width: 4, height: 5, label: '4:5 (縦型)' }
    ],
    captionMaxLength: 2200,
    hashtagLimit: 30,
    features: {
      scheduling: true,
      analytics: true,
      multipleVideos: true,
      stories: true,
      reels: true
    }
  },
  youtube: {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube Shorts',
    icon: '📺',
    color: '#FF0000',
    maxFileSize: 256 * 1024 * 1024, // 256MB
    maxDuration: 60, // 60 seconds for Shorts
    supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    aspectRatios: [
      { width: 9, height: 16, label: '9:16 (Shorts)' },
      { width: 16, height: 9, label: '16:9 (通常)' }
    ],
    captionMaxLength: 5000,
    hashtagLimit: 15,
    features: {
      scheduling: true,
      analytics: true,
      multipleVideos: false,
      stories: false,
      reels: false
    }
  },
  twitter: {
    id: 'twitter',
    name: 'twitter',
    displayName: 'X (Twitter)',
    icon: '🐦',
    color: '#1DA1F2',
    maxFileSize: 512 * 1024 * 1024, // 512MB
    maxDuration: 140, // 140 seconds
    supportedFormats: ['mp4', 'mov'],
    aspectRatios: [
      { width: 16, height: 9, label: '16:9 (横型)' },
      { width: 1, height: 1, label: '1:1 (正方形)' },
      { width: 9, height: 16, label: '9:16 (縦型)' }
    ],
    captionMaxLength: 280,
    hashtagLimit: 10,
    features: {
      scheduling: true,
      analytics: true,
      multipleVideos: true,
      stories: false,
      reels: false
    }
  }
}

export class SocialPublisher {
  private static instance: SocialPublisher
  
  public static getInstance(): SocialPublisher {
    if (!SocialPublisher.instance) {
      SocialPublisher.instance = new SocialPublisher()
    }
    return SocialPublisher.instance
  }

  /**
   * 複数プラットフォームに同時投稿
   */
  async publishToMultiplePlatforms(
    userId: string,
    accounts: SocialMediaAccount[],
    content: PostContent,
    options: PublishOptions = {}
  ): Promise<PostResult[]> {
    const results: PostResult[] = []
    
    // 並列処理で各プラットフォームに投稿
    const publishPromises = accounts.map(async (account) => {
      try {
        const optimizedContent = options.optimizeForPlatform 
          ? await this.optimizeContentForPlatform(content, account.platform)
          : content

        const result = await this.publishToSinglePlatform(
          account,
          optimizedContent,
          options
        )
        
        results.push(result)
        return result
      } catch (error) {
        const errorResult: PostResult = {
          platform: account.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
        results.push(errorResult)
        return errorResult
      }
    })

    await Promise.allSettled(publishPromises)
    
    // 投稿結果をデータベースに保存
    await this.savePostResults(userId, results)
    
    return results
  }

  /**
   * 単一プラットフォームへの投稿
   */
  private async publishToSinglePlatform(
    account: SocialMediaAccount,
    content: PostContent,
    options: PublishOptions
  ): Promise<PostResult> {
    const config = PLATFORM_CONFIGS[account.platform]
    
    // プラットフォーム固有の検証
    this.validateContentForPlatform(content, config)
    
    // プラットフォーム別の投稿処理
    switch (account.platform) {
      case 'tiktok':
        return await this.publishToTikTok(account, content, options)
      case 'instagram':
        return await this.publishToInstagram(account, content, options)
      case 'youtube':
        return await this.publishToYouTube(account, content, options)
      case 'twitter':
        return await this.publishToTwitter(account, content, options)
      default:
        throw new Error(`Unsupported platform: ${account.platform}`)
    }
  }

  /**
   * TikTok投稿
   */
  private async publishToTikTok(
    account: SocialMediaAccount,
    content: PostContent,
    options: PublishOptions
  ): Promise<PostResult> {
    try {
      // TikTok API統合 (Development)
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PUBLISHER === 'true') {
        return this.mockTikTokPublish(account, content)
      }

      // 実際のTikTok API呼び出し
      const response = await fetch('https://open-api.tiktok.com/share/video/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video: {
            video_url: content.videoPath
          },
          text: this.formatCaptionForTikTok(content.caption, content.hashtags),
          privacy_level: content.privacy === 'public' ? 'MUTUAL_FOLLOW_FRIEND' : 'SELF',
          disable_duet: !content.allowDuet,
          disable_stitch: !content.allowStitch,
          disable_comment: !content.allowComments
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        platform: 'tiktok',
        success: true,
        postId: data.data.share_id,
        postUrl: `https://www.tiktok.com/@${account.accountName}/video/${data.data.share_id}`,
        publishedAt: new Date()
      }
    } catch (error) {
      return {
        platform: 'tiktok',
        success: false,
        error: error instanceof Error ? error.message : 'TikTok publish failed'
      }
    }
  }

  /**
   * Instagram投稿
   */
  private async publishToInstagram(
    account: SocialMediaAccount,
    content: PostContent,
    options: PublishOptions
  ): Promise<PostResult> {
    try {
      // Instagram Graph API統合 (Development)
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PUBLISHER === 'true') {
        return this.mockInstagramPublish(account, content)
      }

      // 1. メディアオブジェクト作成
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${account.accountId}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            media_type: 'REELS',
            video_url: content.videoPath,
            caption: this.formatCaptionForInstagram(content.caption, content.hashtags),
            cover_url: content.thumbnailPath
          })
        }
      )

      const mediaData = await mediaResponse.json()
      
      if (mediaData.error) {
        throw new Error(mediaData.error.message)
      }

      // 2. メディア公開
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${account.accountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            creation_id: mediaData.id
          })
        }
      )

      const publishData = await publishResponse.json()
      
      if (publishData.error) {
        throw new Error(publishData.error.message)
      }

      return {
        platform: 'instagram',
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}/`,
        publishedAt: new Date()
      }
    } catch (error) {
      return {
        platform: 'instagram',
        success: false,
        error: error instanceof Error ? error.message : 'Instagram publish failed'
      }
    }
  }

  /**
   * YouTube Shorts投稿
   */
  private async publishToYouTube(
    account: SocialMediaAccount,
    content: PostContent,
    options: PublishOptions
  ): Promise<PostResult> {
    try {
      // YouTube Data API v3統合 (Development)
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PUBLISHER === 'true') {
        return this.mockYouTubePublish(account, content)
      }

      // YouTube API呼び出し
      const response = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            snippet: {
              title: this.extractTitleFromCaption(content.caption),
              description: this.formatDescriptionForYouTube(content.caption, content.hashtags),
              tags: content.hashtags,
              categoryId: '24', // Entertainment
              defaultLanguage: 'ja'
            },
            status: {
              privacyStatus: content.privacy === 'public' ? 'public' : 'unlisted',
              selfDeclaredMadeForKids: false
            }
          })
        }
      )

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        platform: 'youtube',
        success: true,
        postId: data.id,
        postUrl: `https://www.youtube.com/watch?v=${data.id}`,
        publishedAt: new Date()
      }
    } catch (error) {
      return {
        platform: 'youtube',
        success: false,
        error: error instanceof Error ? error.message : 'YouTube publish failed'
      }
    }
  }

  /**
   * Twitter投稿
   */
  private async publishToTwitter(
    account: SocialMediaAccount,
    content: PostContent,
    options: PublishOptions
  ): Promise<PostResult> {
    try {
      // Twitter API v2統合 (Development)
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PUBLISHER === 'true') {
        return this.mockTwitterPublish(account, content)
      }

      // 1. メディアアップロード
      const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
        },
        body: new FormData() // video file upload
      })

      const mediaData = await mediaResponse.json()
      
      // 2. ツイート作成
      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: this.formatCaptionForTwitter(content.caption, content.hashtags),
          media: {
            media_ids: [mediaData.media_id_string]
          }
        })
      })

      const tweetData = await tweetResponse.json()
      
      if (tweetData.errors) {
        throw new Error(tweetData.errors[0].message)
      }

      return {
        platform: 'twitter',
        success: true,
        postId: tweetData.data.id,
        postUrl: `https://twitter.com/${account.accountName}/status/${tweetData.data.id}`,
        publishedAt: new Date()
      }
    } catch (error) {
      return {
        platform: 'twitter',
        success: false,
        error: error instanceof Error ? error.message : 'Twitter publish failed'
      }
    }
  }

  /**
   * プラットフォーム向けコンテンツ最適化
   */
  private async optimizeContentForPlatform(
    content: PostContent,
    platform: SocialPlatform
  ): Promise<PostContent> {
    const config = PLATFORM_CONFIGS[platform]
    
    return {
      ...content,
      caption: this.optimizeCaptionForPlatform(content.caption, config),
      hashtags: content.hashtags.slice(0, config.hashtagLimit)
    }
  }

  /**
   * コンテンツ検証
   */
  private validateContentForPlatform(content: PostContent, config: SocialPlatformConfig): void {
    if (content.caption.length > config.captionMaxLength) {
      throw new Error(`Caption exceeds maximum length for ${config.displayName} (${config.captionMaxLength} characters)`)
    }
    
    if (content.hashtags.length > config.hashtagLimit) {
      throw new Error(`Too many hashtags for ${config.displayName} (max ${config.hashtagLimit})`)
    }
  }

  /**
   * プラットフォーム固有のキャプション最適化
   */
  private optimizeCaptionForPlatform(caption: string, config: SocialPlatformConfig): string {
    if (caption.length <= config.captionMaxLength) {
      return caption
    }
    
    return caption.substring(0, config.captionMaxLength - 3) + '...'
  }

  /**
   * TikTok用キャプション
   */
  private formatCaptionForTikTok(caption: string, hashtags: string[]): string {
    const formattedHashtags = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
    return `${caption}\n\n${formattedHashtags}`
  }

  /**
   * Instagram用キャプション
   */
  private formatCaptionForInstagram(caption: string, hashtags: string[]): string {
    const formattedHashtags = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
    return `${caption}\n\n${formattedHashtags}`
  }

  /**
   * YouTube用説明文
   */
  private formatDescriptionForYouTube(caption: string, hashtags: string[]): string {
    const formattedHashtags = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
    return `${caption}\n\n${formattedHashtags}\n\n#Shorts`
  }

  /**
   * Twitter用キャプション
   */
  private formatCaptionForTwitter(caption: string, hashtags: string[]): string {
    const maxCaptionLength = 280 - hashtags.reduce((acc, tag) => acc + tag.length + 2, 0) // +2 for # and space
    const truncatedCaption = caption.length > maxCaptionLength 
      ? caption.substring(0, maxCaptionLength - 3) + '...'
      : caption
    
    const formattedHashtags = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
    return `${truncatedCaption} ${formattedHashtags}`.trim()
  }

  /**
   * YouTubeタイトル抽出
   */
  private extractTitleFromCaption(caption: string): string {
    const firstLine = caption.split('\n')[0]
    return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine
  }

  /**
   * 投稿結果保存
   */
  private async savePostResults(userId: string, results: PostResult[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('post_results')
        .insert(
          results.map(result => ({
            user_id: userId,
            platform: result.platform,
            success: result.success,
            post_id: result.postId,
            post_url: result.postUrl,
            error_message: result.error,
            published_at: result.publishedAt,
            created_at: new Date()
          }))
        )

      if (error) {
        console.error('Failed to save post results:', error)
      }
    } catch (error) {
      console.error('Error saving post results:', error)
    }
  }

  /**
   * Mock implementations for development
   */
  private mockTikTokPublish(account: SocialMediaAccount, content: PostContent): PostResult {
    const mockId = `tiktok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      platform: 'tiktok',
      success: true,
      postId: mockId,
      postUrl: `https://www.tiktok.com/@${account.accountName}/video/${mockId}`,
      publishedAt: new Date()
    }
  }

  private mockInstagramPublish(account: SocialMediaAccount, content: PostContent): PostResult {
    const mockId = `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      platform: 'instagram',
      success: true,
      postId: mockId,
      postUrl: `https://www.instagram.com/p/${mockId}/`,
      publishedAt: new Date()
    }
  }

  private mockYouTubePublish(account: SocialMediaAccount, content: PostContent): PostResult {
    const mockId = `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      platform: 'youtube',
      success: true,
      postId: mockId,
      postUrl: `https://www.youtube.com/watch?v=${mockId}`,
      publishedAt: new Date()
    }
  }

  private mockTwitterPublish(account: SocialMediaAccount, content: PostContent): PostResult {
    const mockId = `tw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      platform: 'twitter',
      success: true,
      postId: mockId,
      postUrl: `https://twitter.com/${account.accountName}/status/${mockId}`,
      publishedAt: new Date()
    }
  }
}