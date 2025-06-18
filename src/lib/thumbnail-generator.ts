import { getVideoProcessor, VideoProcessor } from './video-processor'

interface ThumbnailConfig {
  width?: number
  height?: number
  quality?: number // 1-100
  format?: 'jpeg' | 'png' | 'webp'
  timestamps?: number[] // Custom timestamps in seconds
  count?: number // Auto-generate count thumbnails
  strategy?: 'uniform' | 'keyframes' | 'smart' // Distribution strategy
}

interface ThumbnailResult {
  blob: Blob
  timestamp: number
  index: number
  width: number
  height: number
  size: number
  url?: string // Data URL for preview
}

export class ThumbnailGenerator {
  private processor: VideoProcessor
  private cache: Map<string, ThumbnailResult[]> = new Map()

  constructor() {
    this.processor = getVideoProcessor()
  }

  /**
   * Generate thumbnails with smart optimization
   */
  async generateThumbnails(
    videoFile: File | ArrayBuffer,
    config: ThumbnailConfig = {}
  ): Promise<ThumbnailResult[]> {
    const cacheKey = this.generateCacheKey(videoFile, config)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('🔄 Returning cached thumbnails')
      return this.cache.get(cacheKey)!
    }

    // Initialize processor
    await this.processor.initialize()

    // Get video metadata for smart processing
    const metadata = await this.processor.extractMetadata(videoFile)
    
    // Calculate optimal thumbnail parameters
    const optimizedConfig = this.optimizeConfig(config, metadata)
    
    console.log(`🎬 Generating ${optimizedConfig.count} thumbnails...`)
    console.log(`📐 Size: ${optimizedConfig.width}x${optimizedConfig.height}`)
    console.log(`⚡ Strategy: ${optimizedConfig.strategy}`)

    try {
      // Generate timestamps based on strategy
      const timestamps = optimizedConfig.timestamps || 
        await this.calculateTimestamps(videoFile, optimizedConfig, metadata)

      // Generate thumbnail blobs
      const thumbnailBlobs = await this.processor.generateThumbnails(videoFile, {
        count: timestamps.length,
        width: optimizedConfig.width,
        height: optimizedConfig.height,
        quality: optimizedConfig.quality,
        format: optimizedConfig.format,
        timestamps
      })

      // Transform to ThumbnailResult format
      const results: ThumbnailResult[] = thumbnailBlobs.map((blob, index) => ({
        blob,
        timestamp: timestamps[index],
        index,
        width: optimizedConfig.width || metadata.width,
        height: optimizedConfig.height || metadata.height,
        size: blob.size,
        url: URL.createObjectURL(blob) // Generate preview URL
      }))

      // Cache results
      this.cache.set(cacheKey, results)
      
      console.log(`✅ Generated ${results.length} thumbnails (${this.formatBytes(results.reduce((sum, r) => sum + r.size, 0))})`)
      
      return results
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error)
      throw new Error(`Thumbnail generation failed: ${error}`)
    }
  }

  /**
   * Generate single thumbnail at specific timestamp
   */
  async generateSingleThumbnail(
    videoFile: File | ArrayBuffer,
    timestamp: number,
    config: Omit<ThumbnailConfig, 'timestamps' | 'count'> = {}
  ): Promise<ThumbnailResult> {
    const fullConfig: ThumbnailConfig = {
      ...config,
      timestamps: [timestamp],
      count: 1
    }

    const results = await this.generateThumbnails(videoFile, fullConfig)
    return results[0]
  }

  /**
   * Generate cover thumbnail (smart selection)
   */
  async generateCoverThumbnail(
    videoFile: File | ArrayBuffer,
    config: Omit<ThumbnailConfig, 'timestamps' | 'count' | 'strategy'> = {}
  ): Promise<ThumbnailResult> {
    const metadata = await this.processor.extractMetadata(videoFile)
    
    // Smart cover selection: 1/3 into the video for better content
    const coverTimestamp = Math.floor(metadata.duration * 0.33)
    
    return this.generateSingleThumbnail(videoFile, coverTimestamp, {
      ...config,
      quality: config.quality || 85, // Higher quality for cover
      format: config.format || 'jpeg'
    })
  }

  /**
   * Generate thumbnail grid for preview
   */
  async generateThumbnailGrid(
    videoFile: File | ArrayBuffer,
    gridConfig: {
      rows: number
      cols: number
      thumbnailWidth?: number
      thumbnailHeight?: number
      spacing?: number
      backgroundColor?: string
    }
  ): Promise<{
    gridBlob: Blob
    thumbnails: ThumbnailResult[]
    gridWidth: number
    gridHeight: number
  }> {
    const totalThumbnails = gridConfig.rows * gridConfig.cols
    const thumbnailWidth = gridConfig.thumbnailWidth || 160
    const thumbnailHeight = gridConfig.thumbnailHeight || 90
    const spacing = gridConfig.spacing || 4
    
    // Generate individual thumbnails
    const thumbnails = await this.generateThumbnails(videoFile, {
      count: totalThumbnails,
      width: thumbnailWidth,
      height: thumbnailHeight,
      strategy: 'uniform',
      format: 'jpeg',
      quality: 75
    })

    // Calculate grid dimensions
    const gridWidth = gridConfig.cols * thumbnailWidth + (gridConfig.cols - 1) * spacing
    const gridHeight = gridConfig.rows * thumbnailHeight + (gridConfig.rows - 1) * spacing

    // Create canvas for grid
    const canvas = document.createElement('canvas')
    canvas.width = gridWidth
    canvas.height = gridHeight
    const ctx = canvas.getContext('2d')!

    // Fill background
    ctx.fillStyle = gridConfig.backgroundColor || '#000000'
    ctx.fillRect(0, 0, gridWidth, gridHeight)

    // Draw thumbnails in grid
    let thumbnailIndex = 0
    for (let row = 0; row < gridConfig.rows; row++) {
      for (let col = 0; col < gridConfig.cols; col++) {
        if (thumbnailIndex >= thumbnails.length) break

        const thumbnail = thumbnails[thumbnailIndex]
        const img = new Image()
        
        await new Promise((resolve) => {
          img.onload = resolve
          img.src = thumbnail.url!
        })

        const x = col * (thumbnailWidth + spacing)
        const y = row * (thumbnailHeight + spacing)
        
        ctx.drawImage(img, x, y, thumbnailWidth, thumbnailHeight)
        thumbnailIndex++
      }
    }

    // Convert canvas to blob
    const gridBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve!, 'image/jpeg', 0.85)
    })

    return {
      gridBlob: gridBlob!,
      thumbnails,
      gridWidth,
      gridHeight
    }
  }

  /**
   * Batch process multiple videos
   */
  async batchGenerateThumbnails(
    videos: Array<{ file: File | ArrayBuffer; config?: ThumbnailConfig }>,
    concurrency: number = 3
  ): Promise<Array<{
    index: number
    thumbnails: ThumbnailResult[]
    error?: string
  }>> {
    console.log(`🔄 Batch processing ${videos.length} videos with concurrency ${concurrency}`)
    
    const results: Array<{
      index: number
      thumbnails: ThumbnailResult[]
      error?: string
    }> = []

    // Process in batches
    for (let i = 0; i < videos.length; i += concurrency) {
      const batch = videos.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (video, batchIndex) => {
        const globalIndex = i + batchIndex
        try {
          const thumbnails = await this.generateThumbnails(
            video.file,
            video.config || {}
          )
          return { index: globalIndex, thumbnails }
        } catch (error) {
          console.error(`❌ Batch error for video ${globalIndex}:`, error)
          return { 
            index: globalIndex, 
            thumbnails: [], 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      console.log(`✅ Completed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(videos.length / concurrency)}`)
    }

    return results
  }

  /**
   * Clear thumbnail cache
   */
  clearCache(): void {
    // Cleanup blob URLs to prevent memory leaks
    this.cache.forEach(thumbnails => {
      thumbnails.forEach(thumbnail => {
        if (thumbnail.url) {
          URL.revokeObjectURL(thumbnail.url)
        }
      })
    })
    
    this.cache.clear()
    console.log('🧹 Thumbnail cache cleared')
  }

  // Private helper methods

  private generateCacheKey(videoFile: File | ArrayBuffer, config: ThumbnailConfig): string {
    const fileHash = videoFile instanceof File 
      ? `${videoFile.name}-${videoFile.size}-${videoFile.lastModified}`
      : `buffer-${videoFile.byteLength}`
    
    const configHash = JSON.stringify({
      width: config.width,
      height: config.height,
      quality: config.quality,
      format: config.format,
      count: config.count,
      strategy: config.strategy,
      timestamps: config.timestamps
    })
    
    return `${fileHash}-${btoa(configHash)}`
  }

  private optimizeConfig(config: ThumbnailConfig, metadata: any): Required<ThumbnailConfig> {
    return {
      width: config.width || this.calculateOptimalWidth(metadata),
      height: config.height || this.calculateOptimalHeight(metadata, config.width),
      quality: config.quality || 80,
      format: config.format || 'jpeg',
      count: config.count || 5,
      strategy: config.strategy || 'uniform',
      timestamps: config.timestamps || []
    }
  }

  private calculateOptimalWidth(metadata: any): number {
    const originalWidth = metadata.width || 1920
    
    // Scale down for efficiency while maintaining quality
    if (originalWidth > 1920) return 320
    if (originalWidth > 1280) return 240
    if (originalWidth > 720) return 180
    return 160
  }

  private calculateOptimalHeight(metadata: any, width?: number): number {
    const aspectRatio = metadata.width && metadata.height 
      ? metadata.width / metadata.height 
      : 16 / 9
    
    if (width) {
      return Math.round(width / aspectRatio)
    }
    
    const originalHeight = metadata.height || 1080
    
    // Maintain aspect ratio
    if (originalHeight > 1080) return 180
    if (originalHeight > 720) return 135
    if (originalHeight > 480) return 101
    return 90
  }

  private async calculateTimestamps(
    videoFile: File | ArrayBuffer,
    config: Required<ThumbnailConfig>,
    metadata: any
  ): Promise<number[]> {
    const duration = metadata.duration
    const count = config.count
    
    switch (config.strategy) {
      case 'uniform':
        return this.generateUniformTimestamps(duration, count)
      
      case 'keyframes':
        // For keyframes, we'd need additional analysis
        // Fallback to uniform for now
        return this.generateUniformTimestamps(duration, count)
      
      case 'smart':
        return this.generateSmartTimestamps(duration, count)
      
      default:
        return this.generateUniformTimestamps(duration, count)
    }
  }

  private generateUniformTimestamps(duration: number, count: number): number[] {
    const timestamps: number[] = []
    const interval = duration / (count + 1)
    
    for (let i = 1; i <= count; i++) {
      timestamps.push(Math.floor(interval * i))
    }
    
    return timestamps
  }

  private generateSmartTimestamps(duration: number, count: number): number[] {
    const timestamps: number[] = []
    
    // Avoid first and last 10% of video (often contains intro/outro)
    const startOffset = duration * 0.1
    const endOffset = duration * 0.9
    const effectiveDuration = endOffset - startOffset
    
    const interval = effectiveDuration / (count + 1)
    
    for (let i = 1; i <= count; i++) {
      timestamps.push(Math.floor(startOffset + interval * i))
    }
    
    return timestamps
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
let thumbnailGenerator: ThumbnailGenerator | null = null

export const getThumbnailGenerator = (): ThumbnailGenerator => {
  if (!thumbnailGenerator) {
    thumbnailGenerator = new ThumbnailGenerator()
  }
  return thumbnailGenerator
}

// Utility functions
export const generateThumbnails = async (
  videoFile: File | ArrayBuffer,
  config?: ThumbnailConfig
): Promise<ThumbnailResult[]> => {
  const generator = getThumbnailGenerator()
  return generator.generateThumbnails(videoFile, config)
}

export const generateCoverThumbnail = async (
  videoFile: File | ArrayBuffer,
  config?: Omit<ThumbnailConfig, 'timestamps' | 'count' | 'strategy'>
): Promise<ThumbnailResult> => {
  const generator = getThumbnailGenerator()
  return generator.generateCoverThumbnail(videoFile, config)
}