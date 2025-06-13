import { EnhancedSegment } from './gpt4v'

export interface SegmentExtractionOptions {
  minEngagementScore?: number
  maxSegments?: number
  minDuration?: number
  maxDuration?: number
  ensureDiversity?: boolean
}

export interface PlatformOptimizedSegment extends EnhancedSegment {
  platform_optimization?: {
    platform: string
    recommended_length: number
    aspect_ratio: string
  }
}

export type Platform = 'tiktok' | 'instagram' | 'youtube'

export class SegmentExtractor {
  private defaultOptions: Required<SegmentExtractionOptions> = {
    minEngagementScore: 6,
    maxSegments: 5,
    minDuration: 15,
    maxDuration: 60,
    ensureDiversity: true
  }

  /**
   * Extract optimal segments based on engagement scores and other criteria
   */
  extractOptimalSegments(
    segments: EnhancedSegment[], 
    options: SegmentExtractionOptions = {}
  ): EnhancedSegment[] {
    const opts = { ...this.defaultOptions, ...options }
    
    // Step 1: Filter by engagement score
    let filteredSegments = segments.filter(
      segment => segment.combined_engagement_score >= opts.minEngagementScore
    )

    // Step 2: Filter by duration constraints
    filteredSegments = filteredSegments.filter(segment => {
      const duration = segment.end_time - segment.start_time
      return duration >= opts.minDuration && duration <= opts.maxDuration
    })

    // Step 3: Remove overlapping segments (keep higher scored ones)
    filteredSegments = this.removeOverlappingSegments(filteredSegments)

    // Step 4: Sort by combined engagement score (descending)
    filteredSegments.sort((a, b) => b.combined_engagement_score - a.combined_engagement_score)

    // Step 5: Ensure content type diversity if requested
    if (opts.ensureDiversity) {
      filteredSegments = this.ensureContentDiversity(filteredSegments)
    }

    // Step 6: Limit to maximum number of segments
    return filteredSegments.slice(0, opts.maxSegments)
  }

  /**
   * Optimize segments for specific platform requirements
   */
  optimizeForPlatform(
    segments: EnhancedSegment[], 
    platform: Platform
  ): PlatformOptimizedSegment[] {
    const platformLimits = this.getPlatformLimits(platform)
    
    return segments.map(segment => {
      const duration = segment.end_time - segment.start_time
      let end_time = segment.end_time

      // Trim segment if it exceeds platform limits
      if (duration > platformLimits.maxDuration) {
        const excessTime = duration - platformLimits.maxDuration
        end_time = segment.end_time - excessTime
      }

      // Create optimized segment with platform metadata
      const optimizedSegment: PlatformOptimizedSegment = {
        ...segment,
        end_time,
        platform_optimization: {
          platform,
          recommended_length: platformLimits.maxDuration,
          aspect_ratio: platformLimits.aspectRatio
        }
      }

      return optimizedSegment
    })
  }

  /**
   * Calculate overall quality score for a segment
   */
  calculateSegmentQuality(segment: EnhancedSegment): number {
    const engagementWeight = 0.4
    const visualQualityWeight = 0.3
    const confidenceWeight = 0.2
    const diversityWeight = 0.1

    const engagementScore = segment.combined_engagement_score || 5
    const visualQuality = segment.enhanced_analysis?.visual_quality_avg || 5
    const confidence = segment.confidence * 10 // Convert to 0-10 scale
    const diversityBonus = this.getContentTypeDiversityBonus(segment.content_type)

    const qualityScore = 
      (engagementScore * engagementWeight) +
      (visualQuality * visualQualityWeight) +
      (confidence * confidenceWeight) +
      (diversityBonus * diversityWeight)

    return Math.min(Math.max(qualityScore, 0), 10)
  }

  /**
   * Remove overlapping segments, keeping the ones with higher engagement scores
   */
  private removeOverlappingSegments(segments: EnhancedSegment[]): EnhancedSegment[] {
    const sortedSegments = [...segments].sort((a, b) => a.start_time - b.start_time)
    const nonOverlapping: EnhancedSegment[] = []

    for (const current of sortedSegments) {
      const hasOverlap = nonOverlapping.some(existing => 
        this.segmentsOverlap(existing, current)
      )

      if (!hasOverlap) {
        nonOverlapping.push(current)
      } else {
        // Find overlapping segment and keep the one with higher score
        const overlappingIndex = nonOverlapping.findIndex(existing =>
          this.segmentsOverlap(existing, current)
        )
        
        if (overlappingIndex !== -1) {
          const existing = nonOverlapping[overlappingIndex]
          if (current.combined_engagement_score > existing.combined_engagement_score) {
            nonOverlapping[overlappingIndex] = current
          }
        }
      }
    }

    return nonOverlapping
  }

  /**
   * Ensure content type diversity in selected segments
   */
  private ensureContentDiversity(segments: EnhancedSegment[]): EnhancedSegment[] {
    const contentTypeGroups = new Map<string, EnhancedSegment[]>()
    
    // Group segments by content type
    segments.forEach(segment => {
      const type = segment.content_type || 'general'
      if (!contentTypeGroups.has(type)) {
        contentTypeGroups.set(type, [])
      }
      contentTypeGroups.get(type)!.push(segment)
    })

    // Take best segments from each content type
    const diverseSegments: EnhancedSegment[] = []
    const maxPerType = Math.max(1, Math.floor(segments.length / contentTypeGroups.size))

    contentTypeGroups.forEach(typeSegments => {
      typeSegments.sort((a, b) => b.combined_engagement_score - a.combined_engagement_score)
      diverseSegments.push(...typeSegments.slice(0, maxPerType))
    })

    return diverseSegments.sort((a, b) => b.combined_engagement_score - a.combined_engagement_score)
  }

  /**
   * Check if two segments overlap in time
   */
  private segmentsOverlap(segment1: EnhancedSegment, segment2: EnhancedSegment): boolean {
    return !(segment1.end_time <= segment2.start_time || segment2.end_time <= segment1.start_time)
  }

  /**
   * Get platform-specific limits and requirements
   */
  private getPlatformLimits(platform: Platform) {
    const limits = {
      tiktok: {
        maxDuration: 60,
        minDuration: 15,
        aspectRatio: '9:16'
      },
      instagram: {
        maxDuration: 90,
        minDuration: 15,
        aspectRatio: '9:16'
      },
      youtube: {
        maxDuration: 60,
        minDuration: 15,
        aspectRatio: '9:16'
      }
    }

    return limits[platform]
  }

  /**
   * Get diversity bonus for different content types
   */
  private getContentTypeDiversityBonus(contentType: string): number {
    const bonuses = {
      'education': 2,
      'entertainment': 3,
      'tips': 2,
      'question': 1,
      'general': 0
    }

    return bonuses[contentType as keyof typeof bonuses] || 0
  }
}