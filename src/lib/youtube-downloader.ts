import youtubedl from 'youtube-dl-exec'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { supabaseAdmin } from './supabase'

interface VideoMetadata {
  title: string
  duration: number
  description?: string
  thumbnail?: string
  fileSize?: number
}

export class YouTubeDownloader {
  private tempDir: string

  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp/video-uploads'
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  async downloadVideo(videoId: string, youtubeUrl: string): Promise<{
    localPath: string
    metadata: VideoMetadata
  }> {
    await this.ensureTempDir()
    
    const outputPath = path.join(this.tempDir, `${videoId}.mp4`)
    
    try {
      console.log(`Starting download for ${youtubeUrl}`)
      
      // Get video info first
      const info = await youtubedl(youtubeUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
      })

      // Extract metadata
      const metadata: VideoMetadata = {
        title: info.title || 'Untitled Video',
        duration: Math.round(info.duration || 0),
        description: info.description,
        thumbnail: info.thumbnail,
        fileSize: info.filesize_approx || 0
      }

      // Download the video
      await youtubedl(youtubeUrl, {
        output: outputPath,
        format: 'best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        quiet: true,
        noCallHome: true,
        extractAudio: false,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
      })

      // Verify file exists
      const stats = await fs.stat(outputPath)
      metadata.fileSize = stats.size

      console.log(`Download completed: ${outputPath}`)
      
      return {
        localPath: outputPath,
        metadata
      }
    } catch (error) {
      console.error('YouTube download error:', error)
      throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadToSupabase(videoId: string, localPath: string, metadata: VideoMetadata) {
    try {
      // Read file
      const fileBuffer = await fs.readFile(localPath)
      
      // Upload to Supabase Storage
      const storagePath = `videos/${videoId}/${videoId}.mp4`
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(storagePath, fileBuffer, {
          contentType: 'video/mp4',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('videos')
        .getPublicUrl(storagePath)

      // Update database with metadata
      const { error: updateError } = await supabaseAdmin
        .from('video_uploads')
        .update({
          original_filename: metadata.title,
          file_size: metadata.fileSize,
          duration: metadata.duration,
          storage_path: storagePath,
          public_url: publicUrl,
          status: 'ready_for_analysis',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)

      if (updateError) {
        throw updateError
      }

      // Clean up temp file
      await this.cleanupTempFile(localPath)

      return {
        storagePath,
        publicUrl
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Failed to upload to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cleanupTempFile(filePath: string) {
    try {
      await fs.unlink(filePath)
      console.log(`Cleaned up temp file: ${filePath}`)
    } catch (error) {
      console.error(`Failed to cleanup temp file: ${filePath}`, error)
    }
  }

  async processYouTubeVideo(videoId: string, youtubeUrl: string) {
    try {
      // Update status to processing
      await supabaseAdmin
        .from('video_uploads')
        .update({ status: 'processing' })
        .eq('id', videoId)

      // Download video
      const { localPath, metadata } = await this.downloadVideo(videoId, youtubeUrl)

      // Upload to Supabase
      const { publicUrl } = await this.uploadToSupabase(videoId, localPath, metadata)

      console.log(`YouTube video processed successfully: ${videoId}`)
      return { success: true, publicUrl, metadata }

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

      throw error
    }
  }
}