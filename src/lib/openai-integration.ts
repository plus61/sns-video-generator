/**
 * OpenAI API統合実装
 * TDD Green Phase - 実API呼び出し
 */

import OpenAI from 'openai'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// OpenAIクライアント初期化（遅延初期化）
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: false
    })
  }
  return openai
}

export interface TranscriptionResult {
  text: string
  language: string
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

export interface AnalysisResult {
  score: number
  viralPotential: number
  category: 'educational' | 'entertainment' | 'trivia' | 'highlight'
  segments: Array<{
    start: number
    end: number
    score: number
    reason: string
  }>
  summary?: string
}

/**
 * 動画から音声を抽出
 */
export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(path.extname(videoPath), '.mp3')
  const ffmpegPath = process.env.RAILWAY_ENVIRONMENT === 'production' 
    ? '/usr/bin/ffmpeg' 
    : '/opt/homebrew/bin/ffmpeg'
  
  const command = `"${ffmpegPath}" -i "${videoPath}" -vn -acodec mp3 -ab 128k "${audioPath}" -y`
  
  await execAsync(command)
  
  // ファイル存在確認
  await fs.access(audioPath)
  
  return audioPath
}

/**
 * Whisper APIで音声を転写
 */
export async function transcribeAudio(
  audioPath: string, 
  language: string = 'en'
): Promise<TranscriptionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }
  
  try {
    // ファイル読み込み
    const audioFile = await fs.readFile(audioPath)
    const file = new File([audioFile], path.basename(audioPath), { type: 'audio/mp3' })
    
    // Whisper API呼び出し
    const response = await getOpenAIClient().audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json'
    })
    
    return {
      text: response.text,
      language: response.language || language,
      duration: response.duration,
      segments: response.segments?.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text
      }))
    }
  } catch (error) {
    console.error('Whisper transcription error:', error)
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * GPT-4でコンテンツを分析
 */
export async function analyzeContent(
  transcript: string,
  language: string = 'en'
): Promise<AnalysisResult> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript cannot be empty')
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }
  
  try {
    const systemPrompt = language === 'ja' 
      ? 'あなたはSNSコンテンツのエキスパートです。動画の転写テキストを分析し、バイラル可能性の高いセグメントを特定してください。'
      : 'You are a social media content expert. Analyze video transcripts and identify segments with high viral potential.'
    
    const userPrompt = language === 'ja'
      ? `以下の転写テキストを分析し、JSON形式で結果を返してください：
      
転写テキスト: ${transcript}

必要な情報:
- score: コンテンツ価値（1-10）
- viralPotential: バイラル可能性（1-10）
- category: カテゴリー（educational/entertainment/trivia/highlight）
- segments: 推奨セグメント配列
  - start: 開始時間（秒）
  - end: 終了時間（秒）
  - score: セグメントスコア（1-10）
  - reason: 選定理由
- summary: 簡潔なサマリー`
      : `Analyze the following transcript and return results in JSON format:
      
Transcript: ${transcript}

Required fields:
- score: Content value (1-10)
- viralPotential: Viral potential (1-10)  
- category: Category (educational/entertainment/trivia/highlight)
- segments: Recommended segments array
  - start: Start time (seconds)
  - end: End time (seconds)
  - score: Segment score (1-10)
  - reason: Selection reason
- summary: Brief summary`
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    // デフォルト値の設定
    return {
      score: result.score || 5,
      viralPotential: result.viralPotential || 5,
      category: result.category || 'educational',
      segments: result.segments || [{
        start: 0,
        end: 10,
        score: 7,
        reason: 'Opening segment'
      }],
      summary: result.summary
    }
  } catch (error) {
    console.error('GPT-4 analysis error:', error)
    
    // レート制限エラーの特別処理
    if (error instanceof Error && error.message.includes('rate')) {
      throw new Error('API rate limit exceeded. Please try again later.')
    }
    
    throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * レート制限を考慮した分析実行
 */
export async function analyzeContentWithRetry(
  transcript: string,
  language: string = 'en',
  maxRetries: number = 3
): Promise<AnalysisResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeContent(transcript, language)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // 指数バックオフ
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Failed after maximum retries')
}