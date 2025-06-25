import { NextRequest, NextResponse } from 'next/server'
import youtubedl from 'youtube-dl-exec'
import { promises as fs } from 'fs'
import path from 'path'

// Test endpoint without auth for Worker1 testing
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const { url } = await request.json()
    
    // URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url?.match(youtubeRegex)
    if (!match) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }
    
    const videoId = match[4]
    
    // 一時ディレクトリ作成
    const tempDir = path.join(process.cwd(), 'temp', 'test-videos')
    await fs.mkdir(tempDir, { recursive: true })
    
    tempFilePath = path.join(tempDir, `${videoId}_${Date.now()}.mp4`)
    
    console.log(`[Worker1 Test] Starting download: ${url}`)
    
    // ダウンロード実行（低画質、最大10秒のテスト）
    const result = await youtubedl(url, {
      output: tempFilePath,
      format: 'worst[ext=mp4]/worst',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    })
    
    console.log('[Worker1 Test] Download output:', result)
    
    // ファイル検証
    const stats = await fs.stat(tempFilePath)
    console.log(`[Worker1 Test] Download complete: ${stats.size} bytes`)
    
    return NextResponse.json({
      success: true,
      videoId,
      filePath: tempFilePath,
      fileSize: stats.size,
      message: 'Test download successful'
    })
    
  } catch (error: any) {
    console.error('[Worker1 Test] Error:', error)
    
    // クリーンアップ
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch (e) {}
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Download failed',
        details: error.stderr || error.stdout || 'No details available'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/test-download',
    description: 'Test YouTube downloader (no auth required)'
  })
}