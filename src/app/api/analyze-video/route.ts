import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../utils/supabase/server"

import { supabaseAdmin } from '../../../lib/supabase'
import { whisperService, type ContentSegment, type TranscriptionResult } from '../../../lib/whisper'
import { gpt4vService, type EnhancedSegment } from '../../../lib/gpt4v'
import { SegmentExtractor } from '../../../lib/segment-extractor'
import { AnalysisResult } from '../../../types/analysis-result'
import { PlatformOptimizations } from '../../../types/platform-optimization'
import OpenAI from 'openai'

interface AnalyzedSegment extends ContentSegment {
  engagement_score: number
  analysis: {
    engagement_score: number
    completeness_score: number
    sns_score: number
    viral_score: number
    reasoning: string
    suggested_title: string
    hashtags: string[]
    platform_recommendations: string[]
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Get video upload details
    const { data: videoUpload, error: fetchError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !videoUpload) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (videoUpload.status === 'analyzing' || videoUpload.status === 'completed') {
      return NextResponse.json({ 
        message: 'Analysis already in progress or completed',
        status: videoUpload.status 
      })
    }

    // Update status to analyzing
    await supabaseAdmin
      .from('video_uploads')
      .update({ status: 'analyzing' })
      .eq('id', videoId)

    // Start analysis process
    processVideoAnalysis(videoId, videoUpload.public_url).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Video analysis started',
      videoId
    })

  } catch (error) {
    console.error('Analyze video error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Background processing function
async function processVideoAnalysis(videoId: string, videoUrl: string) {
  try {
    console.log(`Starting analysis for video ${videoId}`)

    // Step 1: Extract audio and transcribe with Whisper
    const transcriptionResult = await transcribeVideoAudio(videoUrl)
    
    // Step 2: Extract content segments
    const contentSegments = whisperService.extractContentSegments(transcriptionResult)
    
    // Step 3: Extract key frames and analyze with GPT-4V
    const keyFrames = await gpt4vService.extractKeyFrames(videoUrl, transcriptionResult.duration || 60)
    const frameAnalyses = await gpt4vService.analyzeFrames(keyFrames)
    const visualCues = gpt4vService.extractVisualCues(frameAnalyses)
    
    // Step 4: Enhance segments with visual data
    const enhancedSegments = gpt4vService.enhanceSegmentsWithVisualData(contentSegments, frameAnalyses, visualCues)
    
    // Step 5: Analyze segments with GPT-4 for engagement potential
    const analyzedSegments = await analyzeSegmentsWithGPT(enhancedSegments, transcriptionResult.text)
    
    // Step 6: Extract optimal segments using the new algorithm
    const segmentExtractor = new SegmentExtractor()
    const optimalSegments = segmentExtractor.extractOptimalSegments(analyzedSegments, {
      minEngagementScore: 6,
      maxSegments: 10,
      minDuration: 15,
      maxDuration: 60,
      ensureDiversity: true
    })
    
    // Step 7: Generate platform-optimized versions
    const platformOptimizations = {
      tiktok: segmentExtractor.optimizeForPlatform(optimalSegments, 'tiktok'),
      instagram: segmentExtractor.optimizeForPlatform(optimalSegments, 'instagram'),
      youtube: segmentExtractor.optimizeForPlatform(optimalSegments, 'youtube')
    }
    
    // Step 8: Save results to database
    await saveAnalysisResults(videoId, transcriptionResult, analyzedSegments, platformOptimizations)

    // Step 9: Update video status
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'completed',
        transcript: transcriptionResult.text,
        analysis_data: {
          language: transcriptionResult.language,
          duration: transcriptionResult.duration,
          segments_count: optimalSegments.length,
          optimal_segments_count: optimalSegments.length,
          confidence_avg: contentSegments.reduce((acc, seg) => acc + seg.confidence, 0) / contentSegments.length
        }
      })
      .eq('id', videoId)

    console.log(`Analysis completed for video ${videoId}`)

  } catch (error) {
    console.error(`Analysis failed for video ${videoId}:`, error)
    
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Analysis failed'
      })
      .eq('id', videoId)
  }
}

async function transcribeVideoAudio(videoUrl: string) {
  // In a production environment, you would:
  // 1. Download the video file
  // 2. Extract audio using FFmpeg
  // 3. Split into chunks if > 25MB
  // 4. Send to Whisper API
  
  // For demonstration, we'll simulate the process
  console.log('Transcribing audio from:', videoUrl)
  
  // Simulate transcription result
  const mockTranscription = {
    text: "これは動画の自動生成された転写テキストです。実際の実装では、FFmpegを使用して動画から音声を抽出し、Whisper APIで転写を行います。",
    segments: [
      {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 5.0,
        text: "これは動画の自動生成された転写テキストです。",
        tokens: [],
        temperature: 0.0,
        avg_logprob: -0.3,
        compression_ratio: 1.2,
        no_speech_prob: 0.1
      },
      {
        id: 1,
        seek: 500,
        start: 5.0,
        end: 12.0,
        text: "実際の実装では、FFmpegを使用して動画から音声を抽出し、Whisper APIで転写を行います。",
        tokens: [],
        temperature: 0.0,
        avg_logprob: -0.25,
        compression_ratio: 1.1,
        no_speech_prob: 0.05
      }
    ],
    language: 'ja',
    duration: 12.0
  }

  return mockTranscription
}

async function analyzeSegmentsWithGPT(segments: EnhancedSegment[], fullTranscript: string) {
  const analysisPrompt = `
以下の動画転写テキストから抽出されたセグメントを分析し、SNSショート動画として最適なセグメントを特定してください。

全体の転写:
${fullTranscript}

各セグメントを以下の基準で1-10のスコアで評価してください:
1. エンゲージメント性（視聴者の興味を引く度合い）
2. 完結性（単体で理解できる内容か）
3. SNS適性（短時間で伝わりやすいか）
4. バイラル性（シェアされやすいか）

セグメント（音声 + 映像解析付き）:
${segments.map((seg, index) => `${index + 1}. ${seg.start_time}s-${seg.end_time}s: "${seg.text}"
   映像エンゲージメントスコア: ${seg.visual_engagement_score}/10
   視覚的手がかり: ${seg.visual_cues.length}個
   シーン変更: ${seg.enhanced_analysis?.scene_changes || 0}回
   顔検出時間: ${seg.enhanced_analysis?.face_time || 0}フレーム`).join('\n')}

各セグメントに対して、JSON形式で以下の情報を返してください:
{
  "segments": [
    {
      "index": 1,
      "engagement_score": 7,
      "completeness_score": 8,
      "sns_score": 6,
      "viral_score": 5,
      "overall_score": 6.5,
      "reasoning": "このセグメントが選ばれた理由",
      "suggested_title": "提案されるタイトル",
      "hashtags": ["#関連", "#ハッシュタグ"],
      "platform_recommendations": ["TikTok", "Instagram"]
    }
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたはソーシャルメディアのコンテンツ分析の専門家です。動画セグメントのエンゲージメント性を正確に評価してください。'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}') as { 
      segments?: Array<{ 
        index: number; 
        overall_score?: number; 
        engagement_score?: number; 
        completeness_score?: number; 
        sns_score?: number; 
        viral_score?: number; 
        reasoning?: string; 
        suggested_title?: string; 
        hashtags?: string[]; 
        platform_recommendations?: string[] 
      }> 
    }
    
    // Merge analysis results with original segments
    return segments.map((segment, index) => {
      const analysisResult = analysis.segments?.find((s) => s.index === index + 1) || {}
      
      // Combine GPT analysis with visual engagement score
      const gptScore = (analysisResult as AnalysisResult & { overall_score?: number }).overall_score || 5
      const visualScore = (segment as unknown as EnhancedSegment).combined_engagement_score || 5
      const combinedEngagementScore = Math.round((gptScore + visualScore) / 2)
      
      return {
        ...segment,
        engagement_score: combinedEngagementScore,
        analysis: {
          engagement_score: (analysisResult as AnalysisResult).engagement_score || 5,
          completeness_score: (analysisResult as AnalysisResult).completeness_score || 5,
          sns_score: (analysisResult as AnalysisResult).sns_score || 5,
          viral_score: (analysisResult as AnalysisResult).viral_score || 5,
          reasoning: (analysisResult as AnalysisResult).reasoning || 'No analysis available',
          suggested_title: (analysisResult as AnalysisResult).suggested_title || segment.text.substring(0, 50) + '...',
          hashtags: (analysisResult as AnalysisResult).hashtags || [],
          platform_recommendations: (analysisResult as AnalysisResult).platform_recommendations || ['TikTok']
        }
      }
    })
  } catch (error) {
    console.error('GPT analysis error:', error)
    
    // Return segments with visual scores if GPT analysis fails
    return segments.map(segment => ({
      ...segment,
      engagement_score: segment.combined_engagement_score || 5,
      analysis: {
        engagement_score: segment.visual_engagement_score || 5,
        completeness_score: 5,
        sns_score: 5,
        viral_score: 5,
        reasoning: 'GPT analysis unavailable - using visual analysis only',
        suggested_title: segment.text.substring(0, 50) + '...',
        hashtags: [],
        platform_recommendations: ['TikTok']
      }
    }))
  }
}

async function saveAnalysisResults(
  videoId: string, 
  transcription: TranscriptionResult, 
  segments: AnalyzedSegment[],
  platformOptimizations?: PlatformOptimizations
) {
  // Save segments to database
  const segmentInserts = segments.map(segment => ({
    video_upload_id: videoId,
    start_time: segment.start_time,
    end_time: segment.end_time,
    title: segment.analysis.suggested_title,
    description: segment.text,
    content_type: segment.content_type,
    engagement_score: Math.round(segment.engagement_score),
    transcript_segment: segment.text,
    visual_cues: {
      cues: (segment as unknown as EnhancedSegment).visual_cues || [],
      frame_analyses: (segment as unknown as EnhancedSegment).frame_analyses || [],
      visual_engagement_score: (segment as unknown as EnhancedSegment).visual_engagement_score || 5,
      enhanced_analysis: (segment as unknown as EnhancedSegment).enhanced_analysis || {}
    },
    audio_features: {
      confidence: segment.confidence
    },
    platform_optimizations: {
      analysis: segment.analysis,
      visual_metrics: {
        scene_changes: (segment as unknown as EnhancedSegment).enhanced_analysis?.scene_changes || 0,
        face_detection_score: (segment as unknown as EnhancedSegment).enhanced_analysis?.face_time || 0,
        emotion_variety: (segment as unknown as EnhancedSegment).enhanced_analysis?.emotion_variety || 0,
        visual_quality_avg: (segment as unknown as EnhancedSegment).enhanced_analysis?.visual_quality_avg || 5
      },
      platforms: platformOptimizations || {}
    },
    status: 'extracted'
  }))

  const { error } = await supabaseAdmin
    .from('video_segments')
    .insert(segmentInserts)

  if (error) {
    console.error('Error saving segments:', error)
    throw error
  }

  console.log(`Saved ${segments.length} segments for video ${videoId}`)
}