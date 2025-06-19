import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { downloadYouTubeVideo, youtubeDownloader } from '@/lib/youtube-downloader-enhanced'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ 
        error: 'Valid YouTube URL is required' 
      }, { status: 400 })
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ 
        error: 'Invalid YouTube URL format' 
      }, { status: 400 })
    }

    console.log(`🔄 Processing YouTube URL: ${url} for user: ${user.id}`)

    // Download video info using enhanced downloader
    const result = await downloadYouTubeVideo(url, user.id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to download video information',
        videoId: result.videoId
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      metadata: result.metadata,
      method: result.method,
      message: `Video information downloaded successfully using ${result.method}`
    })

  } catch (error) {
    console.error('Enhanced YouTube download error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get downloader status for debugging
    const status = youtubeDownloader.getDownloaderStatus()

    return NextResponse.json({
      success: true,
      status: {
        available: status.available,
        failed: status.failed,
        totalAvailable: status.available.length,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
          isRailway: !!process.env.RAILWAY_ENVIRONMENT
        }
      },
      message: 'YouTube downloader status retrieved successfully'
    })

  } catch (error) {
    console.error('Get downloader status error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}