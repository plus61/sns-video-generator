import { SocialMediaAccount, PostContent, PostResult } from '@/types/social-platform'

export interface TikTokVideoUploadParams {
  video_url: string
  text: string
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIEND' | 'SELF'
  disable_duet: boolean
  disable_stitch: boolean
  disable_comment: boolean
  auto_add_music?: boolean
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
}

export interface TikTokAPIResponse {
  data?: {
    share_id: string
    share_url: string
    create_time: number
  }
  error?: {
    code: string
    message: string
    log_id: string
  }
}

export interface TikTokUserInfo {
  open_id: string
  union_id: string
  avatar_url: string
  avatar_url_100: string
  avatar_large_url: string
  display_name: string
  bio_description: string
  profile_deep_link: string
  is_verified: boolean
  follower_count: number
  following_count: number
  likes_count: number
  video_count: number
}

export class TikTokAPI {
  private baseUrl = 'https://open-api.tiktok.com'
  private apiVersion = 'v1.3'

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {}

  /**
   * OAuth認証URL生成
   */
  generateAuthUrl(state: string, scopes: string[] = []): string {
    const defaultScopes = [
      'user.info.basic',
      'video.upload',
      'video.publish'
    ]
    
    const allScopes = [...defaultScopes, ...scopes].join(',')
    
    const params = new URLSearchParams({
      client_key: this.clientId,
      scope: allScopes,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: state
    })

    return `${this.baseUrl}/platform/oauth/connect/?${params.toString()}`
  }

  /**
   * アクセストークン取得
   */
  async getAccessToken(code: string): Promise<{
    access_token: string
    expires_in: number
    refresh_token: string
    refresh_expires_in: number
    scope: string
    token_type: string
    open_id: string
  }> {
    const response = await fetch(`${this.baseUrl}/oauth/access_token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok OAuth error: ${data.error_description}`)
    }

    return data.data
  }

  /**
   * トークンリフレッシュ
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string
    expires_in: number
    refresh_token: string
    refresh_expires_in: number
  }> {
    const response = await fetch(`${this.baseUrl}/oauth/refresh_token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok token refresh error: ${data.error_description}`)
    }

    return data.data
  }

  /**
   * ユーザー情報取得
   */
  async getUserInfo(accessToken: string, openId: string): Promise<TikTokUserInfo> {
    const params = new URLSearchParams({
      access_token: accessToken,
      open_id: openId,
      fields: 'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count'
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/user/info/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message}`)
    }

    return data.data.user
  }

  /**
   * 動画アップロード
   */
  async uploadVideo(
    accessToken: string,
    openId: string,
    videoUrl: string,
    params: Partial<TikTokVideoUploadParams>
  ): Promise<TikTokAPIResponse> {
    const uploadParams = {
      access_token: accessToken,
      open_id: openId,
      ...params,
      video_url: videoUrl
    }

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/post/publish/video/init/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadParams)
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok upload error: ${data.error.message}`)
    }

    return data
  }

  /**
   * 動画情報取得
   */
  async getVideoInfo(accessToken: string, shareId: string): Promise<{
    create_time: number
    cover_image_url: string
    share_url: string
    video_description: string
    duration: number
    height: number
    width: number
    title: string
    embed_html: string
    embed_link: string
    like_count: number
    comment_count: number
    share_count: number
    view_count: number
  }> {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count'
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/video/query/?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            video_ids: [shareId]
          }
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok video info error: ${data.error.message}`)
    }

    return data.data.videos[0]
  }

  /**
   * 動画リスト取得
   */
  async getUserVideos(
    accessToken: string,
    openId: string,
    cursor?: string,
    maxCount: number = 20
  ): Promise<{
    videos: Array<{
      id: string
      create_time: number
      cover_image_url: string
      share_url: string
      video_description: string
      duration: number
      height: number
      width: number
      title: string
      like_count: number
      comment_count: number
      share_count: number
      view_count: number
    }>
    cursor: string
    has_more: boolean
  }> {
    const params = new URLSearchParams({
      access_token: accessToken,
      open_id: openId,
      max_count: maxCount.toString(),
      fields: 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,like_count,comment_count,share_count,view_count'
    })

    if (cursor) {
      params.append('cursor', cursor)
    }

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/video/list/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok video list error: ${data.error.message}`)
    }

    return data.data
  }

  /**
   * 投稿削除
   */
  async deleteVideo(accessToken: string, openId: string, videoId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/post/publish/video/delete/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          open_id: openId,
          video_id: videoId
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok delete error: ${data.error.message}`)
    }
  }

  /**
   * アナリティクス取得
   */
  async getVideoAnalytics(
    accessToken: string,
    videoIds: string[],
    metrics: string[] = ['video_views', 'likes', 'comments', 'shares']
  ): Promise<Record<string, Record<string, number>>> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/research/video/comment/list/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          video_ids: videoIds,
          metrics: metrics
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`TikTok analytics error: ${data.error.message}`)
    }

    return data.data
  }
}