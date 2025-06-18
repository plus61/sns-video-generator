import { VideoProcessor } from '../video-processor'
import { ThumbnailGenerator } from '../thumbnail-generator'
import { VideoMetadataExtractor } from '../video-metadata-extractor'
import { VideoChunkOptimizer } from '../video-chunk-optimizer'

// Mock FFmpeg to avoid browser dependencies in tests
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  toBlobURL: jest.fn().mockImplementation((url) => Promise.resolve(url))
}))

describe('Video Processing Pipeline', () => {
  let videoProcessor: VideoProcessor
  let thumbnailGenerator: ThumbnailGenerator
  let metadataExtractor: VideoMetadataExtractor
  let chunkOptimizer: VideoChunkOptimizer
  let mockVideoFile: File

  beforeEach(() => {
    videoProcessor = new VideoProcessor()
    thumbnailGenerator = new ThumbnailGenerator()
    metadataExtractor = new VideoMetadataExtractor()
    chunkOptimizer = new VideoChunkOptimizer()
    
    // Create mock video file
    const mockVideoData = new ArrayBuffer(1024 * 1024) // 1MB
    mockVideoFile = new File([mockVideoData], 'test-video.mp4', { 
      type: 'video/mp4',
      lastModified: Date.now()
    })
  })

  describe('VideoProcessor', () => {
    test('should initialize FFmpeg successfully', async () => {
      await expect(videoProcessor.initialize()).resolves.not.toThrow()
    })

    test('should extract basic metadata', async () => {
      const metadata = await videoProcessor.extractMetadata(mockVideoFile)
      
      expect(metadata).toBeDefined()
      expect(metadata.fileSize).toBe(mockVideoFile.size)
      expect(metadata.format).toBe('mp4')
      expect(metadata.hasAudio).toBeDefined()
    })

    test('should generate thumbnails with default options', async () => {
      const thumbnails = await videoProcessor.generateThumbnails(mockVideoFile, {
        count: 3
      })
      
      expect(thumbnails).toHaveLength(3)
      thumbnails.forEach(thumbnail => {
        expect(thumbnail).toBeInstanceOf(Blob)
        expect(thumbnail.size).toBeGreaterThan(0)
      })
    })

    test('should process video chunks', async () => {
      const result = await videoProcessor.processVideoChunks(mockVideoFile, {
        segmentDuration: 10,
        quality: 'medium'
      })
      
      expect(result.chunks).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.chunkInfo).toBeDefined()
      expect(Array.isArray(result.chunks)).toBe(true)
    })

    test('should handle queue-based processing', async () => {
      const processor = jest.fn().mockResolvedValue('test-result')
      
      const result1 = videoProcessor.processWithQueue('test-key', processor)
      const result2 = videoProcessor.processWithQueue('test-key', processor)
      
      const [res1, res2] = await Promise.all([result1, result2])
      
      expect(res1).toBe('test-result')
      expect(res2).toBe('test-result')
      expect(processor).toHaveBeenCalledTimes(1) // Should only call once due to queue
    })
  })

  describe('ThumbnailGenerator', () => {
    test('should generate thumbnails with smart optimization', async () => {
      const thumbnails = await thumbnailGenerator.generateThumbnails(mockVideoFile, {
        count: 5,
        strategy: 'smart',
        quality: 80
      })
      
      expect(thumbnails).toHaveLength(5)
      thumbnails.forEach((thumbnail, index) => {
        expect(thumbnail.blob).toBeInstanceOf(Blob)
        expect(thumbnail.index).toBe(index)
        expect(thumbnail.timestamp).toBeGreaterThanOrEqual(0)
        expect(thumbnail.size).toBeGreaterThan(0)
        expect(thumbnail.url).toMatch(/^blob:/)
      })
    })

    test('should generate single thumbnail at specific timestamp', async () => {
      const thumbnail = await thumbnailGenerator.generateSingleThumbnail(
        mockVideoFile,
        30, // 30 seconds
        { quality: 90 }
      )
      
      expect(thumbnail.timestamp).toBe(30)
      expect(thumbnail.blob).toBeInstanceOf(Blob)
      expect(thumbnail.url).toBeDefined()
    })

    test('should generate cover thumbnail', async () => {
      const coverThumbnail = await thumbnailGenerator.generateCoverThumbnail(
        mockVideoFile,
        { format: 'jpeg', quality: 85 }
      )
      
      expect(coverThumbnail.blob).toBeInstanceOf(Blob)
      expect(coverThumbnail.blob.type).toContain('image')
    })

    test('should create thumbnail grid', async () => {
      const gridResult = await thumbnailGenerator.generateThumbnailGrid(
        mockVideoFile,
        {
          rows: 2,
          cols: 3,
          thumbnailWidth: 160,
          thumbnailHeight: 90
        }
      )
      
      expect(gridResult.gridBlob).toBeInstanceOf(Blob)
      expect(gridResult.thumbnails).toHaveLength(6) // 2x3 grid
      expect(gridResult.gridWidth).toBe(2 * 160 + 1 * 4) // width + spacing
      expect(gridResult.gridHeight).toBe(3 * 90 + 2 * 4) // height + spacing
    })

    test('should handle batch processing', async () => {
      const videos = [
        { file: mockVideoFile, config: { count: 3 } },
        { file: mockVideoFile, config: { count: 5 } }
      ]
      
      const results = await thumbnailGenerator.batchGenerateThumbnails(videos, 1)
      
      expect(results).toHaveLength(2)
      expect(results[0].thumbnails).toHaveLength(3)
      expect(results[1].thumbnails).toHaveLength(5)
    })
  })

  describe('VideoMetadataExtractor', () => {
    test('should extract detailed metadata', async () => {
      const metadata = await metadataExtractor.extractDetailedMetadata(mockVideoFile, {
        includeAdvanced: true,
        includeContentAnalysis: true,
        includeSNSOptimization: true
      })
      
      expect(metadata).toBeDefined()
      expect(metadata.duration).toBeGreaterThanOrEqual(0)
      expect(metadata.width).toBeGreaterThan(0)
      expect(metadata.height).toBeGreaterThan(0)
      expect(metadata.estimatedQuality).toMatch(/^(low|medium|high)$/)
      expect(metadata.compressionRatio).toBeGreaterThan(0)
      expect(metadata.recommendedPlatforms).toBeDefined()
      expect(Array.isArray(metadata.suggestedCropRegions)).toBe(true)
      expect(metadata.extractedAt).toBeDefined()
      expect(metadata.processingTime).toBeGreaterThanOrEqual(0)
    })

    test('should extract quick metadata', async () => {
      const metadata = await metadataExtractor.extractQuickMetadata(mockVideoFile)
      
      expect(metadata.fileSize).toBe(mockVideoFile.size)
      expect(metadata.format).toBe('mp4')
      expect(metadata.method).toBe('browser')
      expect(metadata.processingTime).toBe(0)
    })

    test('should handle batch metadata extraction', async () => {
      const videos = [
        { file: mockVideoFile, options: { includeAdvanced: true } },
        { file: mockVideoFile, options: { includeContentAnalysis: true } }
      ]
      
      const results = await metadataExtractor.batchExtractMetadata(videos, 1)
      
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.metadata).toBeDefined()
        expect(result.processingTime).toBeGreaterThanOrEqual(0)
      })
    })

    test('should recommend platforms based on aspect ratio', async () => {
      const metadata = await metadataExtractor.extractDetailedMetadata(mockVideoFile)
      
      expect(metadata.recommendedPlatforms).toBeDefined()
      expect(Array.isArray(metadata.recommendedPlatforms)).toBe(true)
      
      if (metadata.isHorizontal) {
        expect(metadata.recommendedPlatforms).toContain('youtube')
      }
      if (metadata.isVertical) {
        expect(metadata.recommendedPlatforms).toContain('tiktok')
      }
      if (metadata.isSquare) {
        expect(metadata.recommendedPlatforms).toContain('instagram-post')
      }
    })
  })

  describe('VideoChunkOptimizer', () => {
    test('should optimize chunks with AI analysis strategy', async () => {
      const result = await chunkOptimizer.optimizeVideoChunks(
        mockVideoFile,
        'ai-analysis'
      )
      
      expect(result.chunks).toBeDefined()
      expect(result.originalMetadata).toBeDefined()
      expect(result.strategy.name).toBe('AI Analysis Optimized')
      expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0)
      expect(result.compressionRatio).toBeGreaterThan(0)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    test('should handle different optimization strategies', async () => {
      const strategies: Array<keyof typeof chunkOptimizer['strategies']> = [
        'social-media',
        'high-quality',
        'memory-efficient'
      ]
      
      for (const strategy of strategies) {
        const result = await chunkOptimizer.optimizeVideoChunks(mockVideoFile, strategy)
        
        expect(result.strategy.name).toBeDefined()
        expect(result.chunks.length).toBeGreaterThan(0)
      }
    })

    test('should create custom strategy', () => {
      chunkOptimizer.createCustomStrategy('test-strategy', {
        segmentDuration: 45,
        quality: 'high',
        maxFileSize: 75
      })
      
      const strategies = chunkOptimizer.getAvailableStrategies()
      expect(strategies['test-strategy']).toBeDefined()
      expect(strategies['test-strategy'].segmentDuration).toBe(45)
    })

    test('should estimate processing requirements', async () => {
      const estimate = await chunkOptimizer.estimateProcessing(
        mockVideoFile,
        'ai-analysis'
      )
      
      expect(estimate.estimatedChunks).toBeGreaterThan(0)
      expect(estimate.estimatedProcessingTime).toBeGreaterThan(0)
      expect(estimate.estimatedMemoryUsage).toBeGreaterThan(0)
      expect(estimate.estimatedOutputSize).toBeGreaterThan(0)
      expect(estimate.strategy).toBeDefined()
    })

    test('should handle batch optimization', async () => {
      const videos = [
        { file: mockVideoFile, strategy: 'social-media' as const, id: 'video1' },
        { file: mockVideoFile, strategy: 'memory-efficient' as const, id: 'video2' }
      ]
      
      const results = await chunkOptimizer.batchOptimizeChunks(videos, 1)
      
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('video1')
      expect(results[1].id).toBe('video2')
      results.forEach(result => {
        expect(result.processingTime).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Integration Tests', () => {
    test('should process complete video pipeline', async () => {
      // 1. Extract metadata
      const metadata = await metadataExtractor.extractDetailedMetadata(mockVideoFile)
      expect(metadata).toBeDefined()
      
      // 2. Generate thumbnails
      const thumbnails = await thumbnailGenerator.generateThumbnails(mockVideoFile, {
        count: 3,
        strategy: 'smart'
      })
      expect(thumbnails).toHaveLength(3)
      
      // 3. Optimize chunks
      const chunkResult = await chunkOptimizer.optimizeVideoChunks(
        mockVideoFile,
        'ai-analysis'
      )
      expect(chunkResult.chunks.length).toBeGreaterThan(0)
      
      // 4. Verify consistency
      expect(chunkResult.originalMetadata.fileSize).toBe(metadata.fileSize)
      expect(chunkResult.originalMetadata.format).toBe(metadata.format)
    })

    test('should handle processing errors gracefully', async () => {
      // Create invalid file
      const invalidFile = new File(['invalid'], 'invalid.txt', { type: 'text/plain' })
      
      // Should handle errors without crashing
      await expect(
        metadataExtractor.extractDetailedMetadata(invalidFile)
      ).resolves.toBeDefined() // Should fallback to browser metadata
      
      // Thumbnails should handle errors
      await expect(
        thumbnailGenerator.generateThumbnails(invalidFile, { count: 1 })
      ).rejects.toThrow()
    })

    test('should optimize performance for large files', async () => {
      // Create larger mock file
      const largeVideoData = new ArrayBuffer(50 * 1024 * 1024) // 50MB
      const largeVideoFile = new File([largeVideoData], 'large-video.mp4', { 
        type: 'video/mp4'
      })
      
      const startTime = performance.now()
      
      // Should complete within reasonable time for mocked operations
      const estimate = await chunkOptimizer.estimateProcessing(
        largeVideoFile,
        'memory-efficient'
      )
      
      const processingTime = performance.now() - startTime
      
      expect(estimate.estimatedMemoryUsage).toBeGreaterThan(0)
      expect(processingTime).toBeLessThan(1000) // Should be fast for estimation
    })
  })

  afterEach(() => {
    // Cleanup
    thumbnailGenerator.clearCache()
    jest.clearAllMocks()
  })
})