import { SegmentExtractor } from '../segment-extractor'
import { EnhancedSegment } from '../gpt4v'

describe('SegmentExtractor', () => {
  let extractor: SegmentExtractor
  
  beforeEach(() => {
    extractor = new SegmentExtractor()
  })

  describe('extractOptimalSegments', () => {
    it('should filter segments by minimum engagement score', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 15, 'education', 9, 8),
        createMockSegment(2, 20, 35, 'entertainment', 5, 6),
        createMockSegment(3, 40, 55, 'tips', 8, 7)
      ]

      const result = extractor.extractOptimalSegments(mockSegments, {
        minEngagementScore: 7,
        maxSegments: 10
      })

      expect(result).toHaveLength(2)
      expect(result[0].combined_engagement_score).toBeGreaterThanOrEqual(7)
      expect(result[1].combined_engagement_score).toBeGreaterThanOrEqual(7)
    })

    it('should remove overlapping segments and keep higher scored ones', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 20, 'education', 9, 8),
        createMockSegment(2, 10, 30, 'education', 7, 6), // overlaps with segment 1
        createMockSegment(3, 40, 60, 'tips', 8, 7)
      ]

      const result = extractor.extractOptimalSegments(mockSegments, {
        minEngagementScore: 6,
        maxSegments: 10
      })

      expect(result).toHaveLength(2)
      expect(result[0].combined_engagement_score).toBe(9) // Higher scored segment kept
      expect(result[1].combined_engagement_score).toBe(8)
    })

    it('should enforce segment length constraints', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 5, 'education', 9, 8),   // too short
        createMockSegment(2, 10, 80, 'entertainment', 8, 7), // too long
        createMockSegment(3, 90, 120, 'tips', 7, 6)     // valid length
      ]

      const result = extractor.extractOptimalSegments(mockSegments, {
        minEngagementScore: 6,
        minDuration: 10,
        maxDuration: 60,
        maxSegments: 10
      })

      expect(result).toHaveLength(1)
      expect(result[0].end_time - result[0].start_time).toBe(30)
    })

    it('should limit number of segments returned', () => {
      const mockSegments: EnhancedSegment[] = Array.from({ length: 10 }, (_, i) =>
        createMockSegment(i + 1, i * 30, (i + 1) * 30, 'education', 8, 7)
      )

      const result = extractor.extractOptimalSegments(mockSegments, {
        minEngagementScore: 6,
        maxSegments: 3
      })

      expect(result).toHaveLength(3)
    })

    it('should ensure content type diversity', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 15, 'education', 9, 8),
        createMockSegment(2, 20, 35, 'education', 8, 7),
        createMockSegment(3, 40, 55, 'entertainment', 7, 6),
        createMockSegment(4, 60, 75, 'tips', 6, 5)
      ]

      const result = extractor.extractOptimalSegments(mockSegments, {
        minEngagementScore: 5,
        maxSegments: 10,
        ensureDiversity: true
      })

      const contentTypes = result.map(s => s.content_type)
      const uniqueTypes = new Set(contentTypes)
      
      expect(uniqueTypes.size).toBeGreaterThan(1) // Should have multiple content types
    })
  })

  describe('optimizeForPlatform', () => {
    it('should optimize segments for TikTok (vertical, short)', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 45, 'education', 8, 7),
        createMockSegment(2, 50, 110, 'entertainment', 7, 6)
      ]

      const result = extractor.optimizeForPlatform(mockSegments, 'tiktok')

      expect(result).toHaveLength(2)
      expect(result[0].end_time - result[0].start_time).toBeLessThanOrEqual(60) // TikTok max length
    })

    it('should optimize segments for Instagram Reels', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 25, 'education', 8, 7),
        createMockSegment(2, 30, 120, 'entertainment', 7, 6)
      ]

      const result = extractor.optimizeForPlatform(mockSegments, 'instagram')

      expect(result).toHaveLength(2)
      expect(result[1].end_time - result[1].start_time).toBeLessThanOrEqual(90) // Instagram max length
    })

    it('should optimize segments for YouTube Shorts', () => {
      const mockSegments: EnhancedSegment[] = [
        createMockSegment(1, 0, 30, 'education', 8, 7),
        createMockSegment(2, 40, 100, 'entertainment', 7, 6)
      ]

      const result = extractor.optimizeForPlatform(mockSegments, 'youtube')

      expect(result).toHaveLength(2)
      expect(result[1].end_time - result[1].start_time).toBeLessThanOrEqual(60) // YouTube Shorts max
    })
  })

  describe('calculateSegmentQuality', () => {
    it('should calculate quality score based on multiple factors', () => {
      const segment = createMockSegment(1, 0, 30, 'education', 8, 7)
      
      const quality = extractor.calculateSegmentQuality(segment)
      
      expect(quality).toBeGreaterThan(0)
      expect(quality).toBeLessThanOrEqual(10)
    })

    it('should penalize segments with poor visual quality', () => {
      const highQualitySegment = createMockSegment(1, 0, 30, 'education', 8, 7)
      highQualitySegment.enhanced_analysis.visual_quality_avg = 9

      const lowQualitySegment = createMockSegment(2, 40, 70, 'education', 8, 7)
      lowQualitySegment.enhanced_analysis.visual_quality_avg = 3

      const highQuality = extractor.calculateSegmentQuality(highQualitySegment)
      const lowQuality = extractor.calculateSegmentQuality(lowQualitySegment)

      expect(highQuality).toBeGreaterThan(lowQuality)
    })
  })
})

// Helper function to create mock segments
function createMockSegment(
  id: number,
  startTime: number,
  endTime: number,
  contentType: string,
  combinedScore: number,
  visualScore: number
): EnhancedSegment {
  return {
    start_time: startTime,
    end_time: endTime,
    text: `Mock segment ${id} content`,
    confidence: 0.9,
    content_type: contentType,
    visual_cues: [],
    frame_analyses: [],
    visual_engagement_score: visualScore,
    combined_engagement_score: combinedScore,
    enhanced_analysis: {
      scene_changes: 2,
      face_time: 10,
      emotion_variety: 3,
      visual_quality_avg: 7.5
    }
  }
}