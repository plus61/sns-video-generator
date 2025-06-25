import { NextRequest, NextResponse } from 'next/server'
import { createStorageService } from '../../../lib/supabase-storage'
import { VideoUploadResponse, APIError, ErrorCodes } from '../../../types/api'
import { ProgressManager } from '../../../lib/progress-manager'

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new APIError(
        ErrorCodes.UPLOAD_FAILED,
        'No file provided',
        400
      )
    }

    // Validate file
    const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      throw new APIError(
        ErrorCodes.INVALID_FILE_TYPE,
        `Invalid file type. Allowed: ${validTypes.join(', ')}`,
        400
      )
    }

    // Check file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      throw new APIError(
        ErrorCodes.FILE_TOO_LARGE,
        `File too large. Maximum size: ${maxSize / (1024 * 1024 * 1024)}GB`,
        400
      )
    }

    // TODO: Get real user ID from session
    const userId = 'test-user-123'
    
    // Create storage service
    const storageService = createStorageService(userId)
    
    // Generate video ID first
    const videoId = crypto.randomUUID()
    
    // Start upload with progress tracking
    const result = await storageService.uploadVideo(file, {
      videoId, // Pass the pre-generated ID
      onProgress: async (progress) => {
        // Send progress via Supabase instead of EventEmitter
        await ProgressManager.sendProgress({
          videoId,
          type: 'upload',
          progress,
          message: `Uploading... ${progress}%`
        })
      }
    })

    if (!result.success) {
      throw new APIError(
        ErrorCodes.UPLOAD_FAILED,
        result.error || 'Upload failed',
        500
      )
    }

    // Send completion event
    await ProgressManager.sendProgress({
      videoId: result.videoId!,
      type: 'complete',
      progress: 100,
      message: 'Upload complete!'
    })

    // Return success response
    const response: VideoUploadResponse = {
      videoId: result.videoId!,
      status: 'ready_for_analysis',
      progress: 100,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      metadata: result.metadata
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Upload error:', error)
    
    // Log detailed error for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name
      })
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: ErrorCodes.SERVER_ERROR,
        details: process.env.NODE_ENV !== 'production' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    )
  }
}