import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import fs from 'fs/promises'
import path from 'path'
import { downloadYouTubeVideo } from '../src/lib/youtube-downloader'

describe('YouTube Video Download - Real Implementation', () => {
  const testVideoUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw' // Me at the zoo - 19 seconds
  const outputDir = path.join(process.cwd(), 'test-downloads')
  
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
  
  it('should download a real YouTube video', async () => {
    const result = await downloadYouTubeVideo(testVideoUrl, outputDir)
    
    // Assert download success
    expect(result.success).toBe(true)
    expect(result.filePath).toBeDefined()
    expect(result.metadata).toBeDefined()
    
    // Verify file exists
    const fileExists = await fs.access(result.filePath!)
      .then(() => true)
      .catch(() => false)
    expect(fileExists).toBe(true)
    
    // Verify metadata
    expect(result.metadata?.title).toBe('Me at the zoo')
    expect(result.metadata?.duration).toBeGreaterThan(0)
    expect(result.metadata?.videoId).toBe('jNQXAC9IVRw')
  }, 30000) // 30 second timeout for download
  
  it('should handle invalid YouTube URLs', async () => {
    const invalidUrl = 'https://www.youtube.com/watch?v=invalid123'
    const result = await downloadYouTubeVideo(invalidUrl, outputDir)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.filePath).toBeUndefined()
  })
  
  it('should report download progress', async () => {
    const progressUpdates: number[] = []
    
    const result = await downloadYouTubeVideo(testVideoUrl, outputDir, {
      onProgress: (progress) => {
        progressUpdates.push(progress)
      }
    })
    
    expect(result.success).toBe(true)
    expect(progressUpdates.length).toBeGreaterThan(0)
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
  }, 30000)
})