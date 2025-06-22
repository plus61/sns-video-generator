import { supabaseAdmin } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Client-side supabase for authenticated uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

interface VideoUploadResult {
  success: boolean
  videoId?: string
  publicUrl?: string
  storagePath?: string
  error?: string
  metadata?: VideoMetadata
}

interface VideoMetadata {
  originalName: string
  fileSize: number
  fileType: string
  duration?: number
  width?: number
  height?: number
}

interface ChunkedUploadOptions {
  chunkSize?: number
  maxRetries?: number
  onProgress?: (progress: number) => void
}

export class SupabaseStorageService {
  private bucketName = 'videos'
  private maxFileSize = 2 * 1024 * 1024 * 1024 // 2GB
  private allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']

  constructor(private userId: string) {}

  /**
   * Upload video file to Supabase Storage with chunked upload support
   */
  async uploadVideo(
    file: File, 
    options: ChunkedUploadOptions = {}
  ): Promise<VideoUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique video ID and storage path
      const videoId = crypto.randomUUID()
      const fileExtension = file.name.split('.').pop() || 'mp4'
      const fileName = `${videoId}.${fileExtension}`
      const storagePath = `${this.userId}/${fileName}`

      // Create video record in database first
      const { error: dbError } = await supabaseAdmin
        .from('video_uploads')
        .insert({
          id: videoId,
          user_id: this.userId,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_source: 'file',
          status: 'uploading'
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      let uploadResult

      // Use chunked upload for large files (>100MB)
      if (file.size > 100 * 1024 * 1024) {
        uploadResult = await this.chunkedUpload(file, storagePath, options)
      } else {
        uploadResult = await this.standardUpload(file, storagePath)
      }

      if (!uploadResult.success) {
        // Update status to error
        await supabaseAdmin
          .from('video_uploads')
          .update({ 
            status: 'error',
            error_message: uploadResult.error 
          })
          .eq('id', videoId)

        return uploadResult
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath)

      // Extract video metadata
      const metadata = await this.extractVideoMetadata(file)

      // Generate thumbnail
      const thumbnailUrl = await this.generateAndUploadThumbnail(file, videoId)

      // Update database with success status
      const { error: updateError } = await supabaseAdmin
        .from('video_uploads')
        .update({
          storage_path: storagePath,
          public_url: publicUrl,
          duration: metadata.duration,
          thumbnail_url: thumbnailUrl,
          status: 'ready_for_analysis',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      if (updateError) {
        console.error('Failed to update video record:', updateError)
      }

      return {
        success: true,
        videoId,
        publicUrl,
        storagePath,
        metadata: {
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          ...metadata
        }
      }

    } catch (error) {
      console.error('Video upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Standard upload for smaller files
   */
  private async standardUpload(file: File, storagePath: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseClient.storage
      .from(this.bucketName)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Chunked upload for large files
   */
  private async chunkedUpload(
    file: File, 
    storagePath: string, 
    options: ChunkedUploadOptions
  ): Promise<{ success: boolean; error?: string }> {
    const chunkSize = options.chunkSize || 10 * 1024 * 1024 // 10MB chunks
    const maxRetries = options.maxRetries || 3
    const totalChunks = Math.ceil(file.size / chunkSize)

    try {
      // Initialize multipart upload
      const { error: initError } = await supabaseClient.storage
        .from(this.bucketName)
        .createSignedUploadUrl(storagePath)

      if (initError) {
        return { success: false, error: initError.message }
      }

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)

        let uploaded = false
        let retries = 0

        while (!uploaded && retries < maxRetries) {
          try {
            const { error: chunkError } = await supabaseClient.storage
              .from(this.bucketName)
              .upload(storagePath, chunk, {
                cacheControl: '3600',
                upsert: true
              })

            if (chunkError) {
              throw chunkError
            }

            uploaded = true

            // Report progress
            if (options.onProgress) {
              const progress = ((chunkIndex + 1) / totalChunks) * 100
              options.onProgress(Math.round(progress))
            }

          } catch (error) {
            retries++
            if (retries >= maxRetries) {
              return { 
                success: false, 
                error: `Chunk ${chunkIndex + 1} failed after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}` 
              }
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
          }
        }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chunked upload failed'
      }
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024 * 1024)}GB`
      }
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`
      }
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      return {
        valid: false,
        error: 'File name is required'
      }
    }

    return { valid: true }
  }

  /**
   * Extract video metadata using Web APIs (client-side only)
   */
  private async extractVideoMetadata(file: File): Promise<Partial<VideoMetadata>> {
    // Skip metadata extraction on server side
    if (typeof window === 'undefined') {
      return {}
    }

    return new Promise((resolve) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        resolve({
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        })
        URL.revokeObjectURL(url)
      }

      video.onerror = () => {
        resolve({})
        URL.revokeObjectURL(url)
      }

      video.src = url
    })
  }

  /**
   * Delete video from storage and database
   */
  async deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get video info
      const { data: video, error: fetchError } = await supabaseAdmin
        .from('video_uploads')
        .select('storage_path')
        .eq('id', videoId)
        .eq('user_id', this.userId)
        .single()

      if (fetchError || !video) {
        return { success: false, error: 'Video not found' }
      }

      // Delete from storage
      const { error: storageError } = await supabaseClient.storage
        .from(this.bucketName)
        .remove([video.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabaseAdmin
        .from('video_uploads')
        .delete()
        .eq('id', videoId)
        .eq('user_id', this.userId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  /**
   * Generate and upload video thumbnail
   */
  private async generateAndUploadThumbnail(file: File, videoId: string): Promise<string | null> {
    try {
      // Skip thumbnail generation on server side
      if (typeof window === 'undefined') {
        return null
      }

      return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const url = URL.createObjectURL(file)

        video.onloadeddata = async () => {
          // Seek to 10% of video duration for thumbnail
          video.currentTime = video.duration * 0.1
        }

        video.onseeked = async () => {
          // Set canvas dimensions
          canvas.width = 1280
          canvas.height = 720

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            URL.revokeObjectURL(url)
            resolve(null)
            return
          }

          // Draw video frame to canvas
          const aspectRatio = video.videoWidth / video.videoHeight
          let drawWidth = canvas.width
          let drawHeight = canvas.height

          if (aspectRatio > canvas.width / canvas.height) {
            drawHeight = canvas.width / aspectRatio
          } else {
            drawWidth = canvas.height * aspectRatio
          }

          const x = (canvas.width - drawWidth) / 2
          const y = (canvas.height - drawHeight) / 2

          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(video, x, y, drawWidth, drawHeight)

          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              URL.revokeObjectURL(url)
              resolve(null)
              return
            }

            // Upload thumbnail
            const thumbnailPath = `${this.userId}/${videoId}_thumbnail.jpg`
            const { error } = await supabaseClient.storage
              .from(this.bucketName)
              .upload(thumbnailPath, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
              })

            URL.revokeObjectURL(url)

            if (error) {
              console.error('Thumbnail upload error:', error)
              resolve(null)
              return
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
              .from(this.bucketName)
              .getPublicUrl(thumbnailPath)

            resolve(publicUrl)
          }, 'image/jpeg', 0.8)
        }

        video.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(null)
        }

        video.src = url
      })
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return null
    }
  }

  /**
   * Get video download URL
   */
  async getVideoDownloadUrl(videoId: string, expiresIn = 3600): Promise<{ url?: string; error?: string }> {
    try {
      const { data: video, error: fetchError } = await supabaseAdmin
        .from('video_uploads')
        .select('storage_path')
        .eq('id', videoId)
        .eq('user_id', this.userId)
        .single()

      if (fetchError || !video) {
        return { error: 'Video not found' }
      }

      const { data, error } = await supabaseClient.storage
        .from(this.bucketName)
        .createSignedUrl(video.storage_path, expiresIn)

      if (error) {
        return { error: error.message }
      }

      return { url: data.signedUrl }

    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to generate download URL' }
    }
  }
}

/**
 * Create storage service instance for authenticated user
 */
export function createStorageService(userId: string): SupabaseStorageService {
  return new SupabaseStorageService(userId)
}