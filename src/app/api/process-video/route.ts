import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../utils/supabase/server"

import { supabaseAdmin } from '../../../lib/supabase'
import { videoProcessingQueue } from '../../../lib/queues/video-processing-queue-vercel'
import { webhookService } from '../../../lib/services/webhook-service'
import { v4 as uuidv4 } from 'uuid'

interface ProcessVideoRequest {
  videoId: string
  processingOptions: {
    extractThumbnails?: boolean
    extractMetadata?: boolean
    createChunks?: boolean
    chunkStrategy?: 'ai-analysis' | 'social-media' | 'high-quality' | 'memory-efficient'
    thumbnailCount?: number
    enableWebhooks?: boolean
    webhookUrl?: string
    priority?: 'low' | 'normal' | 'high'
    maxProcessingTime?: number
  }
  aiAnalysisOptions?: {
    enableTranscription?: boolean
    enableSceneDetection?: boolean
    enableObjectDetection?: boolean
    enableSentimentAnalysis?: boolean
    targetPlatforms?: string[]
  }
}

interface ProcessVideoResponse {
  success: boolean
  jobId: string
  estimatedProcessingTime: number
  queuePosition?: number
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ProcessVideoResponse>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        jobId: '',
        estimatedProcessingTime: 0,
        error: 'Unauthorized - Please sign in' 
      }, { status: 401 })
    }

    const body: ProcessVideoRequest = await request.json()
    const { videoId, processingOptions, aiAnalysisOptions } = body

    if (!videoId) {
      return NextResponse.json({
        success: false,
        jobId: '',
        estimatedProcessingTime: 0,
        error: 'Video ID is required'
      }, { status: 400 })
    }

    // Validate video exists and belongs to user
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json({
        success: false,
        jobId: '',
        estimatedProcessingTime: 0,
        error: 'Video not found or access denied'
      }, { status: 404 })
    }

    if (video.status === 'processing') {
      return NextResponse.json({
        success: false,
        jobId: '',
        estimatedProcessingTime: 0,
        error: 'Video is already being processed'
      }, { status: 409 })
    }

    // Generate job ID
    const jobId = uuidv4()

    // Create processing job record
    const { error: jobError } = await supabaseAdmin
      .from('processing_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        video_id: videoId,
        job_type: 'video_processing',
        status: 'queued',
        processing_options: processingOptions,
        ai_analysis_options: aiAnalysisOptions,
        created_at: new Date().toISOString(),
        priority: processingOptions.priority || 'normal'
      })

    if (jobError) {
      console.error('Failed to create processing job:', jobError)
      return NextResponse.json({
        success: false,
        jobId: '',
        estimatedProcessingTime: 0,
        error: 'Failed to create processing job'
      }, { status: 500 })
    }

    // Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'queued_for_processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    // Calculate priority and processing options
    const jobPriority = getPriorityNumber(processingOptions.priority || 'normal')
    const estimatedTime = calculateEstimatedTime(video, processingOptions, aiAnalysisOptions)

    // Add job to queue
    const job = await videoProcessingQueue.add(
      'process-video',
      {
        jobId,
        videoId,
        userId: user.id,
        processingOptions,
        aiAnalysisOptions,
        video: {
          filePath: video.file_path,
          fileName: video.file_name,
          fileSize: video.file_size,
          duration: video.duration,
          format: video.format
        }
      },
      {
        jobId,
        priority: jobPriority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
        delay: processingOptions.priority === 'low' ? 30000 : 0, // 30s delay for low priority
      }
    )

    // Get queue position
    const queuePosition = await getQueuePosition(jobPriority)

    // Send webhook notification if enabled
    if (processingOptions.enableWebhooks && processingOptions.webhookUrl) {
      await webhookService.sendWebhook(processingOptions.webhookUrl, {
        event: 'processing.started',
        jobId,
        videoId,
        userId: user.id,
        estimatedProcessingTime: estimatedTime,
        queuePosition,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`✅ Video processing job queued: ${jobId} (priority: ${processingOptions.priority})`)

    return NextResponse.json({
      success: true,
      jobId,
      estimatedProcessingTime: estimatedTime,
      queuePosition
    })

  } catch (error) {
    console.error('Video processing API error:', error)
    return NextResponse.json({
      success: false,
      jobId: '',
      estimatedProcessingTime: 0,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get job status from database
    const { data: job, error: jobError } = await supabaseAdmin
      .from('processing_jobs')
      .select(`
        *,
        video_uploads (
          file_name,
          file_size,
          duration
        )
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get queue status
    const queueJob = await videoProcessingQueue.getJob(jobId)
    const queueStatus = queueJob ? {
      progress: queueJob.progress,
      processedOn: queueJob.processedOn,
      finishedOn: queueJob.finishedOn,
      failedReason: queueJob.failedReason,
      delay: queueJob.delay,
      opts: queueJob.opts
    } : null

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        queueStatus
      }
    })

  } catch (error) {
    console.error('Job status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabaseAdmin
      .from('processing_jobs')
      .select('id, status, video_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'processing') {
      return NextResponse.json({ 
        error: 'Cannot cancel job that is currently processing' 
      }, { status: 409 })
    }

    // Remove from queue
    const queueJob = await videoProcessingQueue.getJob(jobId)
    if (queueJob) {
      await queueJob.remove()
    }

    // Update job status
    await supabaseAdmin
      .from('processing_jobs')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.video_id)

    console.log(`✅ Job cancelled: ${jobId}`)

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    })

  } catch (error) {
    console.error('Job cancellation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions

function getPriorityNumber(priority: string): number {
  const priorities = {
    'low': 1,
    'normal': 5,
    'high': 10
  }
  return priorities[priority as keyof typeof priorities] || 5
}

function calculateEstimatedTime(
  video: any,
  processingOptions: ProcessVideoRequest['processingOptions'],
  aiAnalysisOptions?: ProcessVideoRequest['aiAnalysisOptions']
): number {
  let baseTime = 60000 // 1 minute base

  // Factor in video duration (1 minute processing per 10 minutes of video)
  if (video.duration) {
    baseTime += (video.duration / 10) * 60000
  }

  // Factor in file size (10 seconds per MB)
  if (video.file_size) {
    baseTime += (video.file_size / (1024 * 1024)) * 10000
  }

  // Processing options multipliers
  let multiplier = 1
  if (processingOptions.extractThumbnails) multiplier += 0.3
  if (processingOptions.extractMetadata) multiplier += 0.2
  if (processingOptions.createChunks) {
    multiplier += processingOptions.chunkStrategy === 'high-quality' ? 0.8 : 0.5
  }

  // AI analysis multipliers
  if (aiAnalysisOptions?.enableTranscription) multiplier += 1.5
  if (aiAnalysisOptions?.enableSceneDetection) multiplier += 0.8
  if (aiAnalysisOptions?.enableObjectDetection) multiplier += 1.2
  if (aiAnalysisOptions?.enableSentimentAnalysis) multiplier += 0.5

  return Math.round(baseTime * multiplier)
}

async function getQueuePosition(priority: number): Promise<number> {
  try {
    const waiting = await videoProcessingQueue.getWaiting()
    const active = await videoProcessingQueue.getActive()
    
    // Count jobs with equal or higher priority ahead in queue
    let position = active.length + 1 // Active jobs are ahead
    
    for (const job of waiting) {
      if (job.opts.priority && job.opts.priority >= priority) {
        position++
      }
    }
    
    return position
  } catch (error) {
    console.error('Error calculating queue position:', error)
    return 1
  }
}