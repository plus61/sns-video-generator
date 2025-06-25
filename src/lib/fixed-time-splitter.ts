import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// FFmpegのパスを環境に応じて設定
const ffmpegPath = process.env.FFMPEG_PATH || 
  (process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : '/usr/bin/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

interface FixedSegmentResult {
  index: number
  path: string
  start: number
  duration: number
  success: boolean
  error?: string
}

/**
 * 動画を固定時間（10秒間隔）で分割する
 * AI無しのシンプルな実装
 */
export async function splitVideoFixedTime(
  inputPath: string,
  outputDir: string,
  segmentDuration: number = 10 // デフォルト10秒
): Promise<FixedSegmentResult[]> {
  // 入力ファイルの存在確認
  try {
    await fs.access(inputPath)
  } catch {
    throw new Error('Input video file not found')
  }

  // 出力ディレクトリの作成
  await fs.mkdir(outputDir, { recursive: true })

  // 動画の長さを取得
  const duration = await getVideoDuration(inputPath)
  
  // セグメント数を計算（最大3つ）
  const segmentCount = Math.min(3, Math.ceil(duration / segmentDuration))
  const results: FixedSegmentResult[] = []

  // 各セグメントを切り出し
  for (let i = 0; i < segmentCount; i++) {
    const start = i * segmentDuration
    const outputPath = path.join(outputDir, `segment_${i + 1}.mp4`)
    
    try {
      await extractSegment(inputPath, outputPath, start, segmentDuration)
      results.push({
        index: i + 1,
        path: outputPath,
        start,
        duration: segmentDuration,
        success: true
      })
      console.log(`✅ Segment ${i + 1} created: ${start}s - ${start + segmentDuration}s`)
    } catch (error) {
      results.push({
        index: i + 1,
        path: outputPath,
        start,
        duration: segmentDuration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error(`❌ Failed to create segment ${i + 1}:`, error)
    }
  }

  return results
}

// 動画の長さを取得
function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata.format.duration || 30) // デフォルト30秒
    })
  })
}

// セグメントを切り出し
function extractSegment(
  inputPath: string,
  outputPath: string,
  start: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k'
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

// テスト用のシンプルな関数
export async function testFixedSplit(videoPath: string): Promise<{
  success: boolean
  segments: FixedSegmentResult[]
  error?: string
}> {
  try {
    const tempDir = path.join(os.tmpdir(), `split_test_${Date.now()}`)
    const segments = await splitVideoFixedTime(videoPath, tempDir)
    
    return {
      success: segments.every(s => s.success),
      segments
    }
  } catch (error) {
    return {
      success: false,
      segments: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}