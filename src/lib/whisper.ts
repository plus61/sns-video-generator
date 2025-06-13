import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface TranscriptionSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface TranscriptionResult {
  text: string
  segments?: TranscriptionSegment[]
  language?: string
  duration?: number
}

export class WhisperService {
  /**
   * Extract audio from video and transcribe using Whisper
   */
  async transcribeVideoFile(videoFilePath: string): Promise<TranscriptionResult> {
    try {
      // In a real implementation, you would:
      // 1. Extract audio from video using FFmpeg
      // 2. Convert to supported audio format (mp3, mp4, wav, etc.)
      // 3. Split large files into chunks (max 25MB for Whisper API)
      
      // For now, we'll assume the video file can be processed directly
      console.log('Processing video file:', videoFilePath)
      const transcription = await openai.audio.transcriptions.create({
        file: await this.createFileFromPath(),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      })

      return {
        text: transcription.text,
        segments: transcription.segments as TranscriptionSegment[],
        language: transcription.language,
        duration: transcription.duration
      }
    } catch (error) {
      console.error('Whisper transcription error:', error)
      throw new Error(`音声転写に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Transcribe audio from a Blob (for browser uploads)
   */
  async transcribeAudioBlob(audioBlob: Blob, filename: string): Promise<TranscriptionResult> {
    try {
      const file = new File([audioBlob], filename, { type: audioBlob.type })
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      })

      return {
        text: transcription.text,
        segments: transcription.segments as TranscriptionSegment[],
        language: transcription.language,
        duration: transcription.duration
      }
    } catch (error) {
      console.error('Whisper transcription error:', error)
      throw new Error(`音声転写に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract meaningful segments from transcription
   */
  extractContentSegments(transcription: TranscriptionResult): ContentSegment[] {
    if (!transcription.segments) {
      return []
    }

    const segments: ContentSegment[] = []
    const minSegmentLength = 10 // minimum 10 seconds
    const maxSegmentLength = 60 // maximum 60 seconds for short clips

    let currentSegment: ContentSegment | null = null

    for (const segment of transcription.segments) {
      const segmentLength = segment.end - segment.start

      // Skip very short segments or low confidence
      if (segmentLength < 3 || segment.no_speech_prob > 0.5) {
        continue
      }

      if (!currentSegment) {
        currentSegment = {
          start_time: Math.floor(segment.start),
          end_time: Math.floor(segment.end),
          text: segment.text.trim(),
          confidence: 1 - segment.no_speech_prob,
          content_type: this.classifyContent(segment.text)
        }
      } else {
        const combinedLength = segment.end - currentSegment.start_time
        
        if (combinedLength <= maxSegmentLength) {
          // Extend current segment
          currentSegment.end_time = Math.floor(segment.end)
          currentSegment.text += ' ' + segment.text.trim()
          currentSegment.confidence = (currentSegment.confidence + (1 - segment.no_speech_prob)) / 2
        } else {
          // Finalize current segment if it's long enough
          if (currentSegment.end_time - currentSegment.start_time >= minSegmentLength) {
            segments.push(currentSegment)
          }
          
          // Start new segment
          currentSegment = {
            start_time: Math.floor(segment.start),
            end_time: Math.floor(segment.end),
            text: segment.text.trim(),
            confidence: 1 - segment.no_speech_prob,
            content_type: this.classifyContent(segment.text)
          }
        }
      }
    }

    // Add final segment
    if (currentSegment && currentSegment.end_time - currentSegment.start_time >= minSegmentLength) {
      segments.push(currentSegment)
    }

    return segments
  }

  /**
   * Simple content classification based on keywords
   */
  private classifyContent(text: string): string {
    const lowerText = text.toLowerCase()

    // Educational keywords
    if (this.containsKeywords(lowerText, ['説明', '解説', '方法', 'とは', 'について', 'how to', 'tutorial', 'learn'])) {
      return 'education'
    }

    // Entertainment keywords
    if (this.containsKeywords(lowerText, ['面白い', '笑', 'funny', 'hilarious', '驚く', 'amazing'])) {
      return 'entertainment'
    }

    // Question/Quiz keywords
    if (this.containsKeywords(lowerText, ['質問', '問題', 'クイズ', 'question', '答え', 'answer'])) {
      return 'question'
    }

    // Tips/Advice keywords
    if (this.containsKeywords(lowerText, ['コツ', 'ヒント', 'アドバイス', 'tip', 'trick', '裏技'])) {
      return 'tips'
    }

    return 'general'
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  /**
   * Helper method to create File from path (server-side)
   */
  private async createFileFromPath(): Promise<File> {
    // This would be implemented server-side with actual file reading
    // For now, return a placeholder
    throw new Error('Server-side file processing not implemented')
  }
}

export interface ContentSegment {
  start_time: number
  end_time: number
  text: string
  confidence: number
  content_type: string
}

// Singleton instance
export const whisperService = new WhisperService()