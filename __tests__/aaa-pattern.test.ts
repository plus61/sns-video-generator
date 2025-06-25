import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { processYouTubeVideo } from '../src/lib/tdd-video-processor'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * t-wadaのAAA（Arrange-Act-Assert）パターン
 * テストの構造を明確化
 */

describe('AAA パターン - テストの構造化', () => {
  let testDir: string

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    testDir = path.join('/tmp', `test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // テスト後のクリーンアップ
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // クリーンアップエラーは無視
    }
  })

  test('動画処理の完全なフローをAAAパターンで検証', async () => {
    // Arrange（準備）
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const expectedSegmentCount = 3

    // Act（実行）
    const result = await processYouTubeVideo(testUrl)

    // Assert（検証）
    expect(result.success).toBe(true)
    expect(result.segments).toHaveLength(expectedSegmentCount)
    expect(result.videoId).toBe('dQw4w9WgXcQ')
  })

  test('エラーケースもAAAパターンで構造化', async () => {
    // Arrange
    const invalidUrl = 'https://not-youtube.com/video'
    
    // Act & Assert
    await expect(processYouTubeVideo(invalidUrl)).rejects.toThrow('Invalid YouTube URL')
  })

  test('各セグメントの品質をAAAパターンで検証', async () => {
    // Arrange
    const testUrl = 'https://youtube.com/watch?v=test30s'
    const minScore = 5
    const maxScore = 10

    // Act
    const result = await processYouTubeVideo(testUrl)

    // Assert - 各セグメントの品質を検証
    result.segments.forEach((segment, index) => {
      expect(segment.score).toBeGreaterThanOrEqual(minScore)
      expect(segment.score).toBeLessThanOrEqual(maxScore)
      expect(segment.end).toBeGreaterThan(segment.start)
      expect(segment.type).toBeDefined()
    })
  })
})