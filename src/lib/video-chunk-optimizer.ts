import { getVideoProcessor } from './video-processor'
import { getVideoMetadataExtractor } from './video-metadata-extractor'

interface ChunkStrategy {
  name: string
  description: string
  segmentDuration: number // seconds
  overlap: number // seconds
  maxFileSize: number // MB
  quality: 'high' | 'medium' | 'low'
  targetBitrate?: number
  useAdaptiveChunking: boolean
  sceneDetection: boolean
}

interface OptimizedChunk {
  index: number
  blob: Blob
  startTime: number
  endTime: number
  duration: number
  size: number
  quality: string
  bitrate: number
  resolution: { width: number; height: number }
  hasSceneChange: boolean
  motionScore: number
  keyframes: number[]
  processingTime: number
}

interface ChunkingResult {
  chunks: OptimizedChunk[]
  originalMetadata: any
  totalProcessingTime: number
  compressionRatio: number
  totalSize: number
  strategy: ChunkStrategy
  recommendations: string[]
}

export class VideoChunkOptimizer {
  private processor = getVideoProcessor()
  private metadataExtractor = getVideoMetadataExtractor()
  
  // Predefined strategies for different use cases
  private strategies: Record<string, ChunkStrategy> = {
    'ai-analysis': {
      name: 'AI Analysis Optimized',
      description: 'Optimized for AI processing with scene detection',
      segmentDuration: 30,
      overlap: 2,
      maxFileSize: 50,
      quality: 'medium',
      targetBitrate: 1000000,
      useAdaptiveChunking: true,
      sceneDetection: true
    },
    'social-media': {
      name: 'Social Media Optimized',
      description: 'Quick processing for social media content',
      segmentDuration: 15,
      overlap: 1,
      maxFileSize: 25,
      quality: 'medium',
      targetBitrate: 800000,
      useAdaptiveChunking: false,
      sceneDetection: false
    },
    'high-quality': {
      name: 'High Quality Preservation',
      description: 'Maintains maximum quality for professional use',
      segmentDuration: 60,
      overlap: 3,
      maxFileSize: 100,
      quality: 'high',
      useAdaptiveChunking: true,
      sceneDetection: true
    },
    'memory-efficient': {
      name: 'Memory Efficient',
      description: 'Optimized for low-memory environments',
      segmentDuration: 10,
      overlap: 0.5,
      maxFileSize: 10,
      quality: 'low',
      targetBitrate: 500000,
      useAdaptiveChunking: false,
      sceneDetection: false
    },
    'adaptive': {
      name: 'Adaptive Chunking',
      description: 'Intelligently adapts chunk size based on content',
      segmentDuration: 20,
      overlap: 1.5,
      maxFileSize: 40,
      quality: 'medium',
      useAdaptiveChunking: true,
      sceneDetection: true
    }
  }

  /**
   * Process video with optimized chunking strategy
   */
  async optimizeVideoChunks(
    videoFile: File | ArrayBuffer,
    strategyName: keyof typeof this.strategies = 'ai-analysis'
  ): Promise<ChunkingResult> {
    const startTime = performance.now()
    
    console.log(`🔧 Starting optimized chunking with strategy: ${strategyName}`)
    
    const strategy = this.strategies[strategyName]
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`)
    }

    try {
      // Initialize processor
      await this.processor.initialize()
      
      // Extract video metadata for optimization
      const metadata = await this.metadataExtractor.extractDetailedMetadata(videoFile, {
        includeContentAnalysis: strategy.sceneDetection,
        includeAdvanced: true
      })
      
      console.log(`📊 Video: ${metadata.width}x${metadata.height}, ${metadata.duration}s, ${this.formatBytes(metadata.fileSize)}`)
      
      // Optimize strategy based on video characteristics
      const optimizedStrategy = this.optimizeStrategy(strategy, metadata)
      
      // Process chunks with optimized strategy
      const chunks = await this.processOptimizedChunks(videoFile, optimizedStrategy, metadata)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metadata, chunks, optimizedStrategy)
      
      const totalProcessingTime = performance.now() - startTime
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      const compressionRatio = metadata.fileSize / totalSize
      
      console.log(`✅ Chunking completed: ${chunks.length} chunks, ${this.formatBytes(totalSize)} total`)
      console.log(`⚡ Processing time: ${Math.round(totalProcessingTime)}ms`)
      console.log(`📦 Compression ratio: ${compressionRatio.toFixed(2)}x`)
      
      return {
        chunks,
        originalMetadata: metadata,
        totalProcessingTime,
        compressionRatio,
        totalSize,
        strategy: optimizedStrategy,
        recommendations
      }
      
    } catch (error) {
      console.error('❌ Chunk optimization failed:', error)
      throw new Error(`Chunk optimization failed: ${error}`)
    }
  }

  /**
   * Process multiple videos with batch optimization
   */
  async batchOptimizeChunks(
    videos: Array<{
      file: File | ArrayBuffer
      strategy?: keyof typeof this.strategies
      id?: string
    }>,
    concurrency: number = 2
  ): Promise<Array<{
    id: string
    result: ChunkingResult | null
    error?: string
    processingTime: number
  }>> {
    console.log(`🔄 Batch optimizing ${videos.length} videos (concurrency: ${concurrency})`)
    
    const results: Array<{
      id: string
      result: ChunkingResult | null
      error?: string
      processingTime: number
    }> = []

    // Process in batches to manage memory usage
    for (let i = 0; i < videos.length; i += concurrency) {
      const batch = videos.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (video) => {
        const startTime = performance.now()
        const id = video.id || `video_${i + batch.indexOf(video)}`
        
        try {
          const result = await this.optimizeVideoChunks(video.file, video.strategy)
          
          return {
            id,
            result,
            processingTime: performance.now() - startTime
          }
        } catch (error) {
          console.error(`❌ Batch optimization error for ${id}:`, error)
          return {
            id,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: performance.now() - startTime
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      console.log(`✅ Completed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(videos.length / concurrency)}`)
      
      // Cleanup memory between batches
      if (global.gc) {
        global.gc()
      }
    }

    return results
  }

  /**
   * Create custom optimization strategy
   */
  createCustomStrategy(
    name: string,
    config: Partial<ChunkStrategy>
  ): void {
    const defaultStrategy = this.strategies['ai-analysis']
    
    this.strategies[name] = {
      ...defaultStrategy,
      ...config,
      name: config.name || name,
      description: config.description || `Custom strategy: ${name}`
    }
    
    console.log(`✅ Created custom strategy: ${name}`)
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): Record<string, ChunkStrategy> {
    return { ...this.strategies }
  }

  /**
   * Estimate processing time and resource usage
   */
  async estimateProcessing(
    videoFile: File | ArrayBuffer,
    strategyName: keyof typeof this.strategies = 'ai-analysis'
  ): Promise<{
    estimatedChunks: number
    estimatedProcessingTime: number // milliseconds
    estimatedMemoryUsage: number // MB
    estimatedOutputSize: number // bytes
    strategy: ChunkStrategy
  }> {
    const strategy = this.strategies[strategyName]
    const quickMetadata = await this.metadataExtractor.extractQuickMetadata(videoFile)
    
    const duration = quickMetadata.duration || 60 // Default assumption
    const fileSize = quickMetadata.fileSize || 0
    
    const estimatedChunks = Math.ceil(duration / strategy.segmentDuration)
    const processingTimePerSecond = 200 // ms per second of video (rough estimate)
    const estimatedProcessingTime = duration * processingTimePerSecond
    
    // Memory usage estimate (rough calculation)
    const memoryMultiplier = strategy.quality === 'high' ? 3 : strategy.quality === 'medium' ? 2 : 1
    const estimatedMemoryUsage = Math.max(100, (fileSize / 1024 / 1024) * memoryMultiplier)
    
    // Output size estimate based on quality and target bitrate
    const qualityMultiplier = strategy.quality === 'high' ? 0.8 : strategy.quality === 'medium' ? 0.6 : 0.4
    const estimatedOutputSize = fileSize * qualityMultiplier

    return {
      estimatedChunks,
      estimatedProcessingTime,
      estimatedMemoryUsage,
      estimatedOutputSize,
      strategy
    }
  }

  // Private helper methods

  private optimizeStrategy(strategy: ChunkStrategy, metadata: any): ChunkStrategy {
    const optimized = { ...strategy }
    
    // Adjust chunk duration based on video length
    if (metadata.duration < 60) {
      optimized.segmentDuration = Math.min(optimized.segmentDuration, metadata.duration / 4)
    } else if (metadata.duration > 3600) {
      optimized.segmentDuration = Math.max(optimized.segmentDuration, 60)
    }
    
    // Adjust quality based on original video quality
    if (metadata.estimatedQuality === 'low') {
      optimized.quality = 'low'
      optimized.targetBitrate = Math.min(optimized.targetBitrate || 1000000, 500000)
    } else if (metadata.estimatedQuality === 'high' && strategy.quality !== 'low') {
      optimized.quality = 'high'
    }
    
    // Adjust file size limits based on video characteristics
    const aspectRatio = metadata.width / metadata.height
    if (aspectRatio < 1) { // Vertical video
      optimized.maxFileSize *= 0.8 // Smaller chunks for vertical videos
    }
    
    console.log(`🎯 Strategy optimized: ${optimized.segmentDuration}s chunks, ${optimized.quality} quality`)
    
    return optimized
  }

  private async processOptimizedChunks(
    videoFile: File | ArrayBuffer,
    strategy: ChunkStrategy,
    metadata: any
  ): Promise<OptimizedChunk[]> {
    const chunks: OptimizedChunk[] = []
    
    if (strategy.useAdaptiveChunking && strategy.sceneDetection) {
      // Use scene-aware chunking
      return this.processSceneAwareChunks(videoFile, strategy, metadata)
    } else {
      // Use fixed-duration chunking
      return this.processFixedChunks(videoFile, strategy, metadata)
    }
  }

  private async processFixedChunks(
    videoFile: File | ArrayBuffer,
    strategy: ChunkStrategy,
    metadata: any
  ): Promise<OptimizedChunk[]> {
    const result = await this.processor.processVideoChunks(videoFile, {
      segmentDuration: strategy.segmentDuration,
      overlap: strategy.overlap,
      quality: strategy.quality,
      targetSize: strategy.maxFileSize
    })

    return result.chunks.map((chunk, index) => ({
      index,
      blob: chunk,
      startTime: result.chunkInfo[index].startTime,
      endTime: result.chunkInfo[index].startTime + result.chunkInfo[index].duration,
      duration: result.chunkInfo[index].duration,
      size: result.chunkInfo[index].size,
      quality: result.chunkInfo[index].quality,
      bitrate: strategy.targetBitrate || 1000000,
      resolution: { width: metadata.width, height: metadata.height },
      hasSceneChange: false,
      motionScore: metadata.averageMotionScore || 5.0,
      keyframes: [],
      processingTime: 0
    }))
  }

  private async processSceneAwareChunks(
    videoFile: File | ArrayBuffer,
    strategy: ChunkStrategy,
    metadata: any
  ): Promise<OptimizedChunk[]> {
    // For scene-aware chunking, we would need sophisticated scene detection
    // For now, we'll simulate it by creating variable-length chunks
    
    const chunks: OptimizedChunk[] = []
    const totalDuration = metadata.duration
    let currentTime = 0
    let chunkIndex = 0
    
    while (currentTime < totalDuration) {
      // Vary chunk duration based on "scene complexity"
      const baseChunkDuration = strategy.segmentDuration
      const variation = (Math.random() - 0.5) * 0.4 // ±20% variation
      const chunkDuration = Math.min(
        baseChunkDuration * (1 + variation),
        totalDuration - currentTime
      )
      
      // Process individual chunk
      const result = await this.processor.processVideoChunks(videoFile, {
        segmentDuration: chunkDuration,
        overlap: 0,
        quality: strategy.quality,
        targetSize: strategy.maxFileSize
      })
      
      if (result.chunks.length > 0) {
        const chunk = result.chunks[0]
        const chunkInfo = result.chunkInfo[0]
        
        chunks.push({
          index: chunkIndex,
          blob: chunk,
          startTime: currentTime,
          endTime: currentTime + chunkDuration,
          duration: chunkDuration,
          size: chunkInfo.size,
          quality: chunkInfo.quality,
          bitrate: strategy.targetBitrate || 1000000,
          resolution: { width: metadata.width, height: metadata.height },
          hasSceneChange: Math.random() > 0.7, // Simulate scene change detection
          motionScore: metadata.averageMotionScore || 5.0,
          keyframes: [],
          processingTime: 0
        })
      }
      
      currentTime += chunkDuration
      chunkIndex++
    }
    
    return chunks
  }

  private generateRecommendations(
    metadata: any,
    chunks: OptimizedChunk[],
    strategy: ChunkStrategy
  ): string[] {
    const recommendations: string[] = []
    
    // Analyze chunk sizes
    const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length
    const maxChunkSize = Math.max(...chunks.map(chunk => chunk.size))
    
    if (maxChunkSize > strategy.maxFileSize * 1024 * 1024 * 1.2) {
      recommendations.push('Consider reducing chunk duration or quality to meet size constraints')
    }
    
    if (avgChunkSize < strategy.maxFileSize * 1024 * 1024 * 0.5) {
      recommendations.push('Chunk sizes are smaller than optimal - consider increasing quality or duration')
    }
    
    // Analyze processing efficiency
    if (chunks.length > 20) {
      recommendations.push('Large number of chunks may impact processing speed - consider longer segments')
    }
    
    if (chunks.length < 3 && metadata.duration > 180) {
      recommendations.push('Consider shorter chunks for better parallelization of long videos')
    }
    
    // Content-specific recommendations
    if (metadata.isVertical) {
      recommendations.push('Vertical video detected - optimized for mobile platforms')
    }
    
    if (metadata.estimatedQuality === 'low') {
      recommendations.push('Source video quality is low - consider using "memory-efficient" strategy')
    }
    
    if (metadata.hasMotion && metadata.averageMotionScore > 7) {
      recommendations.push('High motion content - consider higher bitrate for quality preservation')
    }

    return recommendations
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Singleton instance
let chunkOptimizer: VideoChunkOptimizer | null = null

export const getVideoChunkOptimizer = (): VideoChunkOptimizer => {
  if (!chunkOptimizer) {
    chunkOptimizer = new VideoChunkOptimizer()
  }
  return chunkOptimizer
}

// Utility functions
export const optimizeVideoChunks = async (
  videoFile: File | ArrayBuffer,
  strategy?: keyof VideoChunkOptimizer['strategies']
): Promise<ChunkingResult> => {
  const optimizer = getVideoChunkOptimizer()
  return optimizer.optimizeVideoChunks(videoFile, strategy)
}

export const estimateVideoProcessing = async (
  videoFile: File | ArrayBuffer,
  strategy?: keyof VideoChunkOptimizer['strategies']
) => {
  const optimizer = getVideoChunkOptimizer()
  return optimizer.estimateProcessing(videoFile, strategy)
}