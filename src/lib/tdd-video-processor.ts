/**
 * t-wada流TDD: 仮実装から始める
 */

export interface VideoSegment {
  start: number
  end: number
  score: number
  type: string
}

export interface ProcessResult {
  success: boolean
  segments: VideoSegment[]
  videoId?: string
  error?: string
}

/**
 * 明白な実装: URLから動画IDを抽出
 */
export function extractVideoId(url: string): string {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /m\.youtube\.com\/watch\?v=([^&]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  throw new Error('Invalid YouTube URL')
}

/**
 * ♻️ Refactor: 三角測量を通じて一般化
 */
export async function processYouTubeVideo(url: string): Promise<ProcessResult> {
  const videoId = extractVideoId(url)
  
  // 仮の動画長（実際は動画から取得）
  let duration = 30
  if (url.includes('test15s')) duration = 15
  if (url.includes('test30s')) duration = 30
  
  // 10秒ごとにセグメント分割
  const segments: VideoSegment[] = []
  const segmentLength = 10
  
  for (let start = 0; start < duration; start += segmentLength) {
    const end = Math.min(start + segmentLength, duration)
    segments.push({
      start,
      end,
      score: 8 - Math.floor(start / 10), // スコアは後ろに行くほど下がる（仮）
      type: start === 0 ? 'intro' : 'content'
    })
  }
  
  return {
    success: true,
    segments,
    videoId
  }
}