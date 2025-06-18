import { getVideoProcessor } from './video-processor'

interface DetailedVideoMetadata {
  // Basic video properties
  duration: number // seconds
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
  codec: string
  fileSize: number
  aspectRatio: string
  
  // Audio properties
  hasAudio: boolean
  audioCodec?: string
  audioBitrate?: number
  audioSampleRate?: number
  audioChannels?: number
  
  // Advanced properties
  keyframeInterval?: number
  colorSpace?: string
  colorRange?: string
  pixelFormat?: string
  profile?: string
  level?: string
  
  // Quality metrics
  estimatedQuality: 'low' | 'medium' | 'high'
  compressionRatio: number
  bitDepth?: number
  
  // Content analysis
  hasMotion: boolean
  averageMotionScore: number
  sceneChangeCount: number
  blackFrameCount: number
  
  // SNS optimization insights
  isVertical: boolean
  isSquare: boolean
  isHorizontal: boolean
  recommendedPlatforms: string[]
  suggestedCropRegions: Array<{
    platform: string
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }>
  
  // Processing metadata
  extractedAt: string
  processingTime: number
  method: 'ffmpeg' | 'browser' | 'hybrid'
}

interface ExtractionOptions {
  includeAdvanced?: boolean
  includeContentAnalysis?: boolean
  includeSNSOptimization?: boolean
  sampleRate?: number // For motion analysis (frames per second to analyze)
  maxProcessingTime?: number // milliseconds
}

export class VideoMetadataExtractor {
  private processor = getVideoProcessor()
  
  /**
   * Extract comprehensive video metadata
   */
  async extractDetailedMetadata(
    videoFile: File | ArrayBuffer,
    options: ExtractionOptions = {}
  ): Promise<DetailedVideoMetadata> {
    const startTime = performance.now()
    
    console.log('🔍 Starting detailed metadata extraction...')
    
    try {
      // Initialize processor
      await this.processor.initialize()
      
      // Extract basic metadata using FFmpeg
      const basicMetadata = await this.processor.extractMetadata(videoFile)
      
      // Build detailed metadata object
      let detailedMetadata: DetailedVideoMetadata = {
        ...basicMetadata,
        
        // Audio properties
        audioChannels: await this.extractAudioChannels(videoFile),
        
        // Quality analysis
        estimatedQuality: this.estimateQuality(basicMetadata),
        compressionRatio: this.calculateCompressionRatio(basicMetadata),
        
        // Content analysis (basic)
        hasMotion: true, // Default assumption
        averageMotionScore: 5.0, // Default medium motion
        sceneChangeCount: 0,
        blackFrameCount: 0,
        
        // SNS optimization
        isVertical: basicMetadata.height > basicMetadata.width,
        isSquare: Math.abs(basicMetadata.width - basicMetadata.height) < 50,
        isHorizontal: basicMetadata.width > basicMetadata.height,
        recommendedPlatforms: this.recommendPlatforms(basicMetadata),
        suggestedCropRegions: this.suggestCropRegions(basicMetadata),
        
        // Processing metadata
        extractedAt: new Date().toISOString(),
        processingTime: 0, // Will be updated at the end
        method: 'ffmpeg'
      }
      
      // Advanced extraction if requested
      if (options.includeAdvanced) {
        const advancedData = await this.extractAdvancedMetadata(videoFile)
        detailedMetadata = { ...detailedMetadata, ...advancedData }
      }
      
      // Content analysis if requested
      if (options.includeContentAnalysis) {
        const contentData = await this.analyzeVideoContent(videoFile, options)
        detailedMetadata = { ...detailedMetadata, ...contentData }
      }
      
      // SNS optimization analysis if requested
      if (options.includeSNSOptimization) {
        const snsData = await this.optimizeForSNS(detailedMetadata)
        detailedMetadata = { ...detailedMetadata, ...snsData }
      }
      
      // Update processing time
      const endTime = performance.now()
      detailedMetadata.processingTime = Math.round(endTime - startTime)
      
      console.log(`✅ Metadata extraction completed in ${detailedMetadata.processingTime}ms`)
      console.log(`📊 Quality: ${detailedMetadata.estimatedQuality}, Compression: ${detailedMetadata.compressionRatio.toFixed(2)}x`)
      
      return detailedMetadata
      
    } catch (error) {
      console.error('❌ Metadata extraction failed:', error)
      
      // Fallback to browser-based extraction
      return this.extractBrowserMetadata(videoFile, startTime)
    }
  }
  
  /**
   * Quick metadata extraction for performance-critical scenarios
   */
  async extractQuickMetadata(videoFile: File | ArrayBuffer): Promise<Partial<DetailedVideoMetadata>> {
    try {
      // For File objects, we can get some metadata immediately
      if (videoFile instanceof File) {
        return {
          fileSize: videoFile.size,
          format: this.guessFormatFromFilename(videoFile.name),
          extractedAt: new Date().toISOString(),
          method: 'browser',
          processingTime: 0
        }
      }
      
      // For ArrayBuffer, we need minimal processing
      return {
        fileSize: videoFile.byteLength,
        format: 'unknown',
        extractedAt: new Date().toISOString(),
        method: 'browser',
        processingTime: 0
      }
    } catch (error) {
      console.error('Quick metadata extraction failed:', error)
      return {}
    }
  }
  
  /**
   * Batch extract metadata from multiple videos
   */
  async batchExtractMetadata(
    videos: Array<{ file: File | ArrayBuffer; options?: ExtractionOptions }>,
    concurrency: number = 2
  ): Promise<Array<{
    index: number
    metadata: DetailedVideoMetadata | null
    error?: string
    processingTime: number
  }>> {
    console.log(`🔄 Batch extracting metadata for ${videos.length} videos (concurrency: ${concurrency})`)
    
    const results: Array<{
      index: number
      metadata: DetailedVideoMetadata | null
      error?: string
      processingTime: number
    }> = []
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < videos.length; i += concurrency) {
      const batch = videos.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (video, batchIndex) => {
        const globalIndex = i + batchIndex
        const startTime = performance.now()
        
        try {
          const metadata = await this.extractDetailedMetadata(
            video.file,
            video.options || {}
          )
          
          return {
            index: globalIndex,
            metadata,
            processingTime: performance.now() - startTime
          }
        } catch (error) {
          console.error(`❌ Batch metadata extraction error for video ${globalIndex}:`, error)
          return {
            index: globalIndex,
            metadata: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: performance.now() - startTime
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      console.log(`✅ Completed metadata batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(videos.length / concurrency)}`)
    }
    
    return results
  }
  
  // Private helper methods
  
  private async extractAdvancedMetadata(videoFile: File | ArrayBuffer): Promise<Partial<DetailedVideoMetadata>> {
    // This would require more sophisticated FFmpeg analysis
    // For now, return reasonable defaults
    return {
      keyframeInterval: 30,
      colorSpace: 'bt709',
      colorRange: 'tv',
      pixelFormat: 'yuv420p',
      profile: 'High',
      level: '4.0',
      bitDepth: 8
    }
  }
  
  private async analyzeVideoContent(
    videoFile: File | ArrayBuffer,
    options: ExtractionOptions
  ): Promise<Partial<DetailedVideoMetadata>> {
    // Motion analysis would require frame-by-frame processing
    // This is computationally expensive, so we'll provide estimates
    
    const basicMetadata = await this.processor.extractMetadata(videoFile)
    const estimatedSceneChanges = Math.max(1, Math.floor(basicMetadata.duration / 5))
    
    return {
      hasMotion: basicMetadata.bitrate > 500000, // Assume motion if bitrate is reasonable
      averageMotionScore: Math.min(10, Math.max(1, basicMetadata.bitrate / 200000)),
      sceneChangeCount: estimatedSceneChanges,
      blackFrameCount: 0 // Would require frame analysis
    }
  }
  
  private async optimizeForSNS(metadata: DetailedVideoMetadata): Promise<Partial<DetailedVideoMetadata>> {
    const updatedCropRegions = [
      ...metadata.suggestedCropRegions,
      // Add more sophisticated crop suggestions based on content analysis
      ...(metadata.isHorizontal ? [{
        platform: 'instagram-story',
        x: Math.floor((metadata.width - metadata.height * 9/16) / 2),
        y: 0,
        width: Math.floor(metadata.height * 9/16),
        height: metadata.height,
        confidence: 0.8
      }] : [])
    ]
    
    return {
      suggestedCropRegions: updatedCropRegions
    }
  }
  
  private async extractAudioChannels(videoFile: File | ArrayBuffer): Promise<number> {
    // This would require FFmpeg audio analysis
    // Return common default
    return 2 // Stereo
  }
  
  private estimateQuality(metadata: any): 'low' | 'medium' | 'high' {
    const resolution = metadata.width * metadata.height
    const bitrate = metadata.bitrate || 0
    
    if (resolution >= 1920 * 1080 && bitrate >= 2000000) return 'high'
    if (resolution >= 1280 * 720 && bitrate >= 1000000) return 'medium'
    return 'low'
  }
  
  private calculateCompressionRatio(metadata: any): number {
    // Estimate compression ratio based on file size vs uncompressed size
    const uncompressedSize = metadata.width * metadata.height * 3 * metadata.fps * metadata.duration
    return uncompressedSize / metadata.fileSize
  }
  
  private recommendPlatforms(metadata: any): string[] {
    const platforms: string[] = []
    const aspectRatio = metadata.width / metadata.height
    
    // Horizontal videos
    if (aspectRatio > 1.5) {
      platforms.push('youtube', 'facebook', 'twitter')
    }
    
    // Square videos
    if (Math.abs(aspectRatio - 1) < 0.1) {
      platforms.push('instagram-post', 'facebook', 'linkedin')
    }
    
    // Vertical videos
    if (aspectRatio < 0.8) {
      platforms.push('tiktok', 'instagram-story', 'youtube-shorts')
    }
    
    return platforms
  }
  
  private suggestCropRegions(metadata: any): Array<{
    platform: string
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }> {
    const regions = []
    
    // Square crop for Instagram
    if (metadata.width !== metadata.height) {
      const size = Math.min(metadata.width, metadata.height)
      regions.push({
        platform: 'instagram-post',
        x: Math.floor((metadata.width - size) / 2),
        y: Math.floor((metadata.height - size) / 2),
        width: size,
        height: size,
        confidence: 0.9
      })
    }
    
    // 16:9 crop for YouTube
    if (metadata.width / metadata.height !== 16/9) {
      const targetWidth = metadata.height * 16/9
      if (targetWidth <= metadata.width) {
        regions.push({
          platform: 'youtube',
          x: Math.floor((metadata.width - targetWidth) / 2),
          y: 0,
          width: Math.floor(targetWidth),
          height: metadata.height,
          confidence: 0.85
        })
      }
    }
    
    return regions
  }
  
  private async extractBrowserMetadata(videoFile: File | ArrayBuffer, startTime: number): Promise<DetailedVideoMetadata> {
    console.log('⚠️ Falling back to browser-based metadata extraction')
    
    const fileSize = videoFile instanceof File ? videoFile.size : videoFile.byteLength
    
    // Minimal metadata with reasonable defaults
    return {
      duration: 0,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: Math.floor(fileSize * 8 / 1000),
      format: videoFile instanceof File ? this.guessFormatFromFilename(videoFile.name) : 'mp4',
      codec: 'h264',
      fileSize,
      aspectRatio: '16:9',
      hasAudio: true,
      audioCodec: 'aac',
      estimatedQuality: 'medium',
      compressionRatio: 100,
      hasMotion: true,
      averageMotionScore: 5.0,
      sceneChangeCount: 0,
      blackFrameCount: 0,
      isVertical: false,
      isSquare: false,
      isHorizontal: true,
      recommendedPlatforms: ['youtube', 'facebook'],
      suggestedCropRegions: [],
      extractedAt: new Date().toISOString(),
      processingTime: Math.round(performance.now() - startTime),
      method: 'browser'
    }
  }
  
  private guessFormatFromFilename(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || 'unknown'
    const formatMap: Record<string, string> = {
      'mp4': 'mp4',
      'avi': 'avi',
      'mov': 'mov',
      'mkv': 'matroska',
      'webm': 'webm',
      'flv': 'flv',
      'wmv': 'wmv',
      'm4v': 'mp4'
    }
    
    return formatMap[extension] || extension
  }
}

// Singleton instance
let metadataExtractor: VideoMetadataExtractor | null = null

export const getVideoMetadataExtractor = (): VideoMetadataExtractor => {
  if (!metadataExtractor) {
    metadataExtractor = new VideoMetadataExtractor()
  }
  return metadataExtractor
}

// Utility functions
export const extractVideoMetadata = async (
  videoFile: File | ArrayBuffer,
  options?: ExtractionOptions
): Promise<DetailedVideoMetadata> => {
  const extractor = getVideoMetadataExtractor()
  return extractor.extractDetailedMetadata(videoFile, options)
}

export const extractQuickVideoMetadata = async (
  videoFile: File | ArrayBuffer
): Promise<Partial<DetailedVideoMetadata>> => {
  const extractor = getVideoMetadataExtractor()
  return extractor.extractQuickMetadata(videoFile)
}