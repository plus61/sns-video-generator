/**
 * OpenAI API統合テスト - TDD実装
 * President指令による実API統合
 */

import { transcribeAudio, analyzeContent, extractAudioFromVideo } from '../src/lib/openai-integration'
import path from 'path'
import fs from 'fs/promises'

describe('OpenAI API統合', () => {
  const testVideoPath = path.join(__dirname, 'fixtures', 'test-video.mp4')
  const testAudioPath = path.join(__dirname, 'fixtures', 'test-audio.mp3')
  
  beforeAll(async () => {
    // 環境変数チェック
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません')
    }
  })

  describe('Whisperで音声認識', () => {
    test('音声ファイルから転写テキストを取得', async () => {
      const audioPath = './test-audio.mp3'
      const transcription = await transcribeAudio(audioPath)
      
      expect(transcription.text).toBeDefined()
      expect(transcription.text.length).toBeGreaterThan(0)
      expect(transcription.language).toBe('en')
    }, 30000)
  })

  describe('GPT-4で内容分析', () => {
    test('転写テキストからコンテンツ分析を生成', async () => {
      const transcript = 'This is a test video about cats.'
      const analysis = await analyzeContent(transcript)
      
      expect(analysis.score).toBeGreaterThanOrEqual(1)
      expect(analysis.score).toBeLessThanOrEqual(10)
      expect(analysis.viralPotential).toBeDefined()
      expect(analysis.segments).toBeInstanceOf(Array)
    }, 30000)
  })
})