import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
  codec: string
  fileSize: number
  aspectRatio: string
  hasAudio: boolean
  audioCodec?: string
  audioBitrate?: number
  audioSampleRate?: number
}

interface ThumbnailOptions {
  count: number
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  timestamps?: number[] // seconds
}

interface ChunkOptions {
  segmentDuration: number // seconds
  overlap?: number // seconds overlap between chunks
  quality?: 'high' | 'medium' | 'low'
  targetSize?: number // MB per chunk
}

export class VideoProcessor {
  private ffmpeg: FFmpeg
  private isLoaded: boolean = false
  private processingQueue: Map<string, Promise<any>> = new Map()

  constructor() {
    this.ffmpeg = new FFmpeg()
  }

  /**
   * Initialize FFmpeg with optimal settings for video processing
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) return

    try {
      // Load FFmpeg with proper CORS and threading support
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      })

      this.isLoaded = true
      console.log('✅ FFmpeg initialized successfully')
    } catch (error) {
      console.error('❌ FFmpeg initialization failed:', error)
      throw new Error(`FFmpeg initialization failed: ${error}`)
    }
  }

  /**
   * Extract comprehensive video metadata
   */
  async extractMetadata(videoFile: File | ArrayBuffer): Promise<VideoMetadata> {
    await this.initialize()

    const inputName = 'input_video'
    const outputName = 'metadata.json'

    try {
      // Write input file
      if (videoFile instanceof File) {
        await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile))
      } else {
        await this.ffmpeg.writeFile(inputName, new Uint8Array(videoFile))
      }

      // Extract metadata using ffprobe-like command
      await this.ffmpeg.exec([
        '-i', inputName,
        '-f', 'null',
        '-'
      ])

      // Get detailed metadata
      await this.ffmpeg.exec([
        '-i', inputName,
        '-f', 'ffmetadata',
        '-show_entries', 'format=duration,size,bit_rate:stream=width,height,r_frame_rate,codec_name,codec_type,bit_rate,sample_rate',
        '-v', 'quiet',
        '-print_format', 'json',
        outputName
      ])

      const metadataFile = await this.ffmpeg.readFile(outputName)
      const metadataText = new TextDecoder().decode(metadataFile as Uint8Array)
      
      // Parse and transform metadata
      const rawMetadata = this.parseFFmpegOutput(metadataText)
      
      return this.transformMetadata(rawMetadata, videoFile)
    } catch (error) {
      console.error('Metadata extraction failed:', error)
      // Fallback to basic file-based metadata
      return this.extractBasicMetadata(videoFile)
    } finally {
      // Cleanup
      try {
        await this.ffmpeg.deleteFile(inputName)
        await this.ffmpeg.deleteFile(outputName)
      } catch {} // Ignore cleanup errors
    }
  }

  /**
   * Generate thumbnails at specified intervals
   */
  async generateThumbnails(
    videoFile: File | ArrayBuffer,
    options: ThumbnailOptions
  ): Promise<Blob[]> {
    await this.initialize()

    const inputName = 'input_video'
    const thumbnails: Blob[] = []

    try {
      // Write input file
      if (videoFile instanceof File) {
        await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile))
      } else {
        await this.ffmpeg.writeFile(inputName, new Uint8Array(videoFile))
      }

      // Get video duration first
      const metadata = await this.extractMetadata(videoFile)
      const duration = metadata.duration

      // Calculate thumbnail timestamps
      const timestamps = options.timestamps || 
        this.calculateThumbnailTimestamps(duration, options.count)

      // Generate thumbnails
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i]
        const outputName = `thumbnail_${i}.${options.format || 'jpeg'}`

        const command = [
          '-i', inputName,
          '-ss', timestamp.toString(),
          '-vframes', '1',
          '-f', 'image2',
          '-y' // Overwrite output files
        ]

        // Add quality and size options
        if (options.width && options.height) {
          command.push('-s', `${options.width}x${options.height}`)
        } else if (options.width) {
          command.push('-vf', `scale=${options.width}:-1`)
        } else if (options.height) {
          command.push('-vf', `scale=-1:${options.height}`)
        }

        if (options.quality && options.format === 'jpeg') {
          const qscale = Math.floor((100 - options.quality) / 3.125) + 2
          command.push('-q:v', qscale.toString())
        }

        command.push(outputName)

        await this.ffmpeg.exec(command)

        // Read generated thumbnail
        const thumbnailData = await this.ffmpeg.readFile(outputName)
        const blob = new Blob([thumbnailData], { 
          type: `image/${options.format || 'jpeg'}` 
        })
        thumbnails.push(blob)

        // Cleanup individual thumbnail
        await this.ffmpeg.deleteFile(outputName)
      }

      return thumbnails
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      throw new Error(`Thumbnail generation failed: ${error}`)
    } finally {
      // Cleanup input file
      try {
        await this.ffmpeg.deleteFile(inputName)
      } catch {} // Ignore cleanup errors
    }
  }

  /**
   * Process video into optimized chunks for efficient handling
   */
  async processVideoChunks(
    videoFile: File | ArrayBuffer,
    options: ChunkOptions
  ): Promise<{
    chunks: Blob[]
    metadata: VideoMetadata
    chunkInfo: Array<{
      index: number
      startTime: number
      duration: number
      size: number
      quality: string
    }>
  }> {
    await this.initialize()

    const inputName = 'input_video'
    const chunks: Blob[] = []
    const chunkInfo: Array<{
      index: number
      startTime: number
      duration: number
      size: number
      quality: string
    }> = []

    try {
      // Write input file
      if (videoFile instanceof File) {
        await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile))
      } else {
        await this.ffmpeg.writeFile(inputName, new Uint8Array(videoFile))
      }

      // Get video metadata
      const metadata = await this.extractMetadata(videoFile)
      const totalDuration = metadata.duration

      // Calculate chunk parameters
      const segmentDuration = options.segmentDuration
      const overlap = options.overlap || 0
      const numChunks = Math.ceil(totalDuration / segmentDuration)

      // Quality settings based on option
      const qualitySettings = this.getQualitySettings(options.quality || 'medium')

      // Process each chunk
      for (let i = 0; i < numChunks; i++) {
        const startTime = Math.max(0, i * segmentDuration - overlap)
        const endTime = Math.min(totalDuration, (i + 1) * segmentDuration + overlap)
        const chunkDuration = endTime - startTime

        if (chunkDuration <= 0) continue

        const outputName = `chunk_${i}.mp4`

        const command = [
          '-i', inputName,
          '-ss', startTime.toString(),
          '-t', chunkDuration.toString(),
          '-c:v', qualitySettings.videoCodec,
          '-c:a', qualitySettings.audioCodec,
          '-b:v', qualitySettings.videoBitrate,
          '-b:a', qualitySettings.audioBitrate,
          '-preset', qualitySettings.preset,
          '-movflags', '+faststart', // Optimize for streaming
          '-y',
          outputName
        ]

        // Add target size constraint if specified
        if (options.targetSize) {
          const targetBitrate = Math.floor((options.targetSize * 8 * 1024) / chunkDuration)
          command.splice(-2, 0, '-b:v', `${targetBitrate}k`)
        }

        console.log(`Processing chunk ${i + 1}/${numChunks}...`)
        await this.ffmpeg.exec(command)

        // Read processed chunk
        const chunkData = await this.ffmpeg.readFile(outputName)
        const chunkBlob = new Blob([chunkData], { type: 'video/mp4' })
        chunks.push(chunkBlob)

        // Record chunk info
        chunkInfo.push({
          index: i,
          startTime,
          duration: chunkDuration,
          size: chunkBlob.size,
          quality: options.quality || 'medium'
        })

        // Cleanup chunk file
        await this.ffmpeg.deleteFile(outputName)
      }

      console.log(`✅ Processed ${chunks.length} chunks successfully`)
      
      return {
        chunks,
        metadata,
        chunkInfo
      }
    } catch (error) {
      console.error('Chunk processing failed:', error)
      throw new Error(`Chunk processing failed: ${error}`)
    } finally {
      // Cleanup input file
      try {
        await this.ffmpeg.deleteFile(inputName)
      } catch {} // Ignore cleanup errors
    }
  }

  /**
   * Queue-based processing to handle multiple videos efficiently
   */
  async processWithQueue<T>(
    key: string,
    processor: () => Promise<T>
  ): Promise<T> {
    // Check if already processing
    if (this.processingQueue.has(key)) {
      return await this.processingQueue.get(key)!
    }

    // Add to queue
    const promise = processor()
    this.processingQueue.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      // Remove from queue
      this.processingQueue.delete(key)
    }
  }

  /**
   * Cleanup FFmpeg resources
   */
  async cleanup(): Promise<void> {
    if (this.isLoaded) {
      try {
        await this.ffmpeg.terminate()
        this.isLoaded = false
        console.log('✅ FFmpeg cleaned up successfully')
      } catch (error) {
        console.error('FFmpeg cleanup error:', error)
      }
    }
  }

  // Private helper methods

  private calculateThumbnailTimestamps(duration: number, count: number): number[] {
    const timestamps: number[] = []
    const interval = duration / (count + 1)
    
    for (let i = 1; i <= count; i++) {
      timestamps.push(Math.floor(interval * i))
    }
    
    return timestamps
  }

  private parseFFmpegOutput(output: string): any {
    try {
      return JSON.parse(output)
    } catch {
      // Fallback parsing for non-JSON output
      const lines = output.split('\n')
      const metadata: any = {}
      
      lines.forEach(line => {
        if (line.includes('Duration:')) {
          const match = line.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
          if (match) {
            const hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            const seconds = parseFloat(match[3])
            metadata.duration = hours * 3600 + minutes * 60 + seconds
          }
        }
        
        if (line.includes('Video:')) {
          const sizeMatch = line.match(/(\d+)x(\d+)/)
          if (sizeMatch) {
            metadata.width = parseInt(sizeMatch[1])
            metadata.height = parseInt(sizeMatch[2])
          }
          
          const fpsMatch = line.match(/(\d+(?:\.\d+)?)\s*fps/)
          if (fpsMatch) {
            metadata.fps = parseFloat(fpsMatch[1])
          }
        }
      })
      
      return metadata
    }
  }

  private transformMetadata(rawMetadata: any, videoFile: File | ArrayBuffer): VideoMetadata {
    const fileSize = videoFile instanceof File ? videoFile.size : videoFile.byteLength
    
    return {
      duration: rawMetadata.duration || 0,
      width: rawMetadata.width || 0,
      height: rawMetadata.height || 0,
      fps: rawMetadata.fps || 30,
      bitrate: rawMetadata.bit_rate || 0,
      format: rawMetadata.format_name || 'unknown',
      codec: rawMetadata.codec_name || 'unknown',
      fileSize,
      aspectRatio: rawMetadata.width && rawMetadata.height 
        ? `${rawMetadata.width}:${rawMetadata.height}` 
        : '16:9',
      hasAudio: rawMetadata.streams?.some((s: any) => s.codec_type === 'audio') || false,
      audioCodec: rawMetadata.streams?.find((s: any) => s.codec_type === 'audio')?.codec_name,
      audioBitrate: rawMetadata.streams?.find((s: any) => s.codec_type === 'audio')?.bit_rate,
      audioSampleRate: rawMetadata.streams?.find((s: any) => s.codec_type === 'audio')?.sample_rate
    }
  }

  private extractBasicMetadata(videoFile: File | ArrayBuffer): VideoMetadata {
    const fileSize = videoFile instanceof File ? videoFile.size : videoFile.byteLength
    
    return {
      duration: 0,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: Math.floor(fileSize * 8 / 1000), // Rough estimate
      format: 'mp4',
      codec: 'h264',
      fileSize,
      aspectRatio: '16:9',
      hasAudio: true,
      audioCodec: 'aac'
    }
  }

  private getQualitySettings(quality: 'high' | 'medium' | 'low') {
    const settings = {
      high: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '2M',
        audioBitrate: '128k',
        preset: 'medium'
      },
      medium: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '1M',
        audioBitrate: '96k',
        preset: 'fast'
      },
      low: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '500k',
        audioBitrate: '64k',
        preset: 'veryfast'
      }
    }
    
    return settings[quality]
  }
}

// Singleton instance for efficient memory usage
let videoProcessor: VideoProcessor | null = null

export const getVideoProcessor = (): VideoProcessor => {
  if (!videoProcessor) {
    videoProcessor = new VideoProcessor()
  }
  return videoProcessor
}

// Utility functions for common operations
export const extractVideoMetadata = async (videoFile: File | ArrayBuffer): Promise<VideoMetadata> => {
  const processor = getVideoProcessor()
  return processor.extractMetadata(videoFile)
}

export const generateVideoThumbnails = async (
  videoFile: File | ArrayBuffer,
  options: ThumbnailOptions
): Promise<Blob[]> => {
  const processor = getVideoProcessor()
  return processor.generateThumbnails(videoFile, options)
}

export const processVideoIntoChunks = async (
  videoFile: File | ArrayBuffer,
  options: ChunkOptions
) => {
  const processor = getVideoProcessor()
  return processor.processVideoChunks(videoFile, options)
}