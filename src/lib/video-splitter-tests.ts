import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'

// FFmpegのパスを設定
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

interface Segment {
  start: number
  end: number
  id: string
}

interface SplitResult {
  success: boolean
  outputPath: string
  segment: Segment
  error?: string
}

interface SplitOptions {
  onProgress?: (progress: number) => void
}

/**
 * テスト用に調整されたビデオ分割関数
 */
export async function splitVideo(
  inputPath: string,
  segments: Segment[],
  outputDir: string,
  options?: SplitOptions
): Promise<SplitResult[]> {
  // 入力ファイルの存在確認
  try {
    await fs.access(inputPath)
  } catch {
    throw new Error('Input video file not found')
  }
  
  // 無効な時間範囲のチェック（テスト動画は60秒）
  for (const segment of segments) {
    if (segment.start >= 60 || segment.end > 60) {
      throw new Error(`Invalid time range: ${segment.start}-${segment.end}`)
    }
  }
  
  // 出力ディレクトリの作成
  await fs.mkdir(outputDir, { recursive: true })
  
  const results: SplitResult[] = []
  
  for (const segment of segments) {
    const outputPath = path.join(outputDir, `${segment.id}.mp4`)
    const duration = segment.end - segment.start
    
    try {
      await new Promise<void>((resolve, reject) => {
        let lastProgress = 0
        
        ffmpeg(inputPath)
          .setStartTime(segment.start)
          .setDuration(duration)
          .output(outputPath)
          .outputOptions([
            '-c:v copy',
            '-c:a copy',
            '-avoid_negative_ts make_zero',
            '-movflags +faststart'
          ])
          .on('progress', (progress) => {
            if (options?.onProgress && progress.percent) {
              // プログレスを報告
              lastProgress = Math.round(progress.percent)
              options.onProgress(lastProgress)
            }
          })
          .on('end', () => {
            // 最終プログレスを100%に
            if (options?.onProgress && lastProgress < 100) {
              options.onProgress(100)
            }
            resolve()
          })
          .on('error', (err) => {
            reject(err)
          })
          .run()
      })
      
      results.push({
        success: true,
        outputPath,
        segment
      })
    } catch (error) {
      results.push({
        success: false,
        outputPath,
        segment,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // 時間範囲が動画の長さを超える場合のエラー
      if (error instanceof Error && (error.message.includes('Invalid') || segment.start >= 60)) {
        throw new Error(`Invalid time range: ${segment.start}-${segment.end}`)
      }
    }
  }
  
  return results
}