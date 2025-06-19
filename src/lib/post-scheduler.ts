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
  private scheduledPosts: Map<string, ScheduledPost> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private isProcessing = false
  private isRunning = false

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

  private scheduleInMemory(postId: string, scheduledTime: Date): void {
    const delay = scheduledTime.getTime() - Date.now()
    
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.executeScheduledPost(postId)
        this.scheduledTasks.delete(postId)
      }, delay)
      
      this.scheduledTasks.set(postId, timeout)
    }
  }

  private async executeScheduledPost(postId: string): Promise<void> {
    try {
      // Update status to publishing
      await supabaseAdmin
        .from('scheduled_posts')
        .update({ 
          status: 'publishing',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      // Get post details
      const { data: post } = await supabaseAdmin
        .from('scheduled_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (!post) {
        throw new Error(`Post ${postId} not found`)
      }

      // Execute post via SocialPublisher
      const socialPublisher = new SocialPublisher()
      await socialPublisher.publishToMultiplePlatforms(
        post.platforms,
        post.content,
        post.user_id
      )

      // Update status to published
      await supabaseAdmin
        .from('scheduled_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

    } catch (error) {
      console.error(`Failed to execute scheduled post ${postId}:`, error)
      
      await supabaseAdmin
        .from('scheduled_posts')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
    }
  }

  async getOptimalPostingTimes(
    userId: string,
    platforms: SocialPlatform[]
  ): Promise<OptimalPostingTime[]> {
    // Mock implementation - in real app, this would analyze user's audience data
    const baseHours = [9, 12, 15, 18, 21] // Peak engagement hours
    const optimalTimes: OptimalPostingTime[] = []

    platforms.forEach(platform => {
      baseHours.forEach((hour, index) => {
        optimalTimes.push({
          platform,
          dayOfWeek: new Date().getDay(),
          hour,
          engagementScore: 8.5 - (index * 0.5),
          audienceSize: 1000 + (index * 200)
        })
      })
    })

    return optimalTimes.sort((a, b) => b.engagementScore - a.engagementScore)
  }

  async cancelScheduledPost(postId: string): Promise<boolean> {
    try {
      // Cancel in database
      await supabaseAdmin
        .from('scheduled_posts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      // Cancel in memory
      const timeout = this.scheduledTasks.get(postId)
      if (timeout) {
        clearTimeout(timeout)
        this.scheduledTasks.delete(postId)
      }

      return true
    } catch (error) {
      console.error(`Failed to cancel post ${postId}:`, error)
      return false
    }
  }

  async getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    try {
      const { data: posts, error } = await supabaseAdmin
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true })

      if (error) {
        throw new Error(`Failed to get scheduled posts: ${error.message}`)
      }

      return posts.map(post => ({
        id: post.id,
        userId: post.user_id,
        segmentId: post.segment_id,
        platforms: post.platforms,
        content: post.content,
        scheduledTime: new Date(post.scheduled_time),
        timezone: post.timezone,
        status: post.status,
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
        retryCount: post.retry_count || 0
      }))
    } catch (error) {
      console.error('Failed to get scheduled posts:', error)
      return []
    }
  }
}

// Global instance
export const postScheduler = new PostScheduler()