import { OpenAIVisionAnalyzer, VideoSegment, SegmentEvaluationCriteria, DEFAULT_SEGMENT_CRITERIA } from './vision-analyzer'
import { supabaseAdmin } from './supabase'
import fs from 'fs/promises'
import path from 'path'

export interface VideoAnalysisRequest {
  videoId: string
  videoPath: string
  duration: number
  userId: string
  criteria?: SegmentEvaluationCriteria
}

export interface VideoAnalysisResult {
  success: boolean
  videoId: string
  totalFramesAnalyzed: number
  segmentsFound: number
  topSegments: VideoSegment[]
  processingTime: number
  error?: string
}

export interface AnalysisProgress {
  stage: 'extracting' | 'analyzing' | 'evaluating' | 'saving' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  currentFrame?: number
  totalFrames?: number
}

export class VideoAnalysisService {
  private analyzer: OpenAIVisionAnalyzer
  private progressCallbacks: Map<string, (progress: AnalysisProgress) => void>

  constructor() {
    this.analyzer = new OpenAIVisionAnalyzer()
    this.progressCallbacks = new Map()
  }

  /**
   * Register progress callback for real-time updates
   */
  onProgress(videoId: string, callback: (progress: AnalysisProgress) => void): void {
    this.progressCallbacks.set(videoId, callback)
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(videoId: string): void {
    this.progressCallbacks.delete(videoId)
  }

  /**
   * Send progress update
   */
  private updateProgress(videoId: string, progress: AnalysisProgress): void {
    const callback = this.progressCallbacks.get(videoId)
    if (callback) {
      callback(progress)
    }
  }

  /**
   * Analyze video and extract optimal segments
   */
  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResult> {
    const startTime = Date.now()
    const { videoId, videoPath, duration, userId, criteria = DEFAULT_SEGMENT_CRITERIA } = request

    try {
      // Update video status to analyzing
      await this.updateVideoStatus(videoId, 'analyzing', 'Starting AI video analysis')

      this.updateProgress(videoId, {
        stage: 'extracting',
        progress: 0,
        message: 'Extracting frames from video...'
      })

      // Step 1: Extract frames
      console.log(`Starting analysis for video ${videoId} (${duration}s duration)`)
      const frames = await this.analyzer.extractFrames(videoPath, duration)
      
      if (frames.length === 0) {
        throw new Error('No frames could be extracted from video')
      }

      this.updateProgress(videoId, {
        stage: 'analyzing',
        progress: 20,
        message: `Analyzing ${frames.length} frames with AI vision...`,
        totalFrames: frames.length
      })

      // Step 2: Analyze frames with AI
      const frameAnalyses = await this.analyzer.analyzeFramesBatch(frames)

      this.updateProgress(videoId, {
        stage: 'evaluating',
        progress: 70,
        message: 'Evaluating segments and calculating engagement scores...'
      })

      // Step 3: Evaluate segments
      const segments = this.analyzer.evaluateSegments(frameAnalyses, criteria, duration)

      this.updateProgress(videoId, {
        stage: 'saving',
        progress: 90,
        message: 'Saving analysis results to database...'
      })

      // Step 4: Save results to database
      await this.saveAnalysisResults(videoId, segments, frameAnalyses.length)

      // Step 5: Update video status
      await this.updateVideoStatus(videoId, 'completed', `Analysis completed. Found ${segments.length} segments.`)

      const processingTime = Date.now() - startTime

      this.updateProgress(videoId, {
        stage: 'completed',
        progress: 100,
        message: `Analysis completed successfully! Found ${segments.length} engaging segments.`
      })

      // Cleanup temporary files
      await this.analyzer.cleanup()

      console.log(`Video analysis completed for ${videoId} in ${processingTime}ms`)

      return {
        success: true,
        videoId,
        totalFramesAnalyzed: frameAnalyses.length,
        segmentsFound: segments.length,
        topSegments: segments.slice(0, 5), // Return top 5 segments
        processingTime
      }

    } catch (error) {
      console.error(`Video analysis failed for ${videoId}:`, error)
      
      // Update video status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error'
      await this.updateVideoStatus(videoId, 'error', errorMessage)

      this.updateProgress(videoId, {
        stage: 'error',
        progress: 0,
        message: `Analysis failed: ${errorMessage}`
      })

      // Cleanup on error
      await this.analyzer.cleanup()

      return {
        success: false,
        videoId,
        totalFramesAnalyzed: 0,
        segmentsFound: 0,
        topSegments: [],
        processingTime: Date.now() - startTime,
        error: errorMessage
      }
    }
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(
    videoId: string, 
    segments: VideoSegment[], 
    totalFrames: number
  ): Promise<void> {
    try {
      // Save analysis metadata
      const { error: analysisError } = await supabaseAdmin
        .from('video_uploads')
        .update({
          analysis_data: {
            totalFramesAnalyzed: totalFrames,
            segmentsFound: segments.length,
            analysisTimestamp: new Date().toISOString(),
            topSegmentScore: segments.length > 0 ? segments[0].engagementScore : 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      if (analysisError) {
        throw new Error(`Failed to update analysis data: ${analysisError.message}`)
      }

      // Save individual segments
      if (segments.length > 0) {
        const segmentInserts = segments.map(segment => ({
          id: crypto.randomUUID(),
          video_upload_id: videoId,
          start_time: Math.round(segment.startTime),
          end_time: Math.round(segment.endTime),
          title: `${segment.contentType} Segment (${segment.engagementScore.toFixed(1)}/10)`,
          description: segment.reasoning,
          content_type: segment.contentType,
          engagement_score: Math.round(segment.engagementScore),
          visual_cues: {
            highlights: segment.highlights,
            frameCount: segment.frames.length,
            avgMotion: segment.frames.reduce((sum, f) => 
              sum + (f.visualElements.motion === 'high' ? 3 : f.visualElements.motion === 'medium' ? 2 : 1), 0
            ) / segment.frames.length,
            avgQuality: segment.frames.reduce((sum, f) => 
              sum + (f.technicalQuality.clarity + f.technicalQuality.lighting + f.technicalQuality.composition + f.technicalQuality.stability) / 4, 0
            ) / segment.frames.length
          },
          audio_features: {
            estimatedSpeech: segment.frames.some(f => f.contentType.talking > 5),
            estimatedMusic: segment.frames.some(f => f.emotionalTone.excitement > 7),
            contentDiversity: Object.keys(segment.frames[0]?.contentType || {}).length
          },
          status: 'extracted',
          created_at: new Date().toISOString()
        }))

        const { error: segmentsError } = await supabaseAdmin
          .from('video_segments')
          .insert(segmentInserts)

        if (segmentsError) {
          console.error('Failed to save segments:', segmentsError)
          // Don't throw here - analysis was successful even if segment saving failed
        } else {
          console.log(`Saved ${segmentInserts.length} segments for video ${videoId}`)
        }
      }

    } catch (error) {
      console.error('Failed to save analysis results:', error)
      throw error
    }
  }

  /**
   * Update video status in database
   */
  private async updateVideoStatus(
    videoId: string, 
    status: string, 
    message?: string
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      }

      if (message) {
        updateData.error_message = status === 'error' ? message : null
        updateData.analysis_progress = message
      }

      const { error } = await supabaseAdmin
        .from('video_uploads')
        .update(updateData)
        .eq('id', videoId)

      if (error) {
        console.error('Failed to update video status:', error)
      }
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  /**
   * Get analysis results for a video
   */
  async getAnalysisResults(videoId: string, userId: string): Promise<{
    video: any
    segments: any[]
    error?: string
  }> {
    try {
      // Get video info
      const { data: video, error: videoError } = await supabaseAdmin
        .from('video_uploads')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', userId)
        .single()

      if (videoError || !video) {
        return { video: null, segments: [], error: 'Video not found' }
      }

      // Get segments
      const { data: segments, error: segmentsError } = await supabaseAdmin
        .from('video_segments')
        .select('*')
        .eq('video_upload_id', videoId)
        .order('engagement_score', { ascending: false })

      if (segmentsError) {
        console.error('Failed to fetch segments:', segmentsError)
        return { video, segments: [], error: 'Failed to fetch segments' }
      }

      return { video, segments: segments || [] }

    } catch (error) {
      console.error('Failed to get analysis results:', error)
      return { 
        video: null, 
        segments: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Re-analyze video with different criteria
   */
  async reanalyzeVideo(
    videoId: string, 
    userId: string, 
    newCriteria: SegmentEvaluationCriteria
  ): Promise<VideoAnalysisResult> {
    try {
      // Get video info
      const { data: video, error } = await supabaseAdmin
        .from('video_uploads')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', userId)
        .single()

      if (error || !video) {
        throw new Error('Video not found')
      }

      if (!video.storage_path) {
        throw new Error('Video file not available')
      }

      // Clear existing segments
      await supabaseAdmin
        .from('video_segments')
        .delete()
        .eq('video_upload_id', videoId)

      // Start new analysis
      const analysisRequest: VideoAnalysisRequest = {
        videoId,
        videoPath: video.storage_path,
        duration: video.duration || 300, // Default 5 minutes if not set
        userId,
        criteria: newCriteria
      }

      return await this.analyzeVideo(analysisRequest)

    } catch (error) {
      console.error('Re-analysis failed:', error)
      throw error
    }
  }
}

/**
 * Create video analysis service instance
 */
export function createVideoAnalysisService(): VideoAnalysisService {
  return new VideoAnalysisService()
}