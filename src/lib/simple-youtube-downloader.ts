/**
 * シンプルなYouTubeダウンローダー
 * 動作する60%を実現 - 複雑な機能は一切なし
 */

import youtubedl from 'youtube-dl-exec'
import path from 'path'
import fs from 'fs/promises'

export interface SimpleDownloadResult {
  success: boolean
  videoPath?: string
  error?: string
}

export async function downloadYouTubeVideo(url: string): Promise<SimpleDownloadResult> {
  try {
    // 出力ディレクトリ作成
    const outputDir = path.join(process.cwd(), 'tmp', 'downloads')
    await fs.mkdir(outputDir, { recursive: true })
    
    // タイムスタンプでユニークなファイル名
    const timestamp = Date.now()
    const outputPath = path.join(outputDir, `video-${timestamp}.mp4`)
    
    console.log(`📥 Downloading: ${url}`)
    console.log(`📁 Output: ${outputPath}`)
    
    // youtube-dl-exec 直接実行
    await youtubedl(url, {
      output: outputPath,
      format: 'best[ext=mp4]/best',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
    })
    
    // ファイル存在確認
    const stats = await fs.stat(outputPath)
    console.log(`✅ Downloaded: ${stats.size} bytes`)
    
    return {
      success: true,
      videoPath: outputPath
    }
  } catch (error) {
    console.error('❌ Download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }
  }
}