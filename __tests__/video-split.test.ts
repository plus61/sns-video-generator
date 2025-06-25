import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import fs from 'fs/promises'
import path from 'path'
import { splitVideo } from '../src/lib/video-splitter-tests'

describe('FFmpeg Video Split - Real Implementation', () => {
  const testVideoPath = path.join(process.cwd(), 'test-assets', 'sample.mp4')
  const outputDir = path.join(process.cwd(), 'test-splits')
  
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(outputDir, { recursive: true })
  })
  
  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(outputDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })
  
  it('should split video into segments', async () => {
    const segments = [
      { start: 5, end: 15, id: 'segment1' },
      { start: 20, end: 30, id: 'segment2' }
    ]
    
    const results = await splitVideo(testVideoPath, segments, outputDir)
    
    // Assert all segments were created
    expect(results).toHaveLength(2)
    expect(results.every(r => r.success)).toBe(true)
    
    // Verify files exist
    for (const result of results) {
      const fileExists = await fs.access(result.outputPath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(true)
    }
  }, 60000) // 60 second timeout for video processing
  
  it('should maintain video quality', async () => {
    const segment = { start: 0, end: 10, id: 'quality-test' }
    const [result] = await splitVideo(testVideoPath, [segment], outputDir)
    
    expect(result.success).toBe(true)
    
    // Check file size is reasonable (not too compressed)
    const stats = await fs.stat(result.outputPath)
    expect(stats.size).toBeGreaterThan(1000) // At least 1KB
  })
  
  it('should handle invalid time ranges', async () => {
    const invalidSegment = { start: 1000, end: 2000, id: 'invalid' }
    
    await expect(
      splitVideo(testVideoPath, [invalidSegment], outputDir)
    ).rejects.toThrow()
  })
  
  it('should report progress during split', async () => {
    const progressUpdates: number[] = []
    const segment = { start: 0, end: 5, id: 'progress-test' }
    
    await splitVideo(testVideoPath, [segment], outputDir, {
      onProgress: (progress) => {
        progressUpdates.push(progress)
      }
    })
    
    expect(progressUpdates.length).toBeGreaterThan(0)
    expect(progressUpdates[progressUpdates.length - 1]).toBeGreaterThanOrEqual(90)
  })
})