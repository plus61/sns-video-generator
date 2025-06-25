import { NextRequest, NextResponse } from 'next/server'
import youtubedl from 'youtube-dl-exec'
import { promises as fs } from 'fs'
import path from 'path'
import { EventEmitter } from 'events'

// Progress tracking
const progressEmitter = new EventEmitter()

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  const sessionId = `download-${Date.now()}`
  
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
    const tempDir = path.join(process.cwd(), 'temp', 'videos')
    await fs.mkdir(tempDir, { recursive: true })
    
    tempFilePath = path.join(tempDir, `${videoId}_${Date.now()}.mp4`)
    
    console.log(`[Worker1] Starting download: ${url}`)
    
    try {
      // メタデータ取得
      const metadata = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      })
      
      const title = metadata.title || 'Untitled'
      const duration = metadata.duration || 0
      
      // 進捗イベント送信
      progressEmitter.emit(sessionId, {
        stage: 'metadata',
        progress: 10,
        message: `Video found: ${title} (${duration}s)`
      })
      
      // ダウンロード実行（低画質、最大30秒）
      await youtubedl(url, {
        output: tempFilePath,
        format: 'worst[ext=mp4]/worst',
        quiet: false,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        downloadSections: '*0-30', // 最初の30秒のみ
        progress: true,
        progressTemplate: 'download %(progress._percent_str)s',
        newline: true
      })
      
      // ファイル検証
      const stats = await fs.stat(tempFilePath)
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }
      
      progressEmitter.emit(sessionId, {
        stage: 'complete',
        progress: 100,
        message: 'Download completed'
      })
      
      console.log(`[Worker1] Download success: ${stats.size} bytes`)
      
      return NextResponse.json({
        success: true,
        videoId,
        title,
        duration,
        filePath: tempFilePath,
        fileSize: stats.size,
        message: 'Video downloaded successfully'
      })
      
    } catch (downloadError: any) {
      console.error('[Worker1] Download error:', downloadError)
      
      // エラーハンドリング
      let errorMessage = 'Download failed'
      let statusCode = 500
      
      if (downloadError.message?.includes('Video unavailable')) {
        errorMessage = 'Video is unavailable or private'
        statusCode = 404
      } else if (downloadError.message?.includes('age-restricted')) {
        errorMessage = 'Video is age-restricted'
        statusCode = 403
      } else if (downloadError.message?.includes('geographic')) {
        errorMessage = 'Video is not available in your region'
        statusCode = 403
      } else if (downloadError.message?.includes('copyright')) {
        errorMessage = 'Video has copyright restrictions'
        statusCode = 403
      }
      
      progressEmitter.emit(sessionId, {
        stage: 'error',
        progress: 0,
        message: errorMessage
      })
      
      return NextResponse.json(
        { error: errorMessage, details: downloadError.message },
        { status: statusCode }
      )
    }
    
  } catch (error) {
    console.error('[Worker1] General error:', error)
    
    // クリーンアップ
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch (e) {}
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}

// 進捗状況を取得するSSEエンドポイント
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  
  if (!sessionId) {
    return NextResponse.json({
      status: 'ready',
      endpoint: '/api/download-video',
      description: 'YouTube video downloader with progress tracking',
      usage: {
        download: 'POST /api/download-video { url: "youtube_url" }',
        progress: 'GET /api/download-video?session=SESSION_ID (SSE)'
      }
    })
  }
  
  // Server-Sent Events for progress
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const sendProgress = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      
      progressEmitter.on(sessionId, sendProgress)
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        progressEmitter.removeListener(sessionId, sendProgress)
        controller.close()
      }, 300000)
    }
  })
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}