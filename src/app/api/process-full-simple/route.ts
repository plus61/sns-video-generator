import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import ffmpeg from 'fluent-ffmpeg'

// FFmpegのパスを明示的に設定
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

const execAsync = promisify(exec)

// YouTube URL → ダウンロード → 分割までの完全な処理
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // YouTube URLの検証
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    
    if (!match) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoId = match[4]
    const timestamp = Date.now()
    const outputDir = path.join(os.tmpdir(), 'youtube-process', timestamp.toString())
    await fs.mkdir(outputDir, { recursive: true })
    
    const videoPath = path.join(outputDir, `${videoId}.mp4`)
    
    // Step 1: YouTube動画をダウンロード
    console.log('📥 Step 1: Downloading YouTube video...')
    try {
      const downloadCommand = `yt-dlp -f "best[ext=mp4]/best" -o "${videoPath}" --no-playlist "${url}"`
      const { stdout, stderr } = await execAsync(downloadCommand, {
        timeout: 120000 // 2分タイムアウト
      })
      
      console.log('Download completed')
      
      // ファイル確認
      const stats = await fs.stat(videoPath)
      console.log(`Video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      
    } catch (error) {
      console.error('Download failed:', error)
      return NextResponse.json({
        error: 'Failed to download YouTube video',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Step 2: 動画を固定時間で3分割
    console.log('✂️ Step 2: Splitting video into segments...')
    const segmentFiles: any[] = []
    
    // 固定時間での3分割（0-10秒、10-20秒、20-30秒）
    const segments = [
      { start: 0, duration: 10, name: 'segment_1_0-10s.mp4' },
      { start: 10, duration: 10, name: 'segment_2_10-20s.mp4' },
      { start: 20, duration: 10, name: 'segment_3_20-30s.mp4' }
    ]
    
    for (const segment of segments) {
      const segmentPath = path.join(outputDir, segment.name)
      
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(videoPath)
            .setStartTime(segment.start)
            .setDuration(segment.duration)
            .output(segmentPath)
            .outputOptions([
              '-c:v copy',
              '-c:a copy',
              '-avoid_negative_ts make_zero'
            ])
            .on('end', () => {
              console.log(`Created: ${segment.name}`)
              resolve()
            })
            .on('error', (err) => {
              console.error(`Failed to create ${segment.name}:`, err.message)
              reject(err)
            })
            .run()
        })
        
        const segmentStats = await fs.stat(segmentPath)
        segmentFiles.push({
          path: segmentPath,
          name: segment.name,
          size: segmentStats.size,
          sizeMB: (segmentStats.size / 1024 / 1024).toFixed(2),
          start: segment.start,
          duration: segment.duration
        })
        
      } catch (error) {
        console.error(`Segment creation error:`, error)
        // エラーでも続行
      }
    }
    
    // Step 3: 結果を返す
    console.log('✅ Step 3: Processing complete!')
    
    // 5分後にクリーンアップ
    setTimeout(async () => {
      try {
        await fs.rm(outputDir, { recursive: true, force: true })
        console.log(`Cleaned up: ${outputDir}`)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }, 5 * 60 * 1000)
    
    return NextResponse.json({
      success: true,
      message: 'YouTube video processed successfully',
      originalVideo: {
        path: videoPath,
        url: url,
        videoId: videoId
      },
      segments: segmentFiles,
      totalSegments: segmentFiles.length,
      outputDir
    })
    
  } catch (error) {
    console.error('Process full error:', error)
    return NextResponse.json(
      { 
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/process-full-simple',
    description: 'YouTube URL → Download → Split into 3 segments (complete pipeline)'
  })
}