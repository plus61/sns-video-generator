import { 
  ScheduledPost, 
  PostContent, 
  SocialPlatform, 
  SocialMediaAccount 
} from '@/types/social-platform'
import { SocialPublisher } from './social-publisher'
import { supabaseAdmin } from './supabase'

export interface ScheduleOptions {
  timezone: string
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly'
  repeatUntil?: Date
  retryAttempts: number
  retryDelay: number
}

export interface OptimalPostingTime {
  platform: SocialPlatform
  dayOfWeek: number
  hour: number
  engagementScore: number
  audienceSize: number
}

export class PostScheduler {
  private static instance: PostScheduler
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map()
  private isProcessing = false

  public static getInstance(): PostScheduler {
    if (!PostScheduler.instance) {
      PostScheduler.instance = new PostScheduler()
    }
    return PostScheduler.instance
  }

  async schedulePost(
    userId: string,
    segmentId: string,
    platforms: SocialPlatform[],
    content: PostContent,
    scheduledTime: Date,
    options: ScheduleOptions
  ): Promise<ScheduledPost> {
    const { data: scheduledPost, error } = await supabaseAdmin
      .from('scheduled_posts')
      .insert({
        user_id: userId,
        segment_id: segmentId,
        platforms: platforms,
        content: content,
        scheduled_time: scheduledTime.toISOString(),
        timezone: options.timezone,
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to schedule post: ${error.message}`)
    }

    this.scheduleInMemory(scheduledPost.id, scheduledTime)

    return {
      id: scheduledPost.id,
      userId,
      segmentId,
      platforms,
      content,
      scheduledTime,
      timezone: options.timezone,
      status: 'pending',
      createdAt: new Date(scheduledPost.created_at),
      updatedAt: new Date(scheduledPost.updated_at),
      retryCount: 0
    }
  }

  // Schedule multiple posts for optimal timing
  scheduleOptimalPosts(
    platforms: string[],
    postData: ScheduledPost['postData'],
    count: number = 1,
    timeRange: { start: Date; end: Date }
  ): string[] {
    const optimalTimes = this.calculateOptimalPostTimes(platforms, count, timeRange)
    const postIds: string[] = []

    optimalTimes.forEach(time => {
      const postId = this.schedulePost(platforms, postData, time)
      postIds.push(postId)
    })

    return postIds
  }

  // Calculate optimal posting times based on platform and engagement data
  private calculateOptimalPostTimes(
    platforms: string[],
    count: number,
    timeRange: { start: Date; end: Date }
  ): Date[] {
    const optimalTimes: Date[] = []
    const platformOptimalHours: Record<string, number[]> = {
      youtube: [14, 15, 16, 17, 18, 19, 20], // 2-8 PM
      tiktok: [6, 10, 19, 20, 21], // 6 AM, 10 AM, 7-9 PM
      instagram: [11, 13, 17, 18, 19], // 11 AM, 1 PM, 5-7 PM
      twitter: [8, 9, 12, 13, 17, 18] // 8-9 AM, 12-1 PM, 5-6 PM
    }

    // Find common optimal hours across all platforms
    const commonHours = platforms.reduce((hours, platform) => {
      const platformHours = platformOptimalHours[platform] || [12, 15, 18]
      return hours.filter(hour => platformHours.includes(hour))
    }, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])

    // Generate optimal times within the range
    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < count && i < daysInRange * commonHours.length; i++) {
      const dayOffset = Math.floor(i / commonHours.length)
      const hourIndex = i % commonHours.length
      const hour = commonHours[hourIndex]

      const postTime = new Date(start)
      postTime.setDate(postTime.getDate() + dayOffset)
      postTime.setHours(hour, 0, 0, 0)

      if (postTime <= end) {
        optimalTimes.push(postTime)
      }
    }

    return optimalTimes.sort((a, b) => a.getTime() - b.getTime())
  }

  // Cancel a scheduled post
  cancelPost(postId: string): boolean {
    const post = this.scheduledPosts.get(postId)
    if (!post || post.status !== 'pending') {
      return false
    }

    post.status = 'cancelled'
    this.clearTimer(postId)
    this.saveScheduledPosts()

    return true
  }

  // Update a scheduled post
  updatePost(
    postId: string,
    updates: Partial<Pick<ScheduledPost, 'platforms' | 'postData' | 'scheduledTime'>>
  ): boolean {
    const post = this.scheduledPosts.get(postId)
    if (!post || post.status !== 'pending') {
      return false
    }

    // Update post data
    Object.assign(post, updates)

    // Reschedule if time changed
    if (updates.scheduledTime) {
      this.clearTimer(postId)
      this.scheduleTimer(postId, updates.scheduledTime)
    }

    this.saveScheduledPosts()
    return true
  }

  // Get all scheduled posts
  getAllScheduledPosts(): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values()).sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    )
  }

  // Get posts by status
  getPostsByStatus(status: ScheduledPost['status']): ScheduledPost[] {
    return this.getAllScheduledPosts().filter(post => post.status === status)
  }

  // Get upcoming posts (next 24 hours)
  getUpcomingPosts(): ScheduledPost[] {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return this.getAllScheduledPosts().filter(
      post => post.status === 'pending' && 
               post.scheduledTime >= now && 
               post.scheduledTime <= tomorrow
    )
  }

  // Execute a scheduled post
  private async executePost(postId: string): Promise<void> {
    const post = this.scheduledPosts.get(postId)
    if (!post || post.status !== 'pending') {
      return
    }

    post.status = 'posting'
    this.saveScheduledPosts()

    try {
      const { socialMediaIntegration } = await import('./social-media-integration')
      const results: Array<{
        platform: string
        success: boolean
        postId?: string
        url?: string
        error?: string
      }> = []

      // Post to each platform
      for (const platform of post.platforms) {
        try {
          let result

          switch (platform) {
            case 'youtube':
              result = await socialMediaIntegration.postToYouTube(post.postData)
              break
            case 'tiktok':
              result = await socialMediaIntegration.postToTikTok(post.postData)
              break
            case 'instagram':
              result = await socialMediaIntegration.postToInstagram(post.postData)
              break
            default:
              result = { success: false, error: `Platform ${platform} not supported` }
          }

          results.push({
            platform,
            success: result.success,
            postId: result.postId,
            url: result.url,
            error: result.error
          })

        } catch (error) {
          results.push({
            platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Update post with results
      post.results = results
      const allSuccessful = results.every(result => result.success)
      
      if (allSuccessful) {
        post.status = 'completed'
      } else {
        post.status = 'failed'
        
        // Schedule retry if within retry limit
        if (post.retryCount < post.maxRetries) {
          post.retryCount++
          post.status = 'pending'
          
          // Schedule retry in 5 minutes
          const retryTime = new Date(Date.now() + 5 * 60 * 1000)
          post.scheduledTime = retryTime
          this.scheduleTimer(postId, retryTime)
        }
      }

    } catch (error) {
      post.status = 'failed'
      post.results = [{
        platform: 'all',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    }

    this.saveScheduledPosts()
    this.notifyPostCompletion(post)
  }

  // Timer management
  private scheduleTimer(postId: string, scheduledTime: Date): void {
    const delay = scheduledTime.getTime() - Date.now()
    
    if (delay <= 0) {
      // Execute immediately if time has passed
      this.executePost(postId)
      return
    }

    const timer = setTimeout(() => {
      this.executePost(postId)
      this.timers.delete(postId)
    }, delay)

    this.timers.set(postId, timer)
  }

  private clearTimer(postId: string): void {
    const timer = this.timers.get(postId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(postId)
    }
  }

  // Scheduler lifecycle
  private startScheduler(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    
    // Reschedule pending posts on startup
    this.scheduledPosts.forEach((post, postId) => {
      if (post.status === 'pending') {
        this.scheduleTimer(postId, post.scheduledTime)
      }
    })

    // Clean up old posts every hour
    setInterval(() => {
      this.cleanupOldPosts()
    }, 60 * 60 * 1000)
  }

  stopScheduler(): void {
    this.isRunning = false
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }

  // Cleanup old posts (older than 30 days)
  private cleanupOldPosts(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    this.scheduledPosts.forEach((post, postId) => {
      if (post.createdAt < thirtyDaysAgo && 
          (post.status === 'completed' || post.status === 'failed' || post.status === 'cancelled')) {
        this.scheduledPosts.delete(postId)
      }
    })

    this.saveScheduledPosts()
  }

  // Notification system
  private notifyPostCompletion(post: ScheduledPost): void {
    // In a real application, this would send notifications via email, webhook, etc.
    console.log(`Post ${post.id} completed with status: ${post.status}`)
    
    // Trigger custom events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('postCompleted', {
        detail: { post }
      }))
    }
  }

  // Storage management
  private saveScheduledPosts(): void {
    try {
      const postsData = Array.from(this.scheduledPosts.entries()).map(([, post]) => ({
        ...post,
        scheduledTime: post.scheduledTime.toISOString(),
        createdAt: post.createdAt.toISOString()
      }))
      
      localStorage.setItem('scheduled_posts', JSON.stringify(postsData))
    } catch (error) {
      console.warn('Failed to save scheduled posts:', error)
    }
  }

  private loadScheduledPosts(): void {
    try {
      const stored = localStorage.getItem('scheduled_posts')
      if (!stored) return

      const postsData = JSON.parse(stored)
      
      postsData.forEach((data: Record<string, unknown>) => {
        const post: ScheduledPost = {
          ...(data as Omit<ScheduledPost, 'scheduledTime' | 'createdAt'>),
          scheduledTime: new Date(data.scheduledTime as string),
          createdAt: new Date(data.createdAt as string)
        }
        
        this.scheduledPosts.set(data.id as string, post)
      })
    } catch (error) {
      console.warn('Failed to load scheduled posts:', error)
    }
  }

  // Utility methods
  private generatePostId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Analytics and reporting
  getPostingStats(timeRange?: { start: Date; end: Date }): {
    totalPosts: number
    successfulPosts: number
    failedPosts: number
    platformBreakdown: Record<string, { total: number; successful: number }>
  } {
    const posts = timeRange 
      ? this.getAllScheduledPosts().filter(post => 
          post.createdAt >= timeRange.start && post.createdAt <= timeRange.end
        )
      : this.getAllScheduledPosts()

    const stats = {
      totalPosts: posts.length,
      successfulPosts: 0,
      failedPosts: 0,
      platformBreakdown: {} as Record<string, { total: number; successful: number }>
    }

    posts.forEach(post => {
      if (post.status === 'completed') stats.successfulPosts++
      if (post.status === 'failed') stats.failedPosts++

      post.platforms.forEach(platform => {
        if (!stats.platformBreakdown[platform]) {
          stats.platformBreakdown[platform] = { total: 0, successful: 0 }
        }
        
        stats.platformBreakdown[platform].total++
        
        const platformResult = post.results?.find(r => r.platform === platform)
        if (platformResult?.success) {
          stats.platformBreakdown[platform].successful++
        }
      })
    })

    return stats
  }
}

// Global instance
export const postScheduler = new PostScheduler()