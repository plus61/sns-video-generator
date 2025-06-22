import { NextRequest, NextResponse } from 'next/server'
import { analyzeVideo } from '../../../lib/simple-ai-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl } = body
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    console.log('Analyzing video:', videoUrl)
    
    // Simple analysis
    const analysisResult = await analyzeVideo(videoUrl)
    
    // Return simplified response
    return NextResponse.json({
      success: true,
      data: {
        segments: analysisResult.segments,
        transcript: analysisResult.transcript,
        summary: analysisResult.summary
      }
    })
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}

// ヘルスチェック用のGETエンドポイント
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    service: 'Simple AI Analyzer',
    features: [
      'Whisper音声認識（日本語/英語）',
      '30秒単位セグメント分割',
      '重要度スコアリング（1-10）',
      'トップ3ハイライト自動選出',
      'サムネイル候補提案'
    ],
    performance: {
      targetSpeed: '5分動画を1分で分析',
      accuracy: '80%の精度で良いセグメント抽出'
    }
  })
}