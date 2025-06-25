import { describe, test, expect } from '@jest/globals'
import { extractVideoId, processYouTubeVideo } from '../src/lib/tdd-video-processor'

/**
 * t-wadaの三角測量
 * 複数のテストケースで仕様を明確化
 */

describe('三角測量 - 複数パターンでの動作確認', () => {
  describe('YouTube URL パターン', () => {
    test.each([
      ['https://www.youtube.com/watch?v=abc123', 'abc123'],
      ['https://youtu.be/abc123', 'abc123'],
      ['http://youtube.com/watch?v=abc123&t=10s', 'abc123'],
      ['https://m.youtube.com/watch?v=abc123', 'abc123'],
    ])('URLパターン %s から動画ID %s を抽出できる', async (url, expectedId) => {
      const videoId = extractVideoId(url)
      expect(videoId).toBe(expectedId)
    })

    test('無効なURLの場合はエラーを投げる', () => {
      expect(() => extractVideoId('https://example.com')).toThrow('Invalid YouTube URL')
    })
  })

  describe('セグメント分割パターン', () => {
    test('30秒の動画は3つのセグメントに分割される', async () => {
      const result = await processYouTubeVideo('https://youtube.com/watch?v=test30s')
      
      expect(result.segments).toHaveLength(3)
      expect(result.segments[0]).toMatchObject({ start: 0, end: 10 })
      expect(result.segments[1]).toMatchObject({ start: 10, end: 20 })
      expect(result.segments[2]).toMatchObject({ start: 20, end: 30 })
    })

    test('15秒の動画は2つのセグメントに分割される', async () => {
      const result = await processYouTubeVideo('https://youtube.com/watch?v=test15s')
      
      expect(result.segments).toHaveLength(2)
      expect(result.segments[0]).toMatchObject({ start: 0, end: 10 })
      expect(result.segments[1]).toMatchObject({ start: 10, end: 15 })
    })
  })
})