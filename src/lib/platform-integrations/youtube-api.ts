export interface YouTubeVideo {
  kind: 'youtube#video'
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
      standard?: { url: string; width: number; height: number }
      maxres?: { url: string; width: number; height: number }
    }
    channelTitle: string
    tags?: string[]
    categoryId: string
    liveBroadcastContent: string
    defaultLanguage?: string
    localized: {
      title: string
      description: string
    }
    defaultAudioLanguage?: string
  }
  status: {
    uploadStatus: 'deleted' | 'failed' | 'processed' | 'rejected' | 'uploaded'
    failureReason?: 'codec' | 'conversion' | 'emptyFile' | 'invalidFile' | 'tooSmall' | 'uploadAborted'
    rejectionReason?: 'claim' | 'copyright' | 'duplicate' | 'inappropriate' | 'legal' | 'length' | 'termsOfUse' | 'trademark' | 'uploaderAccountClosed' | 'uploaderAccountSuspended'
    privacyStatus: 'private' | 'public' | 'unlisted'
    publishAt?: string
    license: 'creativeCommon' | 'youtube'
    embeddable: boolean
    publicStatsViewable: boolean
    madeForKids: boolean
    selfDeclaredMadeForKids: boolean
  }
  statistics?: {
    viewCount: string
    likeCount: string
    dislikeCount: string
    favoriteCount: string
    commentCount: string
  }
  contentDetails?: {
    duration: string
    dimension: string
    definition: string
    caption: string
    licensedContent: boolean
    regionRestriction?: {
      allowed?: string[]
      blocked?: string[]
    }
    contentRating: {
      acbRating?: string
      agcomRating?: string
      anatelRating?: string
      bbfcRating?: string
      bfvcRating?: string
      bmukkRating?: string
      catvRating?: string
      catvfrRating?: string
      cbfcRating?: string
      cccRating?: string
      cceRating?: string
      chfilmRating?: string
      chvrsRating?: string
      cicfRating?: string
      cnaRating?: string
      cncRating?: string
      csaRating?: string
      cscfRating?: string
      czfilmRating?: string
      djctqRating?: string
      djctqRatingReasons?: string[]
      ecbmctRating?: string
      eefilmRating?: string
      egfilmRating?: string
      eirinRating?: string
      fcbmRating?: string
      fcoRating?: string
      fmocRating?: string
      fpbRating?: string
      fpbRatingReasons?: string[]
      fskRating?: string
      grfilmRating?: string
      icaaRating?: string
      ifcoRating?: string
      ilfilmRating?: string
      incaaRating?: string
      kfcbRating?: string
      kijkwijzerRating?: string
      kmrbRating?: string
      lsfRating?: string
      mccaaRating?: string
      mccypRating?: string
      mcstRating?: string
      mdaRating?: string
      medietilsynetRating?: string
      mekuRating?: string
      mibacRating?: string
      mocRating?: string
      moctwRating?: string
      mpaaRating?: string
      mpaatRating?: string
      mtrcbRating?: string
      nbcRating?: string
      nbcplRating?: string
      nfrcRating?: string
      nfvcbRating?: string
      nkclvRating?: string
      oflcRating?: string
      pefilmRating?: string
      rcnofRating?: string
      resorteviolenciaRating?: string
      rtcRating?: string
      rteRating?: string
      russiaRating?: string
      skfilmRating?: string
      smaisRating?: string
      smsaRating?: string
      tvpgRating?: string
      ytRating?: string
    }
    projection: string
    hasCustomThumbnail?: boolean
  }
}

export interface YouTubeChannel {
  kind: 'youtube#channel'
  etag: string
  id: string
  snippet: {
    title: string
    description: string
    customUrl?: string
    publishedAt: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
    }
    defaultLanguage?: string
    localized: {
      title: string
      description: string
    }
    country?: string
  }
  statistics: {
    viewCount: string
    subscriberCount: string
    hiddenSubscriberCount: boolean
    videoCount: string
  }
  contentDetails: {
    relatedPlaylists: {
      likes?: string
      favorites?: string
      uploads: string
      watchHistory?: string
      watchLater?: string
    }
  }
  brandingSettings?: {
    channel: {
      title: string
      description: string
      keywords?: string
      trackingAnalyticsAccountId?: string
      moderateComments?: boolean
      unsubscribedTrailer?: string
      defaultLanguage?: string
      country?: string
    }
    image: {
      bannerExternalUrl?: string
      bannerMobileImageUrl?: string
      bannerTabletLowImageUrl?: string
      bannerTabletImageUrl?: string
      bannerTabletHdImageUrl?: string
      bannerTabletExtraHdImageUrl?: string
      bannerMobileLowImageUrl?: string
      bannerMobileMediumHdImageUrl?: string
      bannerMobileHdImageUrl?: string
      bannerMobileExtraHdImageUrl?: string
      bannerTvImageUrl?: string
      bannerTvLowImageUrl?: string
      bannerTvMediumImageUrl?: string
      bannerTvHighImageUrl?: string
    }
  }
}

export interface YouTubeVideoInsert {
  snippet: {
    title: string
    description: string
    tags?: string[]
    categoryId?: string
    defaultLanguage?: string
    defaultAudioLanguage?: string
  }
  status: {
    privacyStatus: 'private' | 'public' | 'unlisted'
    embeddable?: boolean
    license?: 'youtube' | 'creativeCommon'
    publicStatsViewable?: boolean
    publishAt?: string
    selfDeclaredMadeForKids?: boolean
  }
  recordingDetails?: {
    recordingDate?: string
    locationDescription?: string
    location?: {
      latitude: number
      longitude: number
      altitude?: number
    }
  }
}

export class YouTubeAPI {
  private baseUrl = 'https://www.googleapis.com'
  private uploadUrl = 'https://www.googleapis.com/upload'
  private apiVersion = 'v3'

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
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner'
    ]
    
    const allScopes = [...defaultScopes, ...scopes].join(' ')
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: allScopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * アクセストークン取得
   */
  async getAccessToken(code: string): Promise<{
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    token_type: string
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code: code
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube OAuth error: ${data.error_description}`)
    }

    return data
  }

  /**
   * トークンリフレッシュ
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string
    expires_in: number
    scope: string
    token_type: string
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube token refresh error: ${data.error_description}`)
    }

    return data
  }

  /**
   * チャンネル情報取得
   */
  async getChannelInfo(accessToken: string, channelId?: string): Promise<YouTubeChannel> {
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails,brandingSettings',
      access_token: accessToken
    })

    if (channelId) {
      params.append('id', channelId)
    } else {
      params.append('mine', 'true')
    }

    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/channels?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube channel info error: ${data.error.message}`)
    }

    return data.items[0]
  }

  /**
   * 動画アップロード
   */
  async uploadVideo(
    accessToken: string,
    videoFile: File | Blob,
    metadata: YouTubeVideoInsert,
    onProgress?: (progress: number) => void
  ): Promise<YouTubeVideo> {
    // 1. アップロードセッション開始
    const uploadResponse = await fetch(
      `${this.uploadUrl}/youtube/${this.apiVersion}/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoFile.size.toString(),
          'X-Upload-Content-Type': videoFile.type
        },
        body: JSON.stringify(metadata)
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(`YouTube upload init error: ${error.error.message}`)
    }

    const uploadUrl = uploadResponse.headers.get('location')
    if (!uploadUrl) {
      throw new Error('Upload URL not received')
    }

    // 2. ファイルアップロード
    const fileUploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': videoFile.type
      },
      body: videoFile
    })

    const data = await fileUploadResponse.json()
    
    if (data.error) {
      throw new Error(`YouTube upload error: ${data.error.message}`)
    }

    return data
  }

  /**
   * 動画情報取得
   */
  async getVideoInfo(accessToken: string, videoId: string): Promise<YouTubeVideo> {
    const params = new URLSearchParams({
      part: 'snippet,statistics,status,contentDetails',
      id: videoId,
      access_token: accessToken
    })

    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/videos?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube video info error: ${data.error.message}`)
    }

    return data.items[0]
  }

  /**
   * 動画一覧取得
   */
  async getChannelVideos(
    accessToken: string,
    channelId?: string,
    maxResults: number = 25,
    pageToken?: string
  ): Promise<{
    items: YouTubeVideo[]
    nextPageToken?: string
    prevPageToken?: string
    pageInfo: {
      totalResults: number
      resultsPerPage: number
    }
  }> {
    // まずチャンネルのアップロードプレイリストIDを取得
    const channel = await this.getChannelInfo(accessToken, channelId)
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads

    // プレイリストの動画を取得
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: maxResults.toString(),
      access_token: accessToken
    })

    if (pageToken) {
      params.append('pageToken', pageToken)
    }

    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/playlistItems?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube channel videos error: ${data.error.message}`)
    }

    // 動画IDsを取得
    const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId)
    
    // 動画詳細情報を取得
    const videosParams = new URLSearchParams({
      part: 'snippet,statistics,status,contentDetails',
      id: videoIds.join(','),
      access_token: accessToken
    })

    const videosResponse = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/videos?${videosParams.toString()}`
    )

    const videosData = await videosResponse.json()
    
    return {
      items: videosData.items,
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
      pageInfo: data.pageInfo
    }
  }

  /**
   * 動画更新
   */
  async updateVideo(
    accessToken: string,
    videoId: string,
    updates: Partial<YouTubeVideoInsert>
  ): Promise<YouTubeVideo> {
    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/videos?part=snippet,status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: videoId,
          ...updates
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube update error: ${data.error.message}`)
    }

    return data
  }

  /**
   * 動画削除
   */
  async deleteVideo(accessToken: string, videoId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/videos?id=${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`YouTube delete error: ${error.error.message}`)
    }
  }

  /**
   * 動画サムネイル設定
   */
  async setThumbnail(
    accessToken: string,
    videoId: string,
    thumbnailFile: File | Blob
  ): Promise<{ items: Array<{ default: any; medium: any; high: any }> }> {
    const response = await fetch(
      `${this.uploadUrl}/youtube/${this.apiVersion}/thumbnails/set?videoId=${videoId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': thumbnailFile.type
        },
        body: thumbnailFile
      }
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube thumbnail error: ${data.error.message}`)
    }

    return data
  }

  /**
   * 動画カテゴリ取得
   */
  async getVideoCategories(regionCode: string = 'JP'): Promise<Array<{
    id: string
    snippet: {
      channelId: string
      title: string
      assignable: boolean
    }
  }>> {
    const params = new URLSearchParams({
      part: 'snippet',
      regionCode: regionCode
    })

    const response = await fetch(
      `${this.baseUrl}/youtube/${this.apiVersion}/videoCategories?${params.toString()}`
    )

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube categories error: ${data.error.message}`)
    }

    return data.items
  }
}