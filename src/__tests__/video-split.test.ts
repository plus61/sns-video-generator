import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { splitVideoIntoSegments } from '../lib/video-splitter'

describe('FFmpeg動画分割', () => {
  let testVideoPath: string
  let outputDir: string
  
  beforeEach(async () => {
    // テスト用の出力ディレクトリを作成
    outputDir = path.join(os.tmpdir(), 'test-video-segments', Date.now().toString())
    await fs.mkdir(outputDir, { recursive: true })
    
    // テスト動画のパス（既に作成済みのものを使用）
    testVideoPath = '/tmp/test-video.mp4'
  })
  
  afterEach(async () => {
    // テスト後のクリーンアップ
    try {
      await fs.rm(outputDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })
  
  test('動画ファイルから指定時間のセグメントを切り出し', async () => {
    const segments = await splitVideoIntoSegments(testVideoPath, {
      outputDir,
      segments: [
        { start: 0, duration: 1 },
        { start: 1, duration: 1 },
        { start: 2, duration: 1 }
      ]
    })
    
    // 3つのセグメントが生成されることを確認
    expect(segments).toHaveLength(3)
    
    // 各セグメントファイルが実際に存在することを確認
    for (const segment of segments) {
      const stats = await fs.stat(segment.path)
      expect(stats.isFile()).toBe(true)
      expect(stats.size).toBeGreaterThan(0)
    }
    
    // セグメントの情報が正しいことを確認
    segments.forEach((segment, index) => {
      expect(segment.index).toBe(index)
      expect(segment.start).toBe(index)
      expect(segment.duration).toBe(1)
      expect(segment.path).toMatch(/segment_\d+\.mp4$/)
    })
  })
  
  test('エラーハンドリング：存在しないファイル', async () => {
    const nonExistentPath = '/path/to/non-existent-video.mp4'
    
    await expect(splitVideoIntoSegments(nonExistentPath, {
      outputDir,
      segments: [{ start: 0, duration: 10 }]
    })).rejects.toThrow('Input video file not found')
  })
  
  test('エラーハンドリング：無効なセグメント指定', async () => {
    await expect(splitVideoIntoSegments(testVideoPath, {
      outputDir,
      segments: [] // 空のセグメント配列
    })).rejects.toThrow('No segments specified')
  })
  
  test('メモリ効率：大量セグメント処理', async () => {
    // 10個のセグメントを生成（各0.3秒）
    const manySegments = Array.from({ length: 10 }, (_, i) => ({
      start: i * 0.3,
      duration: 0.3
    }))
    
    const startMemory = process.memoryUsage().heapUsed
    
    const segments = await splitVideoIntoSegments(testVideoPath, {
      outputDir,
      segments: manySegments,
      parallel: 3 // 並列処理数を制限
    })
    
    const endMemory = process.memoryUsage().heapUsed
    const memoryIncrease = (endMemory - startMemory) / 1024 / 1024 // MB
    
    expect(segments).toHaveLength(10)
    expect(memoryIncrease).toBeLessThan(100) // 100MB以下の増加
  })
})