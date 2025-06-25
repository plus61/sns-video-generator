/**
 * Progress Manager using Supabase Realtime for stateless environments
 * Replaces EventEmitter to work in Railway/serverless deployments
 */

import { supabaseAdmin } from './supabase'

export interface ProgressEvent {
  videoId: string
  type: 'upload' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
  timestamp: string
}

export class ProgressManager {
  private static channel: any = null

  /**
   * Initialize Supabase Realtime channel for progress updates
   */
  static async initialize() {
    if (this.channel) return

    try {
      this.channel = supabaseAdmin
        .channel('upload-progress')
        .on('broadcast', { event: 'progress' }, (payload) => {
          console.log('Progress broadcast received:', payload)
        })
        .subscribe()
    } catch (error) {
      console.error('Failed to initialize progress channel:', error)
    }
  }

  /**
   * Send progress update via Supabase Realtime
   */
  static async sendProgress(event: Omit<ProgressEvent, 'timestamp'>) {
    try {
      const progressEvent: ProgressEvent = {
        ...event,
        timestamp: new Date().toISOString()
      }

      // Store in database for persistence
      const { error: dbError } = await supabaseAdmin
        .from('upload_progress')
        .upsert({
          video_id: event.videoId,
          type: event.type,
          progress: event.progress,
          message: event.message,
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to store progress:', dbError)
      }

      // Broadcast via Realtime
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'progress',
          payload: progressEvent
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to send progress:', error)
      return { success: false, error }
    }
  }

  /**
   * Get latest progress for a video
   */
  static async getProgress(videoId: string): Promise<ProgressEvent | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('upload_progress')
        .select('*')
        .eq('video_id', videoId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return {
        videoId: data.video_id,
        type: data.type,
        progress: data.progress,
        message: data.message,
        timestamp: data.updated_at
      }
    } catch (error) {
      console.error('Failed to get progress:', error)
      return null
    }
  }

  /**
   * Subscribe to progress updates for a specific video
   */
  static subscribeToVideo(videoId: string, callback: (event: ProgressEvent) => void) {
    const channel = supabaseAdmin
      .channel(`progress-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'upload_progress',
          filter: `video_id=eq.${videoId}`
        },
        (payload) => {
          if (payload.new) {
            callback({
              videoId: payload.new.video_id,
              type: payload.new.type,
              progress: payload.new.progress,
              message: payload.new.message,
              timestamp: payload.new.updated_at
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabaseAdmin.removeChannel(channel)
    }
  }
}

// Initialize on module load
ProgressManager.initialize()