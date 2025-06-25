import { describe, it, expect, beforeAll } from '@jest/globals'
import { analyzeVideoWithAI } from '../src/lib/openai-analyzer'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

describe('OpenAI API Integration - Real Implementation', () => {
  const testAudioPath = path.join(process.cwd(), 'test-assets', 'sample-audio.mp3')
  const testTranscript = "This is a test video about machine learning and AI."
  
  beforeAll(() => {
    // Verify API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for these tests')
    }
  })
  
  it('should transcribe audio using Whisper API', async () => {
    const result = await analyzeVideoWithAI({
      audioPath: testAudioPath,
      apiKey: process.env.OPENAI_API_KEY!
    })
    
    expect(result.success).toBe(true)
    expect(result.transcript).toBeDefined()
    expect(result.transcript.length).toBeGreaterThan(0)
  }, 30000) // 30 second timeout for API call
  
  it('should analyze content using GPT-4', async () => {
    const result = await analyzeVideoWithAI({
      transcript: testTranscript,
      apiKey: process.env.OPENAI_API_KEY!
    })
    
    expect(result.success).toBe(true)
    expect(result.analysis).toBeDefined()
    expect(result.analysis.segments).toBeInstanceOf(Array)
    expect(result.analysis.segments.length).toBeGreaterThan(0)
    
    // Verify segment structure
    const segment = result.analysis.segments[0]
    expect(segment).toHaveProperty('start')
    expect(segment).toHaveProperty('end')
    expect(segment).toHaveProperty('score')
    expect(segment).toHaveProperty('reason')
  }, 30000)
  
  it('should identify viral potential segments', async () => {
    const educationalTranscript = `
      Welcome to this tutorial. First, let me show you something amazing.
      This trick will blow your mind! It's incredibly simple but powerful.
      Now, let's dive into the technical details of how this works.
      The algorithm processes data in real-time using advanced techniques.
    `
    
    const result = await analyzeVideoWithAI({
      transcript: educationalTranscript,
      apiKey: process.env.OPENAI_API_KEY!
    })
    
    expect(result.success).toBe(true)
    
    // Should identify the "amazing trick" part as high potential
    const highScoreSegments = result.analysis.segments.filter(s => s.score >= 8)
    expect(highScoreSegments.length).toBeGreaterThan(0)
  }, 30000)
  
  it('should handle API errors gracefully', async () => {
    const result = await analyzeVideoWithAI({
      transcript: testTranscript,
      apiKey: 'invalid-api-key'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error).toContain('API')
  })
  
  it('should respect rate limits', async () => {
    // Make multiple requests
    const promises = Array(3).fill(null).map(() => 
      analyzeVideoWithAI({
        transcript: testTranscript,
        apiKey: process.env.OPENAI_API_KEY!
      })
    )
    
    const results = await Promise.all(promises)
    
    // All should succeed despite concurrent requests
    expect(results.every(r => r.success)).toBe(true)
  }, 60000)
})