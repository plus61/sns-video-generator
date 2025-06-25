import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

// YouTubeダウンロード用のシンプルなエンドポイント（認証不要）
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    
    if (!match) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoId = match[4]
    const outputDir = path.join(os.tmpdir(), 'youtube-downloads')
    await fs.mkdir(outputDir, { recursive: true })
    
    const outputPath = path.join(outputDir, `${videoId}.mp4`)
    
    console.log('Downloading YouTube video:', url)
    console.log('Output path:', outputPath)
    
    try {
      // yt-dlpを使用してダウンロード（シンプルな設定）
      const command = `yt-dlp -f "best[ext=mp4]/best" -o "${outputPath}" --no-playlist "${url}"`
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000 // 60秒タイムアウト
      })
      
      console.log('Download stdout:', stdout)
      if (stderr) console.log('Download stderr:', stderr)
      
      // ファイルの存在確認
      const stats = await fs.stat(outputPath)
      
      return NextResponse.json({
        success: true,
        videoPath: outputPath,
        videoId,
        size: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
        message: 'YouTube video downloaded successfully'
      })
      
    } catch (error) {
      console.error('yt-dlp error:', error)
      
      // yt-dlpがインストールされていない場合の対処
      if (error instanceof Error && error.message.includes('command not found')) {
        return NextResponse.json({
          error: 'yt-dlp is not installed',
          solution: 'Please install yt-dlp using: brew install yt-dlp (macOS) or pip install yt-dlp'
        }, { status: 501 })
      }
      
      return NextResponse.json({
        error: 'Failed to download YouTube video',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Upload YouTube simple error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/upload-youtube-simple',
    description: 'Simple YouTube download endpoint (no auth required)'
  })
}