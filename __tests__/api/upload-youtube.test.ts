import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/upload-youtube/route'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/supabase')
jest.mock('@/lib/youtube-downloader-mock')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>

// Mock UUIDs for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}))

describe('/api/upload-youtube', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default Supabase mock
    mockSupabaseAdmin.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  })

  const createMockRequest = (body: unknown) => {
    const { req } = createMocks({ method: 'POST', body })
    
    // Mock NextRequest methods
    const mockRequest = {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
      method: 'POST'
    } as any

    return mockRequest
  }

  describe('認証テスト', () => {
    test('有効なトークンでアクセス可能', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)

      const request = createMockRequest({
        url: 'https://youtu.be/dQw4w9WgXcQ'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.videoId).toBe('mock-uuid-123')
    })

    test('認証なしでアクセス拒否', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest({
        url: 'https://youtu.be/test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('ユーザーIDなしでアクセス拒否', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any)

      const request = createMockRequest({
        url: 'https://youtu.be/test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('YouTube URL検証', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)
    })

    test('有効なYouTube URLを受け付ける', async () => {
      const validUrls = [
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'youtube.com/watch?v=dQw4w9WgXcQ',
        'www.youtube.com/watch?v=dQw4w9WgXcQ',
        'youtu.be/dQw4w9WgXcQ'
      ]

      for (const url of validUrls) {
        const request = createMockRequest({ url })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.videoId).toBeDefined()
      }
    })

    test('無効なURLを拒否する', async () => {
      const invalidUrls = [
        'invalid-url',
        'https://vimeo.com/123456',
        'https://google.com',
        '',
        null,
        undefined
      ]

      for (const url of invalidUrls) {
        const request = createMockRequest({ url })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBeTruthy()
      }
    })

    test('URLなしでエラー', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('YouTube URL is required')
    })
  })

  describe('データベース操作', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)
    })

    test('動画メタデータをデータベースに保存', async () => {
      // Arrange
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
      })

      // Act
      await POST(request)

      // Assert
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('video_uploads')
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'mock-uuid-123',
        user_id: 'user-123',
        youtube_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_video_id: 'dQw4w9WgXcQ',
        upload_source: 'youtube',
        status: 'pending_download',
        created_at: expect.any(String)
      })
    })

    test('外部キー制約エラーを適切に処理', async () => {
      // Arrange
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

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('User authentication error. Please sign in again.')
    })

    test('一般的なデータベースエラーを処理', async () => {
      // Arrange
      const mockInsert = jest.fn().mockResolvedValue({
        error: {
          code: '500',
          message: 'Database connection failed'
        }
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save video metadata')
    })
  })

  describe('バックグラウンド処理', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)
    })

    test('処理開始メッセージを返す', async () => {
      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('YouTube video processing started')
      expect(data.videoId).toBe('mock-uuid-123')
    })
  })

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)
    })

    test('予期しないエラーを適切に処理', async () => {
      // Arrange
      mockSupabaseAdmin.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Unexpected database error')
    })

    test('非Errorオブジェクトの例外を処理', async () => {
      // Arrange
      mockSupabaseAdmin.from = jest.fn().mockImplementation(() => {
        throw 'String error'
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Unknown error')
    })
  })

  describe('環境依存の動作', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    test('開発環境でエラー詳細を含む', async () => {
      // Arrange
      process.env.NODE_ENV = 'development'
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)

      const mockInsert = jest.fn().mockResolvedValue({
        error: {
          code: '500',
          message: 'Detailed error message'
        }
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.details).toBe('Detailed error message')
    })

    test('本番環境でエラー詳細を隠す', async () => {
      // Arrange
      process.env.NODE_ENV = 'production'
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)

      const mockInsert = jest.fn().mockResolvedValue({
        error: {
          code: '500',
          message: 'Detailed error message'
        }
      })
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const request = createMockRequest({
        url: 'https://youtube.com/watch?v=test123'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.details).toBeUndefined()
    })
  })

  describe('YouTube動画ID抽出', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      } as any)
    })

    test('様々なフォーマットから動画IDを正しく抽出', async () => {
      const testCases = [
        {
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/abc123XYZ_-',
          expectedId: 'abc123XYZ_-'
        },
        {
          url: 'https://www.youtube.com/watch?v=test123&list=abc',
          expectedId: 'test123'
        }
      ]

      for (const testCase of testCases) {
        const mockInsert = jest.fn().mockResolvedValue({ error: null })
        mockSupabaseAdmin.from = jest.fn().mockReturnValue({
          insert: mockInsert
        })

        const request = createMockRequest({ url: testCase.url })
        await POST(request)

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            youtube_video_id: testCase.expectedId
          })
        )
      }
    })
  })
})