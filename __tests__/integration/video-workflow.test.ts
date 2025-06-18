import { createMocks } from 'node-mocks-http'
import { POST as uploadYouTube } from '@/app/api/upload-youtube/route'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { YouTubeDownloader } from '@/lib/youtube-downloader-mock'

// Mock all dependencies
jest.mock('next-auth')
jest.mock('@/lib/supabase')
jest.mock('@/lib/youtube-downloader-mock')
jest.mock('@/lib/youtube-api-service')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>

describe('統合テスト: 動画処理ワークフロー', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  }

  const mockVideoData = {
    id: 'video-123',
    title: 'Test Video',
    duration: 120,
    youtube_url: 'https://youtube.com/watch?v=test123',
    youtube_video_id: 'test123',
    status: 'completed',
    user_id: 'user-123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: mockUser
    } as any)

    // Mock database operations
    mockSupabaseAdmin.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: mockVideoData, 
            error: null 
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  })

  const createMockRequest = (body: unknown) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
      method: 'POST'
    } as any
  }

  describe('完全なワークフロー統合テスト', () => {
    test('YouTube動画アップロードから処理完了まで', async () => {
      // Phase 1: YouTube動画アップロード
      const uploadRequest = createMockRequest({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
      })

      const uploadResponse = await uploadYouTube(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(200)
      expect(uploadData.success).toBe(true)
      expect(uploadData.videoId).toBeDefined()
      expect(uploadData.message).toBe('YouTube video processing started')

      // データベースに正しく保存されることを確認
      const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
      expect(mockInsert).toHaveBeenCalledWith({
        id: expect.any(String),
        user_id: 'user-123',
        youtube_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_video_id: 'dQw4w9WgXcQ',
        upload_source: 'youtube',
        status: 'pending_download',
        created_at: expect.any(String)
      })
    })

    test('認証エラー時のワークフロー停止', async () => {
      // 認証なしでアクセス
      mockGetServerSession.mockResolvedValue(null)

      const uploadRequest = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      const uploadResponse = await uploadYouTube(uploadRequest)

      expect(uploadResponse.status).toBe(401)
      
      // データベース操作が実行されないことを確認
      expect(mockSupabaseAdmin.from).not.toHaveBeenCalled()
    })

    test('無効なURL時のエラーハンドリング', async () => {
      const invalidUrls = [
        'https://vimeo.com/123456',
        'invalid-url',
        'https://example.com/video',
        ''
      ]

      for (const url of invalidUrls) {
        const request = createMockRequest({ url })
        const response = await uploadYouTube(request)
        
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data.error).toBeTruthy()
      }
    })
  })

  describe('認証統合テスト', () => {
    test('有効なセッションでの認証フロー', async () => {
      const validSessions = [
        {
          user: { id: 'user-1', email: 'user1@example.com' }
        },
        {
          user: { id: 'user-2', email: 'user2@example.com' }
        }
      ]

      for (const session of validSessions) {
        mockGetServerSession.mockResolvedValue(session as any)

        const request = createMockRequest({
          url: 'https://youtube.com/watch?v=test123'
        })

        const response = await uploadYouTube(request)
        expect(response.status).toBe(200)

        const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: session.user.id
          })
        )
      }
    })

    test('不完全なセッションでの認証拒否', async () => {
      const invalidSessions = [
        null,
        {},
        { user: {} },
        { user: { email: 'test@example.com' } }, // IDなし
        { user: { id: '' } }, // 空のID
      ]

      for (const session of invalidSessions) {
        mockGetServerSession.mockResolvedValue(session as any)

        const request = createMockRequest({
          url: 'https://youtube.com/watch?v=test123'
        })

        const response = await uploadYouTube(request)
        expect(response.status).toBe(401)
      }
    })
  })

  describe('データベース統合テスト', () => {
    test('データ整合性の確保', async () => {
      const videoId = 'consistent-video-id'
      
      // UUIDを固定値にモック
      jest.doMock('uuid', () => ({
        v4: jest.fn(() => videoId)
      }))

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
      })

      await uploadYouTube(request)

      // 一貫したvideo IDでデータベース操作が行われることを確認
      const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: videoId,
          youtube_video_id: 'dQw4w9WgXcQ'
        })
      )
    })

    test('データベースエラーのハンドリング', async () => {
      // 外部キー制約エラー
      const mockInsert = jest.fn().mockResolvedValue({
        error: {
          code: '23503',
          message: 'Foreign key violation',
          details: 'Key (user_id)=(user-123) is not present in table "profiles"'
        }
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      const response = await uploadYouTube(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User authentication error. Please sign in again.')
    })

    test('ネットワークエラーのハンドリング', async () => {
      // データベース接続エラー
      mockSupabaseAdmin.from = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      const response = await uploadYouTube(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('パフォーマンステスト', () => {
    test('同時リクエストの処理', async () => {
      const concurrentRequests = 5
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        createMockRequest({
          url: `https://youtube.com/watch?v=test${i}`
        })
      )

      const responses = await Promise.all(
        requests.map(request => uploadYouTube(request))
      )

      // すべてのリクエストが成功することを確認
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // 各リクエストが独立して処理されることを確認
      const responseData = await Promise.all(
        responses.map(response => response.json())
      )

      const videoIds = responseData.map(data => data.videoId)
      const uniqueIds = new Set(videoIds)
      expect(uniqueIds.size).toBe(videoIds.length) // すべて異なるID
    })

    test('大量データの処理能力', async () => {
      const startTime = Date.now()
      
      const batchSize = 10
      const requests = Array.from({ length: batchSize }, (_, i) =>
        createMockRequest({
          url: `https://youtube.com/watch?v=batch${i}`
        })
      )

      await Promise.all(requests.map(request => uploadYouTube(request)))

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // 10リクエストを2秒以内で処理することを確認
      expect(processingTime).toBeLessThan(2000)

      // データベース操作が正しい回数実行されることを確認
      const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
      expect(mockInsert).toHaveBeenCalledTimes(batchSize)
    })
  })

  describe('セキュリティ統合テスト', () => {
    test('SQLインジェクション攻撃の防止', async () => {
      const maliciousInputs = [
        "'; DROP TABLE video_uploads; --",
        "' OR '1'='1",
        "1'; UPDATE video_uploads SET status='hacked'; --",
        "<script>alert('xss')</script>",
        "../../../etc/passwd"
      ]

      for (const maliciousInput of maliciousInputs) {
        const request = createMockRequest({
          url: maliciousInput
        })

        const response = await uploadYouTube(request)
        
        // 無効なURLとして拒否されることを確認
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data.error).toBeTruthy()
      }
    })

    test('ユーザー境界の検証', async () => {
      // 異なるユーザーでテスト
      const users = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' }
      ]

      for (const user of users) {
        mockGetServerSession.mockResolvedValue({ user } as any)

        const request = createMockRequest({
          url: 'https://youtube.com/watch?v=test123'
        })

        const response = await uploadYouTube(request)
        expect(response.status).toBe(200)

        // 各ユーザーのIDが正しく記録されることを確認
        const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: user.id
          })
        )
      }
    })

    test('レート制限の実装確認', async () => {
      // 短時間での大量リクエスト
      const rapidRequests = Array.from({ length: 100 }, () =>
        createMockRequest({
          url: 'https://youtube.com/watch?v=rate-limit-test'
        })
      )

      const responses = await Promise.all(
        rapidRequests.map(request => uploadYouTube(request))
      )

      // 全てのリクエストが処理されることを確認（現在レート制限未実装）
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })
    })
  })

  describe('エラー回復テスト', () => {
    test('部分的な障害からの回復', async () => {
      // 最初のリクエストでエラー
      let callCount = 0
      const mockInsert = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            error: { code: '500', message: 'Temporary failure' }
          })
        }
        return Promise.resolve({ error: null })
      })

      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      // 1回目: エラー
      const firstRequest = createMockRequest({
        url: 'https://youtube.com/watch?v=test1'
      })
      const firstResponse = await uploadYouTube(firstRequest)
      expect(firstResponse.status).toBe(500)

      // 2回目: 成功
      const secondRequest = createMockRequest({
        url: 'https://youtube.com/watch?v=test2'
      })
      const secondResponse = await uploadYouTube(secondRequest)
      expect(secondResponse.status).toBe(200)
    })

    test('カスケード障害の検出', async () => {
      // 複数のサービスが同時に失敗
      mockGetServerSession.mockRejectedValue(new Error('Auth service down'))
      mockSupabaseAdmin.from = jest.fn().mockImplementation(() => {
        throw new Error('Database service down')
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=cascade-failure'
      })

      const response = await uploadYouTube(request)
      
      // 適切にエラーハンドリングされることを確認
      expect(response.status).toBe(500)
    })
  })

  describe('データ検証統合テスト', () => {
    test('YouTube URL形式の厳密な検証', async () => {
      const testCases = [
        {
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          expected: { valid: true, videoId: 'dQw4w9WgXcQ' }
        },
        {
          url: 'https://youtu.be/abc123XYZ_-',
          expected: { valid: true, videoId: 'abc123XYZ_-' }
        },
        {
          url: 'https://youtube.com/watch?v=short',
          expected: { valid: false }
        },
        {
          url: 'https://youtube.com/watch?v=toolong123456',
          expected: { valid: false }
        }
      ]

      for (const testCase of testCases) {
        const request = createMockRequest({ url: testCase.url })
        const response = await uploadYouTube(request)

        if (testCase.expected.valid) {
          expect(response.status).toBe(200)
          
          if (testCase.expected.videoId) {
            const mockInsert = mockSupabaseAdmin.from('video_uploads').insert as jest.Mock
            expect(mockInsert).toHaveBeenCalledWith(
              expect.objectContaining({
                youtube_video_id: testCase.expected.videoId
              })
            )
          }
        } else {
          expect(response.status).toBe(400)
        }
      }
    })
  })
})