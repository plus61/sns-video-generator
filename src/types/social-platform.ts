export interface SocialPlatformConfig {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  maxFileSize: number // bytes
  maxDuration: number // seconds
  supportedFormats: string[]
  aspectRatios: {
    width: number
    height: number
    label: string
  }[]
  captionMaxLength: number
  hashtagLimit: number
  features: {
    scheduling: boolean
    analytics: boolean
    multipleVideos: boolean
    stories: boolean
    reels: boolean
  }
}

export interface SocialMediaAccount {
  id: string
  userId: string
  platform: SocialPlatform
  accountName: string
  displayName: string
  profilePicture?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  accountId: string
  isActive: boolean
  lastSync?: Date
  followerCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface PostContent {
  videoPath: string
  thumbnailPath?: string
  caption: string
  hashtags: string[]
  mentions: string[]
  location?: {
    name: string
    latitude?: number
    longitude?: number
  }
  privacy: 'public' | 'private' | 'friends' | 'unlisted'
  allowComments: boolean
  allowDuet?: boolean // TikTok specific
  allowStitch?: boolean // TikTok specific
  brandContentTag?: boolean // Instagram specific
  crosspostToFeed?: boolean // Instagram Reels specific
}

export interface ScheduledPost {
  id: string
  userId: string
  segmentId: string
  platforms: SocialPlatform[]
  content: PostContent
  scheduledTime: Date
  timezone: string
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled'
  publishResults?: PostResult[]
  createdAt: Date
  updatedAt: Date
  retryCount: number
  lastError?: string
}

export interface PostResult {
  platform: SocialPlatform
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
  publishedAt?: Date
  analytics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    engagementRate?: number
  }
}

export interface PostTemplate {
  id: string
  userId: string
  name: string
  description?: string
  platforms: SocialPlatform[]
  captionTemplate: string
  hashtagSets: {
    name: string
    tags: string[]
  }[]
  defaultSettings: {
    privacy: PostContent['privacy']
    allowComments: boolean
    allowDuet?: boolean
    allowStitch?: boolean
  }
  isDefault: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter'

export interface PlatformAPICredentials {
  tiktok: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
  instagram: {
    appId: string
    appSecret: string
    redirectUri: string
  }
  youtube: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
  twitter: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessTokenSecret: string
  }
}

export interface PublishOptions {
  immediate?: boolean
  scheduledTime?: Date
  timezone?: string
  dryRun?: boolean
  template?: string
  optimizeForPlatform?: boolean
}

export interface PlatformOptimization {
  aspectRatio: {
    width: number
    height: number
  }
  resolution: {
    width: number
    height: number
  }
  bitrate: number
  frameRate: number
  audioCodec: string
  videoCodec: string
}

export interface PostAnalytics {
  platform: SocialPlatform
  postId: string
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    saves?: number
    engagementRate: number
    reachRate: number
    clickThroughRate?: number
  }
  demographics?: {
    ageGroups: Record<string, number>
    genders: Record<string, number>
    locations: Record<string, number>
  }
  timeSeriesData?: {
    timestamp: Date
    views: number
    engagement: number
  }[]
  lastUpdated: Date
}