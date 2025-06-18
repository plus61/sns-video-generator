export interface InstagramMediaContainer {
  id: string
  status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'
}

export interface InstagramMedia {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  caption?: string
  username: string
  comments_count: number
  like_count: number
  is_comment_enabled: boolean
  media_product_type: 'AD' | 'FEED' | 'STORY' | 'REELS'
}

export interface InstagramUserInfo {
  id: string
  username: string
  account_type: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL'
  media_count: number
  followers_count: number
  follows_count: number
  name: string
  profile_picture_url: string
  website?: string
  biography?: string
}

export interface InstagramInsight {
  name: string
  period: 'day' | 'week' | 'days_28' | 'lifetime'
  values: Array<{
    value: number
    end_time?: string
  }>
  title: string
  description: string
  id: string
}

export class InstagramAPI {
  private baseUrl = 'https://graph.facebook.com'
  private apiVersion = 'v18.0'

  constructor(
    private appId: string,
    private appSecret: string,
    private redirectUri: string
  ) {}

  /**
   * OAuth認証URL生成
   */
  generateAuthUrl(state: string, scopes: string[] = []): string {
    const defaultScopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement'
    ]
    
    const allScopes = [...defaultScopes, ...scopes].join(',')
    
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: allScopes,
      response_type: 'code',
      state: state
    })

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`
  }

  /**
   * アクセストークン取得
   */
  async getAccessToken(code: string): Promise<{
    access_token: string
    token_type: string
    expires_in?: number
  }> {
    const response = await fetch(`${this.baseUrl}/${this.apiVersion}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code: code
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram OAuth error: ${data.error.message}`)
    }

    return data
  }

  /**
   * 長期アクセストークン取得
   */
  async getLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string
    token_type: string
    expires_in: number
  }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/oauth/access_token?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram long-lived token error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Instagramアカウント情報取得
   */
  async getUserInfo(accessToken: string, userId: string): Promise<InstagramUserInfo> {
    const fields = [
      'id',
      'username',
      'account_type',
      'media_count',
      'followers_count',
      'follows_count',
      'name',
      'profile_picture_url',
      'website',
      'biography'
    ].join(',')

    const params = new URLSearchParams({
      fields: fields,
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${userId}?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram user info error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Instagramビジネスアカウント取得
   */
  async getInstagramBusinessAccounts(accessToken: string): Promise<Array<{
    id: string
    name: string
    instagram_business_account: {
      id: string
    }
  }>> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/me/accounts?access_token=${accessToken}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram business accounts error: ${data.error.message}`)
    }

    return data.data.filter((page: any) => page.instagram_business_account)
  }

  /**
   * メディアコンテナ作成（リール用）
   */
  async createReelsMediaContainer(
    accessToken: string,
    igUserId: string,
    videoUrl: string,
    caption?: string,
    coverUrl?: string,
    shareToFeed: boolean = true
  ): Promise<InstagramMediaContainer> {
    const params: Record<string, string> = {
      media_type: 'REELS',
      video_url: videoUrl,
      access_token: accessToken
    }

    if (caption) {
      params.caption = caption
    }

    if (coverUrl) {
      params.cover_url = coverUrl
    }

    params.share_to_feed = shareToFeed.toString()

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${igUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram create container error: ${data.error.message}`)
    }

    return data
  }

  /**
   * メディア公開
   */
  async publishMedia(
    accessToken: string,
    igUserId: string,
    creationId: string
  ): Promise<{ id: string }> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          creation_id: creationId,
          access_token: accessToken
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram publish error: ${data.error.message}`)
    }

    return data
  }

  /**
   * メディア状態確認
   */
  async getMediaStatus(
    accessToken: string,
    containerId: string
  ): Promise<InstagramMediaContainer> {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${containerId}?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram media status error: ${data.error.message}`)
    }

    return data
  }

  /**
   * メディア情報取得
   */
  async getMediaInfo(
    accessToken: string,
    mediaId: string
  ): Promise<InstagramMedia> {
    const fields = [
      'id',
      'media_type',
      'media_url',
      'permalink',
      'thumbnail_url',
      'timestamp',
      'caption',
      'username',
      'comments_count',
      'like_count',
      'is_comment_enabled',
      'media_product_type'
    ].join(',')

    const params = new URLSearchParams({
      fields: fields,
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${mediaId}?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram media info error: ${data.error.message}`)
    }

    return data
  }

  /**
   * ユーザーメディア一覧取得
   */
  async getUserMedia(
    accessToken: string,
    igUserId: string,
    limit: number = 25,
    after?: string
  ): Promise<{
    data: InstagramMedia[]
    paging?: {
      cursors?: {
        before: string
        after: string
      }
      next?: string
      previous?: string
    }
  }> {
    const fields = [
      'id',
      'media_type',
      'media_url',
      'permalink',
      'thumbnail_url',
      'timestamp',
      'caption',
      'username',
      'comments_count',
      'like_count',
      'media_product_type'
    ].join(',')

    const params = new URLSearchParams({
      fields: fields,
      limit: limit.toString(),
      access_token: accessToken
    })

    if (after) {
      params.append('after', after)
    }

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${igUserId}/media?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram user media error: ${data.error.message}`)
    }

    return data
  }

  /**
   * メディアインサイト取得
   */
  async getMediaInsights(
    accessToken: string,
    mediaId: string,
    metrics: string[] = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saved']
  ): Promise<{ data: InstagramInsight[] }> {
    const params = new URLSearchParams({
      metric: metrics.join(','),
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${mediaId}/insights?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram media insights error: ${data.error.message}`)
    }

    return data
  }

  /**
   * アカウントインサイト取得
   */
  async getAccountInsights(
    accessToken: string,
    igUserId: string,
    metrics: string[] = ['impressions', 'reach', 'profile_views'],
    period: 'day' | 'week' | 'days_28' = 'day',
    since?: string,
    until?: string
  ): Promise<{ data: InstagramInsight[] }> {
    const params = new URLSearchParams({
      metric: metrics.join(','),
      period: period,
      access_token: accessToken
    })

    if (since) params.append('since', since)
    if (until) params.append('until', until)

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${igUserId}/insights?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram account insights error: ${data.error.message}`)
    }

    return data
  }

  /**
   * ハッシュタグ検索
   */
  async searchHashtags(
    accessToken: string,
    igUserId: string,
    query: string
  ): Promise<{
    data: Array<{
      id: string
      name: string
    }>
  }> {
    const params = new URLSearchParams({
      user_id: igUserId,
      q: query,
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/ig_hashtag_search?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram hashtag search error: ${data.error.message}`)
    }

    return data
  }

  /**
   * メディア削除
   */
  async deleteMedia(accessToken: string, mediaId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${mediaId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram delete error: ${data.error.message}`)
    }

    return { success: true }
  }
}