// AI分析パイプライン並列化 - 5分TDD実装

import { whisperTranscribe } from './whisper'
import { analyzeVideoFrames } from './gpt4v'
import { extractSegments } from './segment-extractor'

interface AnalysisResult {
  transcript: string
  visualAnalysis: any
  segments: any[]
  processingTime: number
}

export class ParallelAIAnalyzer {
  async analyzeVideo(videoPath: string): Promise<AnalysisResult> {
    const startTime = Date.now()
    
    // Whisper音声認識とGPT-4V画像解析を並列実行
    const [transcript, visualAnalysis] = await Promise.all([
      this.transcribeWithRetry(videoPath),
      this.analyzeVisualsWithChunking(videoPath)
    ])
    
    // 結果を統合してセグメント抽出
    const segments = await extractSegments(transcript, visualAnalysis)
    
    return {
      transcript,
      visualAnalysis,
      segments,
      processingTime: Date.now() - startTime
    }
  }

  private async transcribeWithRetry(videoPath: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        return await whisperTranscribe(videoPath)
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Transcription failed after retries')
  }

  private async analyzeVisualsWithChunking(videoPath: string): Promise<any> {
    // 動画を30秒チャンクに分割して並列解析
    const chunks = await this.splitVideoIntoChunks(videoPath, 30)
    
    const chunkAnalyses = await Promise.all(
      chunks.map(chunk => analyzeVideoFrames(chunk))
    )
    
    return this.mergeVisualAnalyses(chunkAnalyses)
  }

  private async splitVideoIntoChunks(videoPath: string, chunkDuration: number): Promise<string[]> {
    // シンプルな実装 - 実際のチャンク分割はvideo-processorを使用
    return [videoPath] // 簡略化
  }

  private mergeVisualAnalyses(analyses: any[]): any {
    // 複数の解析結果を統合
    return {
      combinedAnalysis: analyses,
      keyMoments: analyses.flatMap(a => a.keyMoments || []),
      overallTheme: analyses[0]?.theme || 'general'
    }
  }
}

// 簡単なテスト
export async function testParallelAnalysis() {
  const analyzer = new ParallelAIAnalyzer()
  const result = await analyzer.analyzeVideo('/test/video.mp4')
  console.log(`Analysis completed in ${result.processingTime}ms`)
  return result
}