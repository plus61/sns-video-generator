import { describe, test, expect } from '@jest/globals'
import { processYouTubeVideo } from '../src/lib/tdd-video-processor'

/**
 * t-wadaのWalking Skeleton（歩くガイコツ）
 * 最小限のE2E動作を確認するテスト
 */

describe('Walking Skeleton - 最小限のE2E動作', () => {
  test('YouTube URLを入力して処理結果を取得できる', async () => {
    // Arrange
    const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
    
    // Act
    const result = await processYouTubeVideo(testUrl)
    
    // Assert
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
    expect(result.segments).toBeInstanceOf(Array)
    expect(result.segments.length).toBeGreaterThan(0)
  })
})