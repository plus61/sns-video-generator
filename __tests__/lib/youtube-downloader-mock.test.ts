import { YouTubeDownloader, YouTubeDownloadError, DownloadErrorType } from '@/lib/youtube-downloader-mock'
import { supabaseAdmin } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('fs/promises')
jest.mock('@/lib/youtube-api-service')

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>
const mockFs = require('fs/promises')

describe('YouTubeDownloader Mock', () => {
  let downloader: YouTubeDownloader

  beforeEach(() => {
    jest.clearAllMocks()
    downloader = new YouTubeDownloader()

    // Setup default mocks
    mockSupabaseAdmin.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })

    mockFs.access = jest.fn().mockResolvedValue(undefined)
    mockFs.mkdir = jest.fn().mockResolvedValue(undefined)
    mockFs.writeFile = jest.fn().mockResolvedValue(undefined)
    mockFs.stat = jest.fn().mockResolvedValue({ size: 1024 })
    mockFs.unlink = jest.fn().mockResolvedValue(undefined)
  })

  describe('初期化', () => {
    test('正しく初期化される', () => {
      expect(downloader).toBeInstanceOf(YouTubeDownloader)
    })

    test('環境変数からテンポラリディレクトリを設定', () => {
      process.env.TEMP_DIR = '/custom/temp'
      const customDownloader = new YouTubeDownloader()
      expect(customDownloader).toBeInstanceOf(YouTubeDownloader)
      delete process.env.TEMP_DIR
    })
  })

  describe('エラータイプ', () => {
    test('YouTubeDownloadErrorが正しく作成される', () => {
      const error = new YouTubeDownloadError(
        DownloadErrorType.PRIVATE_VIDEO,
        new Error('Original error'),
        'Custom message'
      )

      expect(error.name).toBe('YouTubeDownloadError')
      expect(error.message).toBe('Custom message')
      expect(error.errorType).toBe(DownloadErrorType.PRIVATE_VIDEO)
      expect(error.originalError).toBeInstanceOf(Error)
    })

    test('デフォルトメッセージが使用される', () => {
      const error = new YouTubeDownloadError(DownloadErrorType.NETWORK_ERROR)

      expect(error.message).toBe('YouTube download failed: NETWORK_ERROR')
    })

    test('すべてのエラータイプが定義されている', () => {
      expect(DownloadErrorType.PRIVATE_VIDEO).toBe('PRIVATE_VIDEO')
      expect(DownloadErrorType.VIDEO_UNAVAILABLE).toBe('VIDEO_UNAVAILABLE')
      expect(DownloadErrorType.GEOBLOCKED).toBe('GEOBLOCKED')
      expect(DownloadErrorType.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE')
      expect(DownloadErrorType.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED')
      expect(DownloadErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(DownloadErrorType.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
    })
  })

  describe('動画処理', () => {
    test('YouTube動画を正常に処理', async () => {
      const videoId = 'test-video-123'
      const youtubeUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const result = await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(result.success).toBe(true)
      expect(result.publicUrl).toContain(videoId)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.title).toBeTruthy()
    })

    test('ステータス更新が正しく実行される', async () => {
      const videoId = 'test-video-123'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        update: mockUpdate
      })

      await downloader.processYouTubeVideo(videoId, youtubeUrl)

      // processing状態への更新
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' })
      
      // 完了状態への更新
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready_for_analysis'
        })
      )
    })

    test('メタデータが正しく生成される', async () => {
      const videoId = 'test-video-123'
      const youtubeUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const result = await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(result.metadata).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          duration: expect.any(Number),
          description: expect.any(String),
          thumbnail: expect.any(String),
          fileSize: expect.any(Number),
          format: 'mp4',
          width: expect.any(Number),
          height: expect.any(Number),
          uploader: expect.any(String),
          viewCount: expect.any(Number),
          likeCount: expect.any(Number)
        })
      )
    })
  })

  describe('ファイル操作', () => {
    test('テンポラリディレクトリが作成される', async () => {
      // ディレクトリが存在しない場合のモック
      mockFs.access = jest.fn().mockRejectedValue(new Error('ENOENT'))

      await downloader.ensureTempDir()

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      )
    })

    test('モックビデオファイルが作成される', async () => {
      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`${videoId}.mp4`),
        expect.any(String),
        'utf-8'
      )
    })

    test('一時ファイルがクリーンアップされる', async () => {
      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(mockFs.unlink).toHaveBeenCalled()
    })
  })

  describe('エラーハンドリング', () => {
    test('データベースエラーをハンドリング', async () => {
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Database error' }
          })
        })
      })

      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      // エラーがあってもプロセスが継続することを確認
      await expect(
        downloader.processYouTubeVideo(videoId, youtubeUrl)
      ).resolves.toBeDefined()
    })

    test('ファイルシステムエラーをハンドリング', async () => {
      mockFs.writeFile = jest.fn().mockRejectedValue(new Error('Disk full'))

      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      await expect(
        downloader.processYouTubeVideo(videoId, youtubeUrl)
      ).rejects.toThrow()
    })

    test('処理エラー時にステータスが更新される', async () => {
      mockFs.writeFile = jest.fn().mockRejectedValue(new Error('Test error'))

      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      try {
        await downloader.processYouTubeVideo(videoId, youtubeUrl)
      } catch (error) {
        // エラーは期待される
      }

      const mockUpdate = mockSupabaseAdmin.from('video_uploads').update as jest.Mock
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error_message: expect.any(String)
        })
      )
    })
  })

  describe('動画メタデータ生成', () => {
    test('動画IDに基づく決定的なメタデータ生成', () => {
      const url1 = 'https://youtube.com/watch?v=sameVideoId'
      const url2 = 'https://youtube.com/watch?v=sameVideoId'

      // 同じ動画IDからは同じメタデータが生成される
      const metadata1 = (downloader as any).generateFallbackMetadata(url1)
      const metadata2 = (downloader as any).generateFallbackMetadata(url2)

      expect(metadata1).toEqual(metadata2)
    })

    test('異なる動画IDから異なるメタデータが生成される', () => {
      const url1 = 'https://youtube.com/watch?v=videoId001'
      const url2 = 'https://youtube.com/watch?v=videoId002'

      const metadata1 = (downloader as any).generateFallbackMetadata(url1)
      const metadata2 = (downloader as any).generateFallbackMetadata(url2)

      // タイトルまたは再生回数が異なることを確認
      expect(
        metadata1.title !== metadata2.title ||
        metadata1.viewCount !== metadata2.viewCount
      ).toBe(true)
    })

    test('YouTube動画IDが正しく抽出される', () => {
      const testCases = [
        {
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/abc123XYZ_-',
          expected: 'abc123XYZ_-'
        },
        {
          url: 'invalid-url',
          expected: 'mock_video_id'
        }
      ]

      testCases.forEach(testCase => {
        const result = (downloader as any).extractVideoIdFromUrl(testCase.url)
        expect(result).toBe(testCase.expected)
      })
    })
  })

  describe('Supabase統合', () => {
    test('動画メタデータがSupabaseに正しく保存される', async () => {
      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        update: mockUpdate
      })

      await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          original_filename: expect.any(String),
          file_size: expect.any(Number),
          duration: expect.any(Number),
          storage_path: expect.stringContaining(videoId),
          public_url: expect.stringContaining(videoId),
          status: 'ready_for_analysis',
          metadata: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            format: 'mp4'
          })
        })
      )
    })

    test('アップロード成功時にpublicURLが返される', async () => {
      const videoId = 'test-video'
      const youtubeUrl = 'https://youtube.com/watch?v=test'

      const result = await downloader.processYouTubeVideo(videoId, youtubeUrl)

      expect(result.publicUrl).toContain(videoId)
      expect(result.publicUrl).toContain('.mp4')
    })
  })

  describe('パフォーマンス', () => {
    test('処理時間が適切な範囲内', async () => {
      const startTime = Date.now()
      
      const videoId = 'perf-test'
      const youtubeUrl = 'https://youtube.com/watch?v=perftest'

      await downloader.processYouTubeVideo(videoId, youtubeUrl)

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // モック処理は3秒以内で完了することを確認
      expect(processingTime).toBeLessThan(3000)
    })

    test('複数の動画を並列処理できる', async () => {
      const videoCount = 3
      const promises = Array.from({ length: videoCount }, (_, i) =>
        downloader.processYouTubeVideo(`video-${i}`, `https://youtube.com/watch?v=test${i}`)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(videoCount)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
})