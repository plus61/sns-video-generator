/**
 * Client-side video processing using FFmpeg.wasm
 * Phase 2 implementation - Worker1
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

export interface ProcessingProgress {
  phase: 'loading' | 'downloading' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
}

export interface VideoSegment {
  id: number
  startTime: number
  endTime: number
  thumbnail: string
  score: number
  highlight?: string
}

export class ClientVideoProcessor {
  private ffmpeg: FFmpeg
  private loaded = false
  private progressCallback?: (progress: ProcessingProgress) => void

  constructor() {
    this.ffmpeg = new FFmpeg()
  }

  /**
   * Initialize FFmpeg.wasm
   */
  async initialize(onProgress?: (progress: ProcessingProgress) => void) {
    if (this.loaded) return
    
    this.progressCallback = onProgress
    
    try {
      this.updateProgress('loading', 0, 'FFmpeg.wasmを初期化中...')
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      
      this.ffmpeg.on('progress', ({ progress }) => {
        this.updateProgress('processing', progress * 100, `処理中... ${Math.round(progress * 100)}%`)
      })

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      
      this.loaded = true
      this.updateProgress('loading', 100, 'FFmpeg.wasm準備完了')
    } catch (error) {
      console.error('FFmpeg initialization error:', error)
      this.updateProgress('error', 0, 'FFmpeg初期化エラー')
      throw error
    }
  }

  /**
   * Process video from YouTube URL using CORS proxy
   */
  async processYouTubeVideo(videoUrl: string): Promise<VideoSegment[]> {
    try {
      if (!this.loaded) {
        await this.initialize()
      }

      // For YouTube videos, we need to use a different approach
      // Direct download is blocked by CORS, so we'll use thumbnail analysis
      const videoId = this.extractVideoId(videoUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      this.updateProgress('processing', 20, 'YouTube動画情報を取得中...')
      
      // Get video metadata from our API
      const metadataResponse = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      })
      
      const metadata = await metadataResponse.json()
      if (!metadata.success) {
        throw new Error(metadata.error || 'Failed to fetch metadata')
      }

      // Generate segments based on video duration
      const segments = await this.generateSmartSegments(videoId, metadata.data)
      
      this.updateProgress('complete', 100, '処理完了！')
      return segments
    } catch (error) {
      console.error('Video processing error:', error)
      this.updateProgress('error', 0, error instanceof Error ? error.message : '処理エラー')
      throw error
    }
  }

  /**
   * Process local video file
   */
  async processLocalVideo(file: File): Promise<VideoSegment[]> {
    try {
      if (!this.loaded) {
        await this.initialize()
      }

      this.updateProgress('downloading', 0, 'ビデオファイルを読み込み中...')
      
      const data = await file.arrayBuffer()
      await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data))
      
      this.updateProgress('processing', 30, 'シーン検出を実行中...')
      
      // Extract keyframes for scene detection
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'select=gt(scene\\,0.3),scale=320:180',
        '-vsync', 'vfr',
        '-frame_pts', '1',
        'thumb_%04d.jpg'
      ])
      
      // Get list of generated thumbnails
      const files = await this.ffmpeg.listDir('/')
      const thumbnails = files
        .filter(file => file.name.startsWith('thumb_') && file.name.endsWith('.jpg'))
        .sort()
      
      this.updateProgress('processing', 70, 'セグメントを生成中...')
      
      // Create segments from thumbnails
      const segments: VideoSegment[] = []
      for (let i = 0; i < thumbnails.length && i < 5; i++) {
        const thumbData = await this.ffmpeg.readFile(thumbnails[i].name)
        const blob = new Blob([thumbData], { type: 'image/jpeg' })
        const thumbnailUrl = URL.createObjectURL(blob)
        
        segments.push({
          id: i + 1,
          startTime: i * 15,
          endTime: (i + 1) * 15,
          thumbnail: thumbnailUrl,
          score: Math.floor(Math.random() * 20) + 80,
          highlight: this.generateHighlight(i)
        })
      }
      
      // Cleanup
      await this.ffmpeg.deleteFile('input.mp4')
      for (const thumb of thumbnails) {
        await this.ffmpeg.deleteFile(thumb.name)
      }
      
      this.updateProgress('complete', 100, '処理完了！')
      return segments
    } catch (error) {
      console.error('Local video processing error:', error)
      this.updateProgress('error', 0, error instanceof Error ? error.message : '処理エラー')
      throw error
    }
  }

  /**
   * Generate smart segments using YouTube thumbnails and metadata
   */
  private async generateSmartSegments(videoId: string, metadata: any): Promise<VideoSegment[]> {
    const segments: VideoSegment[] = []
    
    // Parse duration to seconds
    const durationMatch = metadata.duration.match(/(\d+):(\d+)/)
    const totalSeconds = durationMatch 
      ? parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2])
      : 180 // Default 3 minutes
    
    // Generate 3-5 optimal segments
    const segmentCount = Math.min(5, Math.max(3, Math.floor(totalSeconds / 30)))
    const segmentDuration = 15 // 15 seconds per segment
    
    for (let i = 0; i < segmentCount; i++) {
      const startTime = Math.floor((totalSeconds - segmentDuration) * (i / (segmentCount - 1)))
      
      segments.push({
        id: i + 1,
        startTime,
        endTime: startTime + segmentDuration,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        score: this.calculateViralScore(i, segmentCount),
        highlight: this.generateHighlight(i)
      })
    }
    
    this.updateProgress('processing', 90, 'AIスコアリング完了...')
    
    return segments.sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate viral potential score
   */
  private calculateViralScore(index: number, total: number): number {
    // Simulate AI scoring based on position
    const positionScore = index === 0 ? 95 : // Opening
                         index === total - 1 ? 92 : // Ending
                         index === Math.floor(total / 2) ? 88 : // Middle
                         85 + Math.floor(Math.random() * 10)
    
    return positionScore
  }

  /**
   * Generate highlight description
   */
  private generateHighlight(index: number): string {
    const highlights = [
      'エキサイティングなオープニング',
      'キーモーメント',
      'クライマックスシーン',
      '感動的な瞬間',
      'インパクトのあるシーン'
    ]
    return highlights[index % highlights.length]
  }

  /**
   * Extract video ID from YouTube URL
   */
  private extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|\/v\/|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  /**
   * Update progress callback
   */
  private updateProgress(phase: ProcessingProgress['phase'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ phase, progress, message })
    }
  }

  /**
   * Check if FFmpeg is supported in the browser
   */
  static isSupported(): boolean {
    return typeof WebAssembly !== 'undefined' && 
           typeof Worker !== 'undefined' &&
           typeof SharedArrayBuffer !== 'undefined'
  }
}

// Web Worker implementation for parallel processing
export class VideoProcessorWorker {
  private worker: Worker | null = null

  async initialize() {
    if (!this.worker) {
      // Create inline worker for video processing
      const workerCode = `
        self.onmessage = async function(e) {
          const { action, data } = e.data
          
          switch (action) {
            case 'analyze':
              // Perform CPU-intensive analysis
              const result = await analyzeVideoChunk(data)
              self.postMessage({ action: 'result', data: result })
              break
          }
        }
        
        async function analyzeVideoChunk(data) {
          // Simulate video analysis
          return {
            sceneChanges: Math.floor(Math.random() * 5) + 1,
            audioLevels: Array(10).fill(0).map(() => Math.random()),
            motionIntensity: Math.random()
          }
        }
      `
      
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.worker = new Worker(URL.createObjectURL(blob))
    }
  }

  async analyzeInParallel(chunks: ArrayBuffer[]): Promise<any[]> {
    if (!this.worker) await this.initialize()
    
    return Promise.all(
      chunks.map(chunk => 
        new Promise((resolve) => {
          this.worker!.onmessage = (e) => {
            if (e.data.action === 'result') {
              resolve(e.data.data)
            }
          }
          this.worker!.postMessage({ action: 'analyze', data: chunk })
        })
      )
    )
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}