/**
 * シンプルなFFmpeg処理
 * 実際のビデオ分割を実行
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

// FFmpegパス（環境に応じて設定）
const FFMPEG_PATH = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg'
const FFPROBE_PATH = process.env.FFPROBE_PATH || '/opt/homebrew/bin/ffprobe'

export interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
}

export interface SplitSegment {
  index: number
  path: string
  startTime: number
  endTime: number
  duration: number
}

/**
 * ビデオ情報を取得
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  try {
    const cmd = `${FFPROBE_PATH} -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of json "${videoPath}"`
    const { stdout } = await execAsync(cmd)
    const data = JSON.parse(stdout)
    const stream = data.streams[0]
    
    // duration取得（ストリームまたはフォーマットから）
    let duration = parseFloat(stream.duration || '0')
    if (!duration || isNaN(duration)) {
      const formatCmd = `${FFPROBE_PATH} -v error -show_entries format=duration -of json "${videoPath}"`
      const { stdout: formatOut } = await execAsync(formatCmd)
      const formatData = JSON.parse(formatOut)
      duration = parseFloat(formatData.format.duration || '0')
    }
    
    // FPS計算
    const [num, den] = stream.r_frame_rate.split('/')
    const fps = parseInt(num) / parseInt(den)
    
    return {
      duration,
      width: stream.width,
      height: stream.height,
      fps
    }
  } catch (error) {
    console.error('Error getting video info:', error)
    throw new Error('Failed to get video information')
  }
}

/**
 * ビデオを指定秒数ごとに分割
 */
export async function splitVideo(
  videoPath: string, 
  segmentDuration: number = 10,
  outputDir?: string
): Promise<SplitSegment[]> {
  try {
    // ビデオ情報取得
    const videoInfo = await getVideoInfo(videoPath)
    console.log('Video info:', videoInfo)
    
    if (!videoInfo.duration || videoInfo.duration <= 0) {
      throw new Error('Invalid video duration')
    }
    
    // 出力ディレクトリ
    const baseDir = outputDir || path.dirname(videoPath)
    const segmentsDir = path.join(baseDir, 'segments', path.basename(videoPath, '.mp4'))
    await fs.mkdir(segmentsDir, { recursive: true })
    
    const segments: SplitSegment[] = []
    const totalSegments = Math.ceil(videoInfo.duration / segmentDuration)
    
    console.log(`Splitting video into ${totalSegments} segments of ${segmentDuration}s each`)
    
    // 各セグメントを生成
    for (let i = 0; i < totalSegments; i++) {
      const startTime = i * segmentDuration
      const endTime = Math.min(startTime + segmentDuration, videoInfo.duration)
      const actualDuration = endTime - startTime
      
      const outputPath = path.join(segmentsDir, `segment_${String(i + 1).padStart(3, '0')}.mp4`)
      
      // FFmpegコマンド（高速な再エンコードなしコピー）
      const cmd = `${FFMPEG_PATH} -i "${videoPath}" -ss ${startTime} -t ${actualDuration} -c copy -avoid_negative_ts make_zero "${outputPath}" -y`
      
      console.log(`Creating segment ${i + 1}/${totalSegments}...`)
      await execAsync(cmd)
      
      // ファイル確認
      const stats = await fs.stat(outputPath)
      if (stats.size > 0) {
        segments.push({
          index: i + 1,
          path: outputPath,
          startTime,
          endTime,
          duration: actualDuration
        })
      }
    }
    
    console.log(`Successfully created ${segments.length} segments`)
    return segments
    
  } catch (error) {
    console.error('Error splitting video:', error)
    throw new Error(`Failed to split video: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * サムネイル生成
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timePosition: number = 1
): Promise<string> {
  try {
    const cmd = `${FFMPEG_PATH} -i "${videoPath}" -ss ${timePosition} -vframes 1 -vf "scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2" "${outputPath}" -y`
    
    await execAsync(cmd)
    
    // ファイル確認
    await fs.stat(outputPath)
    return outputPath
    
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    throw new Error('Failed to generate thumbnail')
  }
}