import { NextRequest, NextResponse } from 'next/server'
import youtubedl from 'youtube-dl-exec'
import ytdl from 'ytdl-core'
import { promises as fs } from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { splitVideoIntoSegments } from '@/lib/simple-video-splitter'
import { analyzeVideoWithAI, selectOptimalSegments } from '@/lib/simple-ai-analyzer'

// シンプルな処理用エンドポイント（認証不要）
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // YouTube URL検証
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    if (!match) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }
    
    const youtubeVideoId = match[4]
    const videoId = `video-${youtubeVideoId}-${Date.now()}`
    
    // /tmp ディレクトリを使用
    const tempDir = '/tmp'
    tempFilePath = path.join(tempDir, `${videoId}.mp4`)
    
    console.log('Downloading video with youtube-dl-exec...')
    console.log('URL:', url)
    console.log('Output path:', tempFilePath)
    
    // ダウンロード（youtube-dl-exec使用）
    try {
      console.log('Executing youtube-dl-exec with parameters...')
      await youtubedl(url, {
        output: tempFilePath,
        format: 'best[height<=480]/best', // 480p以下の最高品質
        quiet: false,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      })
      
      // ファイルが作成されたか確認
      const stats = await fs.stat(tempFilePath)
      console.log(`✅ Downloaded video: ${stats.size} bytes`)
      
      // ファイルサイズが0でないことを確認
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }
      
    } catch (downloadError) {
      console.error('youtube-dl-exec error details:', {
        command: 'youtube-dl-exec',
        error: downloadError,
        errorMessage: downloadError instanceof Error ? downloadError.message : 'Unknown error',
        errorStack: downloadError instanceof Error ? downloadError.stack : undefined,
        errorCode: (downloadError as any).code
      })
      console.log('Attempting ytdl-core fallback...')
      
      // ytdl-core フォールバック
      try {
        const info = await ytdl.getInfo(url)
        const format = ytdl.chooseFormat(info.formats, { quality: 'lowest' })
        
        await new Promise((resolve, reject) => {
          const stream = ytdl(url, { format })
          const writeStream = createWriteStream(tempFilePath)
          
          stream.pipe(writeStream)
          
          stream.on('error', reject)
          writeStream.on('error', reject)
          writeStream.on('finish', resolve)
        })
        
        const stats = await fs.stat(tempFilePath)
        console.log(`✅ Downloaded with ytdl-core: ${stats.size} bytes`)
        
        if (stats.size === 0) {
          throw new Error('Downloaded file is empty')
        }
      } catch (ytdlError) {
        console.error('ytdl-core also failed:', ytdlError)
        throw new Error(`Failed to download video with both methods: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`)
      }
    }
    
    console.log('Processing downloaded video...')
    
    // AI分析実行（OpenAI統合）
    let aiAnalysis = null
    let optimizedSegments = null
    
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 AI分析を実行中...')
      aiAnalysis = await analyzeVideoWithAI(tempFilePath)
      
      if (aiAnalysis.success && aiAnalysis.segments) {
        // 最適なセグメントを選定
        optimizedSegments = selectOptimalSegments(aiAnalysis.segments, 3)
        console.log(`✅ AI分析完了: ${optimizedSegments.length}個の最適セグメントを特定`)
      }
    }
    
    // 動画を分割（固定時間：0-10秒、10-20秒、20-30秒）
    const splitResult = await splitVideoIntoSegments(tempFilePath)
    
    if (!splitResult.success) {
      throw new Error(splitResult.error || 'Video splitting failed')
    }
    
    // セグメント情報を構築（AI分析結果があれば統合）
    const segments = splitResult.segments?.map((segmentPath, index) => {
      const aiSegment = optimizedSegments?.[index]
      
      return {
        start: index * 10,
        end: (index + 1) * 10,
        score: aiSegment?.score || (8 - index),
        type: aiSegment?.type || (index === 0 ? 'highlight' : index === 1 ? 'educational' : 'content'),
        path: segmentPath,
        reason: aiSegment?.reason,
        viralPotential: aiSegment?.viralPotential
      }
    }) || []
    
    const stats = await fs.stat(tempFilePath)

    return NextResponse.json({
      success: true,
      videoId,
      youtubeVideoId,
      videoPath: tempFilePath,
      fileSize: stats.size,
      segments,
      transcript: aiAnalysis?.transcription,
      summary: aiAnalysis?.summary || `Processed video into ${segments.length} segments (0-10s, 10-20s, 20-30s)`,
      message: `YouTube video downloaded and processed${aiAnalysis?.success ? ' with AI analysis' : ''}: ${youtubeVideoId}`,
      aiAnalysisEnabled: !!process.env.OPENAI_API_KEY
    })

  } catch (error) {
    console.error('Simple processing error:', error)
    
    // クリーンアップ
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
        console.log('Cleaned up temporary file:', tempFilePath)
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError)
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}