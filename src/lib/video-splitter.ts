import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'

// FFmpegのパスを設定
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

interface SegmentOptions {
  start: number
  duration: number
}

interface SplitOptions {
  outputDir: string
  segments: SegmentOptions[]
  parallel?: number
}

interface SegmentResult {
  index: number
  path: string
  start: number
  duration: number
  size?: number
}

/**
 * 動画を指定されたセグメントに分割する
 */
export async function splitVideoIntoSegments(
  inputPath: string,
  options: SplitOptions
): Promise<SegmentResult[]> {
  const { outputDir, segments, parallel = 3 } = options
  
  // 入力検証
  if (!segments || segments.length === 0) {
    throw new Error('No segments specified')
  }
  
  // 入力ファイルの存在確認
  try {
    await fs.access(inputPath)
  } catch {
    throw new Error('Input video file not found')
  }
  
  // 出力ディレクトリの作成
  await fs.mkdir(outputDir, { recursive: true })
  
  const results: SegmentResult[] = []
  
  // 並列処理の制御
  const chunks = []
  for (let i = 0; i < segments.length; i += parallel) {
    chunks.push(segments.slice(i, i + parallel))
  }
  
  // チャンクごとに処理
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (segment, chunkIndex) => {
      const globalIndex = chunks.indexOf(chunk) * parallel + chunkIndex
      const outputPath = path.join(outputDir, `segment_${globalIndex}.mp4`)
      
      await extractSegment(inputPath, outputPath, segment.start, segment.duration)
      
      // ファイルサイズを取得
      const stats = await fs.stat(outputPath)
      
      return {
        index: globalIndex,
        path: outputPath,
        start: segment.start,
        duration: segment.duration,
        size: stats.size
      }
    })
    
    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
  }
  
  // インデックス順にソート
  results.sort((a, b) => a.index - b.index)
  
  return results
}

/**
 * 単一のセグメントを抽出
 */
function extractSegment(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .outputOptions([
        '-c:v copy',  // ビデオコーデックをコピー（高速・品質維持）
        '-c:a copy',  // オーディオコーデックをコピー
        '-avoid_negative_ts make_zero',
        '-movflags +faststart'  // Web配信用に最適化
      ])
      .on('end', () => {
        resolve()
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
      .run()
  })
}

/**
 * 既存のAPIとの互換性のためのラッパー関数
 */
export async function splitVideo(
  videoPath: string,
  segments?: Array<{ start: number; end: number; score?: number }>
): Promise<SegmentResult[]> {
  if (!segments) {
    // セグメントが指定されていない場合はデフォルトの3分割
    segments = [
      { start: 0, end: 10 },
      { start: 10, end: 20 },
      { start: 20, end: 30 }
    ]
  }
  
  // end時刻をdurationに変換
  const segmentOptions = segments.map(seg => ({
    start: seg.start,
    duration: seg.end - seg.start
  }))
  
  const outputDir = path.join('/tmp', 'video-segments', Date.now().toString())
  
  return splitVideoIntoSegments(videoPath, {
    outputDir,
    segments: segmentOptions
  })
}