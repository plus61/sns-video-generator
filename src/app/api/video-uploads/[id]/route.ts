import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: videoId } = await params

    // Get video upload details
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', session.user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Get segments if analysis is completed
    let segments = []
    if (video.status === 'completed') {
      const { data: segmentsData, error: segmentsError } = await supabaseAdmin
        .from('video_segments')
        .select('*')
        .eq('video_upload_id', videoId)
        .order('engagement_score', { ascending: false })

      if (!segmentsError && segmentsData) {
        segments = segmentsData
      }
    }

    return NextResponse.json({
      success: true,
      video,
      segments
    })

  } catch (error) {
    console.error('Get video upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}