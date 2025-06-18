import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { supabaseAdmin } from '@/lib/supabase'
import { getVideoProcessor } from '@/lib/video-processor'
import { getThumbnailGenerator } from '@/lib/thumbnail-generator'
import { getVideoMetadataExtractor } from '@/lib/video-metadata-extractor'
import { getVideoChunkOptimizer } from '@/lib/video-chunk-optimizer'
import { webhookService } from '@/lib/services/webhook-service'

// Job data interfaces
interface VideoProcessingJobData {
  jobId: string
  videoId: string
  userId: string
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
  video: {
    filePath: string
    fileName: string
    fileSize: number
    duration?: number
    format?: string
  }
}

interface ProcessingResult {
  metadata?: any
  thumbnails?: any[]
  chunks?: any[]
  aiAnalysis?: any
  processingTime: number
  success: boolean
  error?: string
}

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxLoadingTimeout: 5000,
  lazyConnect: true,
}

// Parse Railway Redis URL if available
if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL)
  redisConfig.host = redisUrl.hostname
  redisConfig.port = parseInt(redisUrl.port || '6379')
  if (redisUrl.password) {
    redisConfig.password = redisUrl.password
  }
}

// Create Redis connection
const redis = new Redis(redisConfig)

// Create queue
export const videoProcessingQueue = new Queue('video-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

// Queue event handlers
videoProcessingQueue.on('waiting', (jobId) => {
  console.log(`📝 Job ${jobId} is waiting`)
})

videoProcessingQueue.on('active', (job) => {
  console.log(`🚀 Job ${job.id} started processing`)
})

videoProcessingQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

videoProcessingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

videoProcessingQueue.on('stalled', (jobId) => {
  console.warn(`⚠️ Job ${jobId} stalled`)
})

// Create worker
const worker = new Worker(
  'video-processing',
  async (job: Job<VideoProcessingJobData>) => {
    return await processVideoJob(job)
  },
  {
    connection: redis,
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '3'),
    maxStalledCount: 1,
    stalledInterval: 30000,
    removeOnComplete: 50,
    removeOnFail: 100,
  }
)

// Worker event handlers
worker.on('active', (job) => {
  console.log(`🔄 Worker processing job ${job.id}`)
})

worker.on('completed', (job, result) => {
  console.log(`✅ Worker completed job ${job.id}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Worker failed job ${job?.id}:`, err)
})

worker.on('error', (err) => {
  console.error('🚨 Worker error:', err)
})

// Main job processing function
async function processVideoJob(job: Job<VideoProcessingJobData>): Promise<ProcessingResult> {
  const { data } = job
  const startTime = Date.now()
  
  try {
    console.log(`🎬 Processing video job ${data.jobId} for user ${data.userId}`)
    
    // Update job status in database
    await updateJobStatus(data.jobId, 'processing', {
      progress: 0,
      started_at: new Date().toISOString()
    })
    
    // Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.videoId)

    // Send webhook notification
    if (data.processingOptions.enableWebhooks && data.processingOptions.webhookUrl) {
      await webhookService.sendWebhook(data.processingOptions.webhookUrl, {
        event: 'processing.started',
        jobId: data.jobId,
        videoId: data.videoId,
        userId: data.userId,
        timestamp: new Date().toISOString()
      })
    }

    const result: ProcessingResult = {
      processingTime: 0,
      success: false
    }

    // Load video file
    await job.updateProgress(10)
    const videoFile = await loadVideoFile(data.video.filePath)

    // Extract metadata if requested
    if (data.processingOptions.extractMetadata) {
      console.log(`📊 Extracting metadata for job ${data.jobId}`)
      await job.updateProgress(20)
      
      const metadataExtractor = getVideoMetadataExtractor()
      result.metadata = await metadataExtractor.extractDetailedMetadata(videoFile, {
        includeAdvanced: true,
        includeContentAnalysis: data.aiAnalysisOptions?.enableSceneDetection,
        includeSNSOptimization: true
      })
      
      console.log(`✅ Metadata extracted: ${result.metadata.width}x${result.metadata.height}, ${result.metadata.duration}s`)
    }

    // Generate thumbnails if requested
    if (data.processingOptions.extractThumbnails) {
      console.log(`🖼️ Generating thumbnails for job ${data.jobId}`)
      await job.updateProgress(40)
      
      const thumbnailGenerator = getThumbnailGenerator()
      const thumbnails = await thumbnailGenerator.generateThumbnails(videoFile, {
        count: data.processingOptions.thumbnailCount || 5,
        strategy: 'smart',
        quality: 80
      })
      
      // Upload thumbnails to storage
      result.thumbnails = await uploadThumbnails(thumbnails, data.videoId, data.userId)
      console.log(`✅ Generated ${result.thumbnails.length} thumbnails`)
    }

    // Create chunks if requested
    if (data.processingOptions.createChunks) {
      console.log(`✂️ Creating chunks for job ${data.jobId}`)
      await job.updateProgress(60)
      
      const chunkOptimizer = getVideoChunkOptimizer()
      const chunkResult = await chunkOptimizer.optimizeVideoChunks(
        videoFile,
        data.processingOptions.chunkStrategy || 'ai-analysis'
      )
      
      // Upload chunks to storage
      result.chunks = await uploadChunks(chunkResult.chunks, data.videoId, data.userId)
      console.log(`✅ Created ${result.chunks.length} optimized chunks`)
    }

    // AI Analysis if requested
    if (data.aiAnalysisOptions) {
      console.log(`🤖 Running AI analysis for job ${data.jobId}`)
      await job.updateProgress(80)
      
      result.aiAnalysis = await performAIAnalysis(videoFile, data.aiAnalysisOptions)
      console.log(`✅ AI analysis completed`)
    }

    await job.updateProgress(90)

    // Save results to database
    await saveProcessingResults(data.jobId, data.videoId, result)

    // Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.videoId)

    result.processingTime = Date.now() - startTime
    result.success = true

    // Update job status
    await updateJobStatus(data.jobId, 'completed', {
      progress: 100,
      completed_at: new Date().toISOString(),
      processing_time: result.processingTime,
      results: result
    })

    // Send completion webhook
    if (data.processingOptions.enableWebhooks && data.processingOptions.webhookUrl) {
      await webhookService.sendWebhook(data.processingOptions.webhookUrl, {
        event: 'processing.completed',
        jobId: data.jobId,
        videoId: data.videoId,
        userId: data.userId,
        processingTime: result.processingTime,
        results: {
          metadata: !!result.metadata,
          thumbnails: result.thumbnails?.length || 0,
          chunks: result.chunks?.length || 0,
          aiAnalysis: !!result.aiAnalysis
        },
        timestamp: new Date().toISOString()
      })
    }

    console.log(`🎉 Job ${data.jobId} completed successfully in ${result.processingTime}ms`)
    return result

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`💥 Job ${data.jobId} failed after ${processingTime}ms:`, error)

    // Update job status
    await updateJobStatus(data.jobId, 'failed', {
      progress: job.progress || 0,
      failed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime
    })

    // Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.videoId)

    // Send error webhook
    if (data.processingOptions.enableWebhooks && data.processingOptions.webhookUrl) {
      await webhookService.sendWebhook(data.processingOptions.webhookUrl, {
        event: 'processing.failed',
        jobId: data.jobId,
        videoId: data.videoId,
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        timestamp: new Date().toISOString()
      })
    }

    throw error
  }
}

// Helper functions

async function loadVideoFile(filePath: string): Promise<ArrayBuffer> {
  // In a real implementation, this would load from Supabase storage or filesystem
  // For now, we'll simulate with a mock implementation
  const mockVideoData = new ArrayBuffer(10 * 1024 * 1024) // 10MB mock
  return mockVideoData
}

async function uploadThumbnails(thumbnails: any[], videoId: string, userId: string): Promise<any[]> {
  const uploadedThumbnails = []
  
  for (let i = 0; i < thumbnails.length; i++) {
    const thumbnail = thumbnails[i]
    const fileName = `thumbnails/${videoId}/thumbnail_${i}.jpg`
    
    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('video-assets')
      .upload(fileName, thumbnail.blob, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (!error) {
      uploadedThumbnails.push({
        index: i,
        timestamp: thumbnail.timestamp,
        fileName,
        url: supabaseAdmin.storage.from('video-assets').getPublicUrl(fileName).data.publicUrl,
        size: thumbnail.size
      })
    }
  }
  
  return uploadedThumbnails
}

async function uploadChunks(chunks: any[], videoId: string, userId: string): Promise<any[]> {
  const uploadedChunks = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const fileName = `chunks/${videoId}/chunk_${i}.mp4`
    
    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('video-assets')
      .upload(fileName, chunk.blob, {
        contentType: 'video/mp4',
        upsert: true
      })
    
    if (!error) {
      uploadedChunks.push({
        index: i,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        duration: chunk.duration,
        fileName,
        url: supabaseAdmin.storage.from('video-assets').getPublicUrl(fileName).data.publicUrl,
        size: chunk.size
      })
    }
  }
  
  return uploadedChunks
}

async function performAIAnalysis(videoFile: ArrayBuffer, options: any): Promise<any> {
  // Placeholder for AI analysis integration
  // This would integrate with OpenAI Whisper for transcription,
  // GPT-4V for visual analysis, etc.
  return {
    transcription: options.enableTranscription ? "Mock transcription result" : null,
    sceneDetection: options.enableSceneDetection ? ["scene1", "scene2"] : null,
    objectDetection: options.enableObjectDetection ? ["person", "object"] : null,
    sentimentAnalysis: options.enableSentimentAnalysis ? { sentiment: "positive", score: 0.8 } : null
  }
}

async function updateJobStatus(jobId: string, status: string, updates: any = {}): Promise<void> {
  await supabaseAdmin
    .from('processing_jobs')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...updates
    })
    .eq('id', jobId)
}

async function saveProcessingResults(jobId: string, videoId: string, result: ProcessingResult): Promise<void> {
  // Save detailed results to database
  await supabaseAdmin
    .from('processing_results')
    .insert({
      id: `${jobId}_result`,
      job_id: jobId,
      video_id: videoId,
      metadata: result.metadata,
      thumbnails: result.thumbnails,
      chunks: result.chunks,
      ai_analysis: result.aiAnalysis,
      processing_time: result.processingTime,
      created_at: new Date().toISOString()
    })
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down worker gracefully...')
  await worker.close()
  await redis.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down worker gracefully...')
  await worker.close()
  await redis.disconnect()
  process.exit(0)
})

export default worker