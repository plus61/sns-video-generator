import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { createCanvas, loadImage } from './canvas-wrapper'

// Initialize OpenAI with optimal settings for video analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
})

export interface VideoFrame {
  timestamp: number
  frameIndex: number
  imageData: string // base64 encoded image
  width: number
  height: number
}

export interface FrameAnalysis {
  timestamp: number
  frameIndex: number
  visualElements: {
    faces: number
    text: boolean
    graphics: boolean
    motion: 'low' | 'medium' | 'high'
    complexity: number // 1-10 scale
    colorfulness: number // 1-10 scale
  }
  contentType: {
    educational: number
    entertainment: number
    product: number
    demonstration: number
    talking: number
  }
  emotionalTone: {
    excitement: number
    curiosity: number
    surprise: number
    engagement: number
  }
  technicalQuality: {
    clarity: number
    lighting: number
    composition: number
    stability: number
  }
  rawAnalysis: string
}

export interface VideoSegment {
  startTime: number
  endTime: number
  duration: number
  frames: FrameAnalysis[]
  contentType: string
  engagementScore: number
  highlights: string[]
  reasoning: string
}

export interface SegmentEvaluationCriteria {
  minDuration: number // seconds
  maxDuration: number // seconds
  minEngagementScore: number // 1-10 scale
  contentTypes: string[] // preferred content types
  requiresFace: boolean
  requiresMotion: boolean
  qualityThreshold: number // 1-10 scale
}

export class OpenAIVisionAnalyzer {
  private tempDir: string
  private frameExtractionRate: number // frames per second to extract
  private maxFramesPerSegment: number
  private analysisTimeout: number

  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp/video-analysis'
    this.frameExtractionRate = 0.5 // Extract 1 frame every 2 seconds
    this.maxFramesPerSegment = 10 // Maximum frames to analyze per segment
    this.analysisTimeout = 60000 // 60 seconds per analysis
  }

  /**
   * Extract frames from video at specified intervals
   */
  async extractFrames(videoPath: string, duration: number): Promise<VideoFrame[]> {
    await this.ensureTempDir()
    
    const frames: VideoFrame[] = []
    const totalFramesToExtract = Math.min(
      Math.ceil(duration * this.frameExtractionRate),
      50 // Maximum 50 frames per video for performance
    )

    console.log(`Extracting ${totalFramesToExtract} frames from video (${duration}s duration)`)

    try {
      // Use FFmpeg to extract frames at specified intervals
      const { spawn } = require('child_process')
      const frameInterval = duration / totalFramesToExtract

      for (let i = 0; i < totalFramesToExtract; i++) {
        const timestamp = i * frameInterval
        const outputPath = path.join(this.tempDir, `frame_${i}_${timestamp.toFixed(1)}s.jpg`)

        await new Promise<void>((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', [
            '-ss', timestamp.toString(),
            '-i', videoPath,
            '-vframes', '1',
            '-q:v', '2', // High quality
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2', // Standardize size
            '-y', // Overwrite output
            outputPath
          ])

          ffmpeg.on('close', (code: number) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`FFmpeg failed with code ${code}`))
            }
          })

          ffmpeg.on('error', reject)
        })

        // Convert to base64
        try {
          const imageBuffer = await fs.readFile(outputPath)
          const base64Image = imageBuffer.toString('base64')

          frames.push({
            timestamp,
            frameIndex: i,
            imageData: base64Image,
            width: 1280,
            height: 720
          })

          // Clean up frame file
          await fs.unlink(outputPath).catch(() => {}) // Ignore cleanup errors

        } catch (error) {
          console.warn(`Failed to process frame ${i} at ${timestamp}s:`, error)
        }
      }

      console.log(`Successfully extracted ${frames.length} frames`)
      return frames

    } catch (error) {
      console.error('Frame extraction failed:', error)
      throw new Error(`Failed to extract frames: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze a single frame using GPT-4V with optimized prompts
   */
  async analyzeFrame(frame: VideoFrame): Promise<FrameAnalysis> {
    try {
      console.log(`Analyzing frame ${frame.frameIndex} at ${frame.timestamp.toFixed(1)}s`)

      const prompt = `You are an expert video content analyzer specializing in short-form social media content optimization. Analyze this video frame and provide detailed insights for creating engaging social media clips.

FRAME CONTEXT:
- Timestamp: ${frame.timestamp.toFixed(1)} seconds
- Frame: ${frame.frameIndex + 1}

ANALYSIS REQUIREMENTS:
Please analyze this frame across these dimensions and respond in JSON format:

{
  "visualElements": {
    "faces": <number of visible faces>,
    "text": <true/false for visible text/graphics>,
    "graphics": <true/false for charts/diagrams/animations>,
    "motion": "<low/medium/high based on visual indicators>",
    "complexity": <1-10 scale of visual complexity>,
    "colorfulness": <1-10 scale of color variety and vibrancy>
  },
  "contentType": {
    "educational": <0-10 score for educational content indicators>,
    "entertainment": <0-10 score for entertainment value>,
    "product": <0-10 score for product demonstration>,
    "demonstration": <0-10 score for how-to/tutorial content>,
    "talking": <0-10 score for talking head/presentation style>
  },
  "emotionalTone": {
    "excitement": <0-10 score for exciting/energetic content>,
    "curiosity": <0-10 score for mysterious/intriguing elements>,
    "surprise": <0-10 score for unexpected/surprising elements>,
    "engagement": <0-10 overall engagement potential>
  },
  "technicalQuality": {
    "clarity": <0-10 score for image sharpness and clarity>,
    "lighting": <0-10 score for lighting quality>,
    "composition": <0-10 score for visual composition>,
    "stability": <0-10 score for perceived camera stability>
  },
  "keyInsights": "<2-3 sentence summary of the most important visual elements for social media engagement>"
}

OPTIMIZATION FOCUS:
- Prioritize elements that drive social media engagement (faces, emotions, surprises)
- Identify visual hooks that would make viewers stop scrolling
- Consider TikTok/Instagram Reels optimization factors
- Evaluate educational vs entertainment value balance`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Use latest GPT-4 with vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${frame.imageData}`,
                  detail: 'high' // High detail for better analysis
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analysis
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      // Parse JSON response
      let analysisData
      try {
        // Extract JSON from response (handle markdown formatting)
        const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*\})/)
        const jsonStr = jsonMatch ? jsonMatch[1] : content
        analysisData = JSON.parse(jsonStr)
      } catch (parseError) {
        console.warn('Failed to parse JSON, using fallback analysis:', parseError)
        // Fallback analysis
        analysisData = {
          visualElements: { faces: 0, text: false, graphics: false, motion: 'medium', complexity: 5, colorfulness: 5 },
          contentType: { educational: 5, entertainment: 5, product: 0, demonstration: 0, talking: 5 },
          emotionalTone: { excitement: 5, curiosity: 5, surprise: 3, engagement: 5 },
          technicalQuality: { clarity: 7, lighting: 6, composition: 6, stability: 7 },
          keyInsights: 'Unable to parse detailed analysis'
        }
      }

      return {
        timestamp: frame.timestamp,
        frameIndex: frame.frameIndex,
        visualElements: {
          faces: analysisData.visualElements?.faces || 0,
          text: analysisData.visualElements?.text || false,
          graphics: analysisData.visualElements?.graphics || false,
          motion: analysisData.visualElements?.motion || 'medium',
          complexity: Math.max(1, Math.min(10, analysisData.visualElements?.complexity || 5)),
          colorfulness: Math.max(1, Math.min(10, analysisData.visualElements?.colorfulness || 5))
        },
        contentType: {
          educational: Math.max(0, Math.min(10, analysisData.contentType?.educational || 0)),
          entertainment: Math.max(0, Math.min(10, analysisData.contentType?.entertainment || 0)),
          product: Math.max(0, Math.min(10, analysisData.contentType?.product || 0)),
          demonstration: Math.max(0, Math.min(10, analysisData.contentType?.demonstration || 0)),
          talking: Math.max(0, Math.min(10, analysisData.contentType?.talking || 0))
        },
        emotionalTone: {
          excitement: Math.max(0, Math.min(10, analysisData.emotionalTone?.excitement || 0)),
          curiosity: Math.max(0, Math.min(10, analysisData.emotionalTone?.curiosity || 0)),
          surprise: Math.max(0, Math.min(10, analysisData.emotionalTone?.surprise || 0)),
          engagement: Math.max(0, Math.min(10, analysisData.emotionalTone?.engagement || 0))
        },
        technicalQuality: {
          clarity: Math.max(0, Math.min(10, analysisData.technicalQuality?.clarity || 7)),
          lighting: Math.max(0, Math.min(10, analysisData.technicalQuality?.lighting || 6)),
          composition: Math.max(0, Math.min(10, analysisData.technicalQuality?.composition || 6)),
          stability: Math.max(0, Math.min(10, analysisData.technicalQuality?.stability || 7))
        },
        rawAnalysis: content
      }

    } catch (error) {
      console.error(`Frame analysis failed for frame ${frame.frameIndex}:`, error)
      
      // Return default analysis on error
      return {
        timestamp: frame.timestamp,
        frameIndex: frame.frameIndex,
        visualElements: {
          faces: 0,
          text: false,
          graphics: false,
          motion: 'medium',
          complexity: 5,
          colorfulness: 5
        },
        contentType: {
          educational: 0,
          entertainment: 0,
          product: 0,
          demonstration: 0,
          talking: 0
        },
        emotionalTone: {
          excitement: 0,
          curiosity: 0,
          surprise: 0,
          engagement: 0
        },
        technicalQuality: {
          clarity: 5,
          lighting: 5,
          composition: 5,
          stability: 5
        },
        rawAnalysis: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Analyze video frames in batches for efficiency
   */
  async analyzeFramesBatch(frames: VideoFrame[]): Promise<FrameAnalysis[]> {
    const batchSize = 3 // Process 3 frames concurrently to balance speed and API limits
    const analyses: FrameAnalysis[] = []

    console.log(`Analyzing ${frames.length} frames in batches of ${batchSize}`)

    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize)
      
      try {
        const batchPromises = batch.map(frame => this.analyzeFrame(frame))
        const batchResults = await Promise.all(batchPromises)
        
        analyses.push(...batchResults)
        
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(frames.length / batchSize)}`)
        
        // Rate limiting: wait between batches to avoid hitting API limits
        if (i + batchSize < frames.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }
        
      } catch (error) {
        console.error(`Batch analysis failed for frames ${i}-${i + batchSize - 1}:`, error)
        
        // Add default analyses for failed batch
        for (const frame of batch) {
          analyses.push(await this.analyzeFrame(frame)) // This will return default on error
        }
      }
    }

    return analyses
  }

  /**
   * Calculate engagement score based on multiple factors optimized for social media
   */
  calculateEngagementScore(frameAnalyses: FrameAnalysis[]): number {
    if (frameAnalyses.length === 0) return 0

    const weights = {
      // Visual engagement factors
      faces: 0.15,           // People drive engagement
      motion: 0.12,          // Movement catches attention
      colorfulness: 0.08,    // Vibrant colors stand out
      complexity: 0.05,      // Moderate complexity optimal
      
      // Content type factors  
      entertainment: 0.15,   // Entertainment performs well
      educational: 0.10,     // Educational has loyal audience
      surprise: 0.15,        // Surprise elements drive shares
      
      // Emotional factors
      excitement: 0.12,      // Excitement drives engagement
      curiosity: 0.08,       // Curiosity encourages completion
      
      // Technical quality
      quality: 0.10         // Overall technical quality
    }

    let totalScore = 0
    let frameCount = frameAnalyses.length

    for (const analysis of frameAnalyses) {
      let frameScore = 0

      // Visual factors
      frameScore += analysis.visualElements.faces * weights.faces
      
      // Motion score (convert to numeric)
      const motionScore = analysis.visualElements.motion === 'high' ? 10 : 
                         analysis.visualElements.motion === 'medium' ? 6 : 3
      frameScore += motionScore * weights.motion

      frameScore += analysis.visualElements.colorfulness * weights.colorfulness
      
      // Complexity penalty for too high complexity
      const complexityScore = analysis.visualElements.complexity > 7 ? 
        (10 - analysis.visualElements.complexity) : analysis.visualElements.complexity
      frameScore += complexityScore * weights.complexity

      // Content type factors
      frameScore += analysis.contentType.entertainment * weights.entertainment
      frameScore += analysis.contentType.educational * weights.educational
      
      // Emotional factors
      frameScore += analysis.emotionalTone.surprise * weights.surprise
      frameScore += analysis.emotionalTone.excitement * weights.excitement
      frameScore += analysis.emotionalTone.curiosity * weights.curiosity

      // Technical quality (average of all quality metrics)
      const avgQuality = (
        analysis.technicalQuality.clarity +
        analysis.technicalQuality.lighting +
        analysis.technicalQuality.composition +
        analysis.technicalQuality.stability
      ) / 4
      frameScore += avgQuality * weights.quality

      totalScore += frameScore
    }

    // Average across frames and normalize to 1-10 scale
    const avgScore = totalScore / frameCount
    const normalizedScore = Math.max(1, Math.min(10, Math.round(avgScore * 10) / 10))

    return normalizedScore
  }

  /**
   * Evaluate and score video segments based on social media optimization criteria
   */
  evaluateSegments(
    frameAnalyses: FrameAnalysis[], 
    criteria: SegmentEvaluationCriteria,
    videoDuration: number
  ): VideoSegment[] {
    const segments: VideoSegment[] = []
    const segmentLength = criteria.maxDuration
    const overlapRatio = 0.5 // 50% overlap between segments for better coverage

    console.log(`Evaluating segments with criteria:`, criteria)

    // Generate overlapping segments
    for (let start = 0; start < videoDuration - criteria.minDuration; start += segmentLength * (1 - overlapRatio)) {
      const end = Math.min(start + segmentLength, videoDuration)
      
      // Get frames within this segment
      const segmentFrames = frameAnalyses.filter(
        frame => frame.timestamp >= start && frame.timestamp <= end
      )

      if (segmentFrames.length === 0) continue

      // Calculate engagement score for this segment
      const engagementScore = this.calculateEngagementScore(segmentFrames)

      // Determine primary content type
      const contentTypeScores = segmentFrames.reduce((acc, frame) => {
        acc.educational += frame.contentType.educational
        acc.entertainment += frame.contentType.entertainment
        acc.product += frame.contentType.product
        acc.demonstration += frame.contentType.demonstration
        acc.talking += frame.contentType.talking
        return acc
      }, { educational: 0, entertainment: 0, product: 0, demonstration: 0, talking: 0 })

      const primaryContentType = Object.entries(contentTypeScores)
        .sort(([,a], [,b]) => b - a)[0][0]

      // Generate highlights and reasoning
      const highlights = this.generateSegmentHighlights(segmentFrames)
      const reasoning = this.generateSegmentReasoning(segmentFrames, engagementScore, primaryContentType)

      // Apply criteria filters
      const passesFilters = this.evaluateSegmentCriteria(segmentFrames, criteria, engagementScore)

      if (passesFilters) {
        segments.push({
          startTime: start,
          endTime: end,
          duration: end - start,
          frames: segmentFrames,
          contentType: primaryContentType,
          engagementScore,
          highlights,
          reasoning
        })
      }
    }

    // Sort by engagement score and return top segments
    return segments
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10) // Return top 10 segments
  }

  /**
   * Generate highlights for a segment
   */
  private generateSegmentHighlights(frames: FrameAnalysis[]): string[] {
    const highlights: string[] = []

    // Check for faces
    const faceFrames = frames.filter(f => f.visualElements.faces > 0)
    if (faceFrames.length > 0) {
      highlights.push(`Contains ${Math.max(...faceFrames.map(f => f.visualElements.faces))} visible faces`)
    }

    // Check for high engagement moments
    const highEngagementFrames = frames.filter(f => f.emotionalTone.engagement > 7)
    if (highEngagementFrames.length > 0) {
      highlights.push(`${highEngagementFrames.length} high-engagement moments`)
    }

    // Check for surprise elements
    const surpriseFrames = frames.filter(f => f.emotionalTone.surprise > 6)
    if (surpriseFrames.length > 0) {
      highlights.push('Contains surprise elements')
    }

    // Check for motion
    const motionFrames = frames.filter(f => f.visualElements.motion === 'high')
    if (motionFrames.length > frames.length * 0.3) {
      highlights.push('High visual motion throughout')
    }

    return highlights.slice(0, 3) // Limit to top 3 highlights
  }

  /**
   * Generate reasoning for segment selection
   */
  private generateSegmentReasoning(
    frames: FrameAnalysis[], 
    engagementScore: number, 
    contentType: string
  ): string {
    const avgExcitement = frames.reduce((sum, f) => sum + f.emotionalTone.excitement, 0) / frames.length
    const avgQuality = frames.reduce((sum, f) => 
      sum + (f.technicalQuality.clarity + f.technicalQuality.lighting + f.technicalQuality.composition + f.technicalQuality.stability) / 4, 0
    ) / frames.length

    return `This ${frames.length}-frame segment scores ${engagementScore.toFixed(1)}/10 for engagement with primary content type: ${contentType}. ` +
           `Features ${avgExcitement.toFixed(1)}/10 excitement level and ${avgQuality.toFixed(1)}/10 technical quality. ` +
           `Optimized for social media engagement based on visual elements, emotional tone, and content structure.`
  }

  /**
   * Evaluate if segment meets criteria
   */
  private evaluateSegmentCriteria(
    frames: FrameAnalysis[], 
    criteria: SegmentEvaluationCriteria, 
    engagementScore: number
  ): boolean {
    // Check engagement score threshold
    if (engagementScore < criteria.minEngagementScore) {
      return false
    }

    // Check face requirement
    if (criteria.requiresFace) {
      const hasFaces = frames.some(f => f.visualElements.faces > 0)
      if (!hasFaces) return false
    }

    // Check motion requirement
    if (criteria.requiresMotion) {
      const hasMotion = frames.some(f => f.visualElements.motion !== 'low')
      if (!hasMotion) return false
    }

    // Check quality threshold
    const avgQuality = frames.reduce((sum, f) => 
      sum + (f.technicalQuality.clarity + f.technicalQuality.lighting + f.technicalQuality.composition + f.technicalQuality.stability) / 4, 0
    ) / frames.length
    
    if (avgQuality < criteria.qualityThreshold) {
      return false
    }

    return true
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir)
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.tempDir, file)).catch(() => {}))
      )
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }
}

/**
 * Default segment evaluation criteria optimized for social media
 */
export const DEFAULT_SEGMENT_CRITERIA: SegmentEvaluationCriteria = {
  minDuration: 10,        // 10 seconds minimum
  maxDuration: 30,        // 30 seconds maximum  
  minEngagementScore: 6,  // 6/10 minimum engagement
  contentTypes: ['entertainment', 'educational', 'demonstration'],
  requiresFace: false,    // Don't require faces (more flexible)
  requiresMotion: true,   // Require some motion for social media
  qualityThreshold: 5     // 5/10 minimum quality
}

/**
 * High-quality segment criteria for premium content
 */
export const HIGH_QUALITY_SEGMENT_CRITERIA: SegmentEvaluationCriteria = {
  minDuration: 15,
  maxDuration: 25,
  minEngagementScore: 7.5,
  contentTypes: ['entertainment', 'educational'],
  requiresFace: true,
  requiresMotion: true,
  qualityThreshold: 7
}