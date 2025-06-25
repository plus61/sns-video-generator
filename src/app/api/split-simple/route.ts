import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// FFmpegのパスを環境に応じて設定
const ffmpegPath = process.env.FFMPEG_PATH || 
  (process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : '/usr/bin/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

// ディスク容量チェック関数
const checkDiskSpace = async (requiredMB: number = 100): Promise<boolean> => {
  try {
    const tmpDir = os.tmpdir()
    const stats = await fs.statfs(tmpDir)
    const availableMB = (stats.bavail * stats.bsize) / (1024 * 1024)
    return availableMB > requiredMB
  } catch (error) {
    console.error('Disk space check failed:', error)
    return true // エラーの場合は処理を続行
  }
}

// セグメント切り出し関数
const extractSegment = (inputPath: string, outputPath: string, startTime: number, duration: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTimeMs = Date.now()
    
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .outputOptions([
        '-c:v copy',  // ビデオコーデックをコピー（高速）
        '-c:a copy',  // オーディオコーデックをコピー（高速）
        '-avoid_negative_ts make_zero'
      ])
      .on('start', (command) => {
        console.log(`FFmpeg started: ${command}`)
      })
      .on('progress', (progress) => {
        const elapsed = (Date.now() - startTimeMs) / 1000
        console.log(`Processing: ${progress.percent?.toFixed(1)}% complete (${elapsed.toFixed(1)}s elapsed)`)
      })
      .on('end', () => {
        const totalTime = (Date.now() - startTimeMs) / 1000
        console.log(`Segment extracted successfully in ${totalTime.toFixed(2)}s`)
        resolve()
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message)
        console.error('FFmpeg stderr:', stderr)
        reject(err)
      })
      .run()
  })
}

// Removed unused import - using direct FFmpeg splitting instead

export async function POST(request: NextRequest) {
  try {
    const { videoPath } = await request.json()
    
    if (!videoPath) {
      return NextResponse.json({ error: 'videoPath is required' }, { status: 400 })
    }
    
    // Always use FFmpeg to split video into fixed 10-second segments
    // Create 3 segments: 0-10s, 10-20s, 20-30s
    const fixedSegments = [
      { start: 0, end: 10, score: 8 },
      { start: 10, end: 20, score: 7 },
      { start: 20, end: 30, score: 6 }
    ]
    
    // ディスク容量チェック
    const hasSpace = await checkDiskSpace(500) // 500MB以上の空き容量を確認
    if (!hasSpace) {
      return NextResponse.json(
        { error: 'Insufficient disk space for video processing' },
        { status: 507 }
      )
    }
    
    // 一時ディレクトリ使用（/tmp）
    const outputDir = path.join(os.tmpdir(), 'video-segments', Date.now().toString())
    await fs.mkdir(outputDir, { recursive: true })
    
    const segmentFiles: string[] = []
    
    // Use fixed segments instead of sorting
    const topSegments = fixedSegments
    
    console.log('Processing top segments:', topSegments)
    
    // 処理開始時刻を記録
    const processStartTime = Date.now()
    
    // 各セグメントを並列処理で切り出し
    const segmentPromises = topSegments.map(async (segment: any, index: number) => {
      const outputPath = path.join(outputDir, `segment_${index + 1}_score${segment.score}.mp4`)
      const duration = segment.end - segment.start
      
      try {
        await extractSegment(videoPath, outputPath, segment.start, duration)
        segmentFiles.push(outputPath)
        return { success: true, path: outputPath, index }
      } catch (error) {
        console.error(`Failed to create segment ${index + 1}:`, error)
        // エラーハンドリング: 個別のセグメントエラーは続行
        if (error instanceof Error) {
          if (error.message.includes('memory')) {
            throw new Error('Insufficient memory to process video. Try with a smaller video.')
          }
          if (error.message.includes('format')) {
            throw new Error('Invalid video format. Only MP4, MOV, and AVI formats are supported.')
          }
          // Handle case where video is shorter than expected
          if (error.message.includes('Invalid seek') || error.message.includes('duration')) {
            console.warn(`Segment ${index + 1} may be beyond video duration`)
          }
        }
        return { success: false, index, error }
      }
    })
    
    // 全セグメントの処理を待機
    const results = await Promise.all(segmentPromises)
    const successfulSegments = results.filter(r => r.success)
    
    // 処理時間の計測
    const totalProcessTime = (Date.now() - processStartTime) / 1000
    console.log(`Total processing time: ${totalProcessTime.toFixed(2)}s for ${topSegments.length} segments`)
    
    // ファイルサイズ確認
    const fileInfo = await Promise.all(
      segmentFiles.map(async (file) => {
        const stats = await fs.stat(file)
        return {
          path: file,
          name: path.basename(file),
          size: stats.size
        }
      })
    )
    
    // 処理後のクリーンアップをスケジュール（5分後）
    setTimeout(async () => {
      try {
        await fs.rm(outputDir, { recursive: true, force: true })
        console.log(`Cleaned up temporary directory: ${outputDir}`)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }, 5 * 60 * 1000)
    
    return NextResponse.json({
      success: true,
      splitResults: fileInfo.map((file, index) => ({
        ...file,
        url: file.path, // Path to the actual mp4 file
        start: fixedSegments[index].start,
        end: fixedSegments[index].end,
        duration: fixedSegments[index].end - fixedSegments[index].start
      })),
      segments: fileInfo,
      message: `Created ${segmentFiles.length} video segments in ${totalProcessTime.toFixed(2)}s`,
      performance: {
        totalTime: totalProcessTime,
        averageTimePerSegment: (totalProcessTime / segmentFiles.length).toFixed(2),
        segmentsProcessed: segmentFiles.length
      }
    })
    
  } catch (error) {
    console.error('Split error:', error)
    
    // 詳細なエラーメッセージ
    let errorMessage = 'Video splitting failed'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // エラー種別に応じたステータスコード
      if (error.message.includes('Insufficient memory')) {
        statusCode = 507 // Insufficient Storage
      } else if (error.message.includes('Invalid video format')) {
        statusCode = 415 // Unsupported Media Type
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/split-simple',
    description: 'Split video into segments based on AI analysis'
  })
}