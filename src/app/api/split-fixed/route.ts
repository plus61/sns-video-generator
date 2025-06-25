import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// FFmpegのパスを明示的に設定
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

// 固定時間でのセグメント切り出し関数
const extractFixedSegment = (inputPath: string, outputPath: string, startTime: number, duration: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTimeMs = Date.now()
    
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-avoid_negative_ts make_zero'
      ])
      .on('end', () => {
        const totalTime = (Date.now() - startTimeMs) / 1000
        console.log(`Segment extracted in ${totalTime.toFixed(2)}s`)
        resolve()
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message)
        reject(err)
      })
      .run()
  })
}

export async function POST(request: NextRequest) {
  try {
    const { videoPath } = await request.json()
    
    if (!videoPath) {
      return NextResponse.json({ error: 'videoPath is required' }, { status: 400 })
    }
    
    // 動画ファイルの存在確認
    try {
      await fs.access(videoPath)
    } catch {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 })
    }
    
    // 出力ディレクトリ作成
    const outputDir = path.join(os.tmpdir(), 'fixed-segments', Date.now().toString())
    await fs.mkdir(outputDir, { recursive: true })
    
    const segmentFiles: string[] = []
    const processStartTime = Date.now()
    
    // 固定時間での3分割（0-10秒、10-20秒、20-30秒）
    const fixedSegments = [
      { start: 0, duration: 10, name: 'segment_1_0-10s.mp4' },
      { start: 10, duration: 10, name: 'segment_2_10-20s.mp4' },
      { start: 20, duration: 10, name: 'segment_3_20-30s.mp4' }
    ]
    
    console.log('Creating fixed time segments...')
    
    // 各セグメントを処理
    for (const segment of fixedSegments) {
      const outputPath = path.join(outputDir, segment.name)
      
      try {
        await extractFixedSegment(videoPath, outputPath, segment.start, segment.duration)
        
        // ファイルが作成されたか確認
        const stats = await fs.stat(outputPath)
        if (stats.size > 0) {
          segmentFiles.push(outputPath)
          console.log(`Created: ${segment.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
        }
      } catch (error) {
        console.error(`Failed to create ${segment.name}:`, error)
        // エラーでも続行
      }
    }
    
    const totalProcessTime = (Date.now() - processStartTime) / 1000
    
    // ファイル情報を取得
    const fileInfo = await Promise.all(
      segmentFiles.map(async (file) => {
        const stats = await fs.stat(file)
        return {
          path: file,
          name: path.basename(file),
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2)
        }
      })
    )
    
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
      segments: fileInfo,
      message: `Created ${segmentFiles.length} fixed segments in ${totalProcessTime.toFixed(2)}s`,
      outputDir,
      performance: {
        totalTime: totalProcessTime,
        segmentsCreated: segmentFiles.length
      }
    })
    
  } catch (error) {
    console.error('Fixed split error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to split video' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/split-fixed',
    description: 'Split video into fixed time segments (0-10s, 10-20s, 20-30s)'
  })
}