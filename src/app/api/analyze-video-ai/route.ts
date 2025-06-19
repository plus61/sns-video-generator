import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"

import { createVideoAnalysisService } from '@/lib/video-analysis-service'
import { DEFAULT_SEGMENT_CRITERIA, HIGH_QUALITY_SEGMENT_CRITERIA } from '@/lib/vision-analyzer'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, criteria = 'default' } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Get video information
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if video is ready for analysis
    if (!['ready_for_analysis', 'completed'].includes(video.status)) {
      return NextResponse.json({ 
        error: 'Video is not ready for analysis',
        status: video.status 
      }, { status: 400 })
    }

    // Determine video path (handle both local and storage paths)
    let videoPath = video.storage_path
    if (!videoPath) {
      return NextResponse.json({ error: 'Video file not available' }, { status: 400 })
    }

    // If it's a storage path, we might need to download it first
    // For now, assume we have direct access to the file
    
    // Select analysis criteria
    const analysisService = createVideoAnalysisService()
    const selectedCriteria = criteria === 'high_quality' ? HIGH_QUALITY_SEGMENT_CRITERIA : DEFAULT_SEGMENT_CRITERIA

    console.log(`Starting AI analysis for video ${videoId} with ${criteria} criteria`)

    // Start analysis (this will run in background)
    const analysisPromise = analysisService.analyzeVideo({
      videoId,
      videoPath,
      duration: video.duration || 300,
      userId: user.id,
      criteria: selectedCriteria
    })

    // Update video status to indicate analysis has started
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'analyzing',
        analysis_progress: 'AI analysis started',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    // For real-time updates, you would typically use WebSockets or Server-Sent Events
    // For now, we'll start the analysis and return immediately
    analysisPromise.catch(error => {
      console.error(`Background analysis failed for video ${videoId}:`, error)
    })

    return NextResponse.json({
      success: true,
      message: 'AI video analysis started',
      videoId,
      criteria: criteria,
      estimatedTime: '2-5 minutes'
    })

  } catch (error) {
    console.error('AI video analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Get analysis results
    const analysisService = createVideoAnalysisService()
    const results = await analysisService.getAnalysisResults(videoId, user.id)

    if (results.error) {
      return NextResponse.json({ error: results.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      video: {
        id: results.video.id,
        status: results.video.status,
        analysis_data: results.video.analysis_data,
        analysis_progress: results.video.analysis_progress,
        duration: results.video.duration,
        created_at: results.video.created_at
      },
      segments: results.segments.map(segment => ({
        id: segment.id,
        start_time: segment.start_time,
        end_time: segment.end_time,
        title: segment.title,
        description: segment.description,
        content_type: segment.content_type,
        engagement_score: segment.engagement_score,
        visual_cues: segment.visual_cues,
        status: segment.status
      })),
      totalSegments: results.segments.length
    })

  } catch (error) {
    console.error('Get analysis results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}