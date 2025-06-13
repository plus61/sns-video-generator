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

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const filename = formData.get('filename') as string
    const filesize = parseInt(formData.get('filesize') as string)

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 5GB)
    if (filesize > 5 * 1024 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const videoId = uuidv4()
    const fileExtension = filename.split('.').pop()
    const storagePath = `videos/${session.user.id}/${videoId}.${fileExtension}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(storagePath, buffer, {
        contentType: videoFile.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(storagePath)

    // Save video metadata to database
    const { error: dbError } = await supabaseAdmin
      .from('video_uploads')
      .insert({
        id: videoId,
        user_id: session.user.id,
        original_filename: filename,
        file_size: filesize,
        file_type: videoFile.type,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        upload_source: 'file',
        status: 'uploaded',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from('videos').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save video metadata' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      videoId,
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