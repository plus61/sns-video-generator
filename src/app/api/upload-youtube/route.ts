import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { YouTubeDownloader, DownloadErrorType } from '@/lib/youtube-downloader'

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
      console.error('Error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // Check for common errors
      if (dbError.code === '23503') {
        return NextResponse.json({ 
          error: 'User authentication error. Please sign in again.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to save video metadata',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 })
    }

    // Start background processing (in a real app, this would be a queue job)
    processYouTubeVideo(videoId, url).catch(console.error)

    return NextResponse.json({
      success: true,
      videoId,
      message: 'YouTube video processing started'
    })

  } catch (error) {
    console.error('Upload YouTube error:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// Background processing function with enhanced error handling
async function processYouTubeVideo(videoId: string, youtubeUrl: string) {
  const downloader = new YouTubeDownloader()
  
  try {
    await downloader.processYouTubeVideo(videoId, youtubeUrl)
  } catch (error) {
    console.error('YouTube processing failed:', error)
    
    // Update database with specific error information
    let errorMessage = 'Unknown error occurred'
    let userFriendlyMessage = 'Sorry, we could not process this video.'
    
    if (error.name === 'YouTubeDownloadError') {
      switch (error.errorType) {
        case DownloadErrorType.PRIVATE_VIDEO:
          userFriendlyMessage = 'This video is private and cannot be processed.'
          break
        case DownloadErrorType.VIDEO_UNAVAILABLE:
          userFriendlyMessage = 'This video is unavailable or has been removed.'
          break
        case DownloadErrorType.GEOBLOCKED:
          userFriendlyMessage = 'This video is not available in your region.'
          break
        case DownloadErrorType.FILE_TOO_LARGE:
          userFriendlyMessage = 'This video file is too large to process.'
          break
        case DownloadErrorType.QUOTA_EXCEEDED:
          userFriendlyMessage = 'Service temporarily unavailable. Please try again later.'
          break
        case DownloadErrorType.NETWORK_ERROR:
          userFriendlyMessage = 'Network error. Please check your connection and try again.'
          break
        default:
          userFriendlyMessage = 'Unable to process this video. Please try with a different video.'
      }
      errorMessage = error.message
    } else {
      errorMessage = error.message || 'Unknown error'
    }
    
    // Update database with error details
    await supabaseAdmin
      .from('video_uploads')
      .update({ 
        status: 'error',
        error_message: userFriendlyMessage,
        error_details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
  }
}