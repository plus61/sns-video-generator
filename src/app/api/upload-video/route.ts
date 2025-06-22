import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { createStorageService } from '../../../lib/supabase-storage'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Create storage service instance for the authenticated user
    const storageService = createStorageService(user.id)

    // Upload video with progress tracking
    const uploadResult = await storageService.uploadVideo(videoFile, {
      chunkSize: 10 * 1024 * 1024, // 10MB chunks
      maxRetries: 3,
      onProgress: (progress) => {
        // Progress tracking could be implemented with WebSockets or SSE
        console.log(`Upload progress: ${progress}%`)
      }
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      videoId: uploadResult.videoId,
      publicUrl: uploadResult.publicUrl,
      storagePath: uploadResult.storagePath,
      metadata: uploadResult.metadata,
      message: 'Video uploaded successfully'
    })

  } catch (error) {
    console.error('Upload video error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const storageService = createStorageService(user.id)
    const deleteResult = await storageService.deleteVideo(videoId)

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Delete failed' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error) {
    console.error('Delete video error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}