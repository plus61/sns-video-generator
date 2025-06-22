import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, clipDuration = 10, maxClips = 3 } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Get video info from database
    const { data: video, error: dbError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('id', videoId)
      .single()

    if (dbError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (!video.public_url) {
      return NextResponse.json(
        { error: 'Video file not available' },
        { status: 400 }
      )
    }

    // Create temp directory for processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-split-'))
    
    try {
      // Download video to temp directory
      const inputPath = path.join(tempDir, `input_${videoId}.mp4`)
      const downloadCommand = `curl -L "${video.public_url}" -o "${inputPath}"`
      await execAsync(downloadCommand)

      // Get video duration
      const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
      const { stdout: durationStr } = await execAsync(durationCommand)
      const totalDuration = parseFloat(durationStr.trim())

      if (isNaN(totalDuration) || totalDuration === 0) {
        throw new Error('Could not determine video duration')
      }

      // Calculate clip positions
      const clips = []
      const clipCount = Math.min(maxClips, Math.floor(totalDuration / clipDuration))
      
      // Distribute clips evenly across the video
      const interval = totalDuration / (clipCount + 1)

      for (let i = 0; i < clipCount; i++) {
        const startTime = interval * (i + 1) - (clipDuration / 2)
        // Ensure clip doesn't go beyond video bounds
        const safeStartTime = Math.max(0, Math.min(startTime, totalDuration - clipDuration))
        
        const outputFilename = `${videoId}_clip_${i + 1}.mp4`
        const outputPath = path.join(tempDir, outputFilename)

        // Extract clip using ffmpeg
        const splitCommand = `ffmpeg -ss ${safeStartTime} -i "${inputPath}" -t ${clipDuration} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}" -y`
        await execAsync(splitCommand)

        // Upload clip to Supabase
        const clipBuffer = await fs.readFile(outputPath)
        const clipBlob = new Blob([clipBuffer], { type: 'video/mp4' })
        
        const storagePath = `${video.user_id}/clips/${outputFilename}`
        const { error: uploadError } = await supabaseAdmin.storage
          .from('videos')
          .upload(storagePath, clipBlob, {
            contentType: 'video/mp4',
            upsert: true
          })

        if (uploadError) {
          console.error(`Failed to upload clip ${i + 1}:`, uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('videos')
          .getPublicUrl(storagePath)

        clips.push({
          url: publicUrl,
          start: Math.round(safeStartTime),
          end: Math.round(safeStartTime + clipDuration),
          duration: clipDuration,
          index: i + 1
        })
      }

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true })

      return NextResponse.json({
        success: true,
        clips,
        sourceVideo: {
          id: videoId,
          duration: Math.round(totalDuration)
        }
      })

    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      throw error
    }

  } catch (error) {
    console.error('Video split error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to split video' },
      { status: 500 }
    )
  }
}