/**
 * シンプルな動画分割処理
 * FFmpegを直接実行して10秒ごとに分割
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export interface SimpleSplitResult {
  success: boolean
  segments?: string[]
  error?: string
}

export async function splitVideoIntoSegments(videoPath: string): Promise<SimpleSplitResult> {
  try {
    // 出力ディレクトリ作成
    const outputDir = path.join(path.dirname(videoPath), 'segments')
    await fs.mkdir(outputDir, { recursive: true })
    
    console.log(`✂️ Splitting video: ${videoPath}`)
    
    // 動画の長さを取得（FFmpeg直接パス指定）
    const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
    const ffprobePath = '/opt/homebrew/bin/ffprobe'
    
    const durationCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const { stdout: durationStr } = await execAsync(durationCmd)
    const duration = parseFloat(durationStr.trim())
    
    console.log(`⏱️ Video duration: ${duration} seconds`)
    
    const segments: string[] = []
    
    // Boss指示：固定時間での分割（0-10秒、10-20秒、20-30秒）
    const fixedSegments = [
      { start: 0, duration: 10, name: 'segment-1' },
      { start: 10, duration: 10, name: 'segment-2' },
      { start: 20, duration: 10, name: 'segment-3' }
    ]
    
    // 固定セグメントの作成
    for (const segment of fixedSegments) {
      // 動画の長さを超えるセグメントはスキップ
      if (segment.start >= duration) {
        console.log(`⏭️ Skipping ${segment.name} (beyond video duration)`)
        continue
      }
      
      const outputPath = path.join(outputDir, `${segment.name}.mp4`)
      
      // 残り時間が10秒未満の場合は調整
      const actualDuration = Math.min(segment.duration, duration - segment.start)
      
      // FFmpeg直接実行（パス指定）
      const ffmpegCmd = `"${ffmpegPath}" -i "${videoPath}" -ss ${segment.start} -t ${actualDuration} -c copy -avoid_negative_ts make_zero "${outputPath}" -y`
      
      console.log(`📹 Creating ${segment.name} (${segment.start}s - ${segment.start + actualDuration}s)...`)
      
      try {
        await execAsync(ffmpegCmd)
        
        // ファイル存在確認
        const stats = await fs.stat(outputPath)
        if (stats.size > 0) {
          segments.push(outputPath)
          console.log(`✅ ${segment.name} created: ${stats.size} bytes`)
        }
      } catch (segmentError) {
        console.error(`⚠️ Failed to create ${segment.name}:`, segmentError)
        // 個別セグメントのエラーは続行
      }
    }
    
    console.log(`✅ Created ${segments.length} segments`)
    
    return {
      success: segments.length > 0,
      segments,
      error: segments.length === 0 ? 'No segments could be created' : undefined
    }
  } catch (error) {
    console.error('❌ Split error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Split failed'
    }
  }
}