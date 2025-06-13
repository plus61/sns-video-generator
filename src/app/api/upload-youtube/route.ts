import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    
    if (!match) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoId = uuidv4()
    const youtubeVideoId = match[4]

    // Save YouTube video metadata to database
    const { error: dbError } = await supabaseAdmin
      .from('video_uploads')
      .insert({
        id: videoId,
        user_id: session.user.id,
        youtube_url: url,
        youtube_video_id: youtubeVideoId,
        upload_source: 'youtube',
        status: 'pending_download',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save video metadata' }, { status: 500 })
    }

    // Start background processing (in a real app, this would be a queue job)
    processYouTubeVideo(videoId).catch(console.error)

    return NextResponse.json({
      success: true,
      videoId,
      message: 'YouTube video processing started'
    })

  } catch (error) {
    console.error('Upload YouTube error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Background processing function (simplified)
async function processYouTubeVideo(videoId: string) {
  try {
    // Update status to processing
    await supabaseAdmin
      .from('video_uploads')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // In a real implementation, you would:
    // 1. Use youtube-dl or similar to download the video
    // 2. Extract metadata (title, description, duration)
    // 3. Upload to storage
    // 4. Update database with file info

    // For now, we'll simulate the process and mark as ready for analysis
    setTimeout(async () => {
      await supabaseAdmin
        .from('video_uploads')
        .update({ 
          status: 'ready_for_analysis',
          // In real implementation, add actual metadata:
          // original_filename: extractedTitle + '.mp4',
          // file_size: actualFileSize,
          // duration: actualDuration,
          // public_url: actualStorageUrl
        })
        .eq('id', videoId)
    }, 5000) // Simulate 5 second processing

  } catch (error) {
    console.error('YouTube processing error:', error)
    
    // Update status to error
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', videoId)
  }
}