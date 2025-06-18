import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('認証フローテスト', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        }))
      }
    }
    
    mockCreateClient.mockReturnValue(mockSupabaseClient)
    
    // 環境変数のセットアップ
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.NEXTAUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    // 環境変数のクリーンアップ
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.NEXTAUTH_SECRET
  })

  describe('NextAuth設定', () => {
    test('JWTストラテジーが設定されている', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    test('セッション期間が7日間に設定されている', () => {
      const expectedDuration = 7 * 24 * 60 * 60 // 7日間（秒）
      expect(authOptions.session?.maxAge).toBe(expectedDuration)
      expect(authOptions.jwt?.maxAge).toBe(expectedDuration)
    })

    test('カスタムページが正しく設定されている', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/signin')
      expect(authOptions.pages?.error).toBe('/auth/error')
    })

    test('Credentials Providerが設定されている', () => {
      const provider = authOptions.providers[0] as any
      expect(provider.name).toBe('credentials')
      expect(provider.credentials).toEqual({
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      })
    })
  })

  describe('認証プロバイダーテスト', () => {
    const provider = authOptions.providers[0] as any

    test('有効なクレデンシャルで認証成功', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com'
          } 
        },
        error: null
      })

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'correct-password'
      })

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'test@example.com',
        image: null
      })
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'correct-password'
      })
    })

    test('無効なクレデンシャルで認証失敗', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      })

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'wrong-password'
      })

      // Assert
      expect(result).toBeNull()
    })

    test('メールなしで認証失敗', async () => {
      // Act
      const result = await provider.authorize({
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('パスワードなしで認証失敗', async () => {
      // Act
      const result = await provider.authorize({
        email: 'test@example.com'
      })

      // Assert
      expect(result).toBeNull()
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('Supabase環境変数不足で認証失敗', async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
    })

    test('Supabase接続エラーで認証失敗', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network connection failed')
      )

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('コールバック機能テスト', () => {
    describe('JWTコールバック', () => {
      test('ユーザー情報をトークンに追加', async () => {
        // Arrange
        const token = { sub: 'existing-sub' }
        const user = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }

        // Act
        const result = await authOptions.callbacks?.jwt?.({ token, user } as any)

        // Assert
        expect(result).toEqual({
          sub: 'existing-sub',
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        })
      })

      test('ユーザー情報なしでトークンそのまま返却', async () => {
        // Arrange
        const token = { sub: 'existing-sub', email: 'existing@example.com' }

        // Act
        const result = await authOptions.callbacks?.jwt?.({ token } as any)

        // Assert
        expect(result).toEqual(token)
      })
    })

    describe('セッションコールバック', () => {
      test('トークン情報をセッションに追加', async () => {
        // Arrange
        const session = {
          user: { email: 'old@example.com' },
          expires: '2024-12-31'
        }
        const token = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }

        // Act
        const result = await authOptions.callbacks?.session?.({ session, token } as any)

        // Assert
        expect(result).toEqual({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User'
          },
          expires: '2024-12-31'
        })
      })

      test('トークンなしでセッションそのまま返却', async () => {
        // Arrange
        const session = {
          user: { email: 'test@example.com' },
          expires: '2024-12-31'
        }

        // Act
        const result = await authOptions.callbacks?.session?.({ session, token: null } as any)

        // Assert
        expect(result).toEqual(session)
      })
    })

    describe('リダイレクトコールバック', () => {
      const baseUrl = 'https://example.com'

      test('相対URLを絶対URLに変換', async () => {
        // Act
        const result = await authOptions.callbacks?.redirect?.({
          url: '/dashboard',
          baseUrl
        } as any)

        // Assert
        expect(result).toBe('https://example.com/dashboard')
      })

      test('同一オリジンの絶対URLをそのまま返却', async () => {
        // Act
        const url = 'https://example.com/profile'
        const result = await authOptions.callbacks?.redirect?.({
          url,
          baseUrl
        } as any)

        // Assert
        expect(result).toBe(url)
      })

      test('外部URLをダッシュボードにリダイレクト', async () => {
        // Act
        const result = await authOptions.callbacks?.redirect?.({
          url: 'https://malicious-site.com/steal-data',
          baseUrl
        } as any)

        // Assert
        expect(result).toBe('https://example.com/dashboard')
      })

      test('不正なURLをダッシュボードにリダイレクト', async () => {
        // Act
        const result = await authOptions.callbacks?.redirect?.({
          url: 'javascript:alert("xss")',
          baseUrl
        } as any)

        // Assert
        expect(result).toBe('https://example.com/dashboard')
      })
    })

    test('サインインコールバックは常にtrueを返却', async () => {
      // Act
      const result = await authOptions.callbacks?.signIn?.({} as any)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('セキュリティ設定', () => {
    test('HTTPS URLでセキュアクッキーを使用', () => {
      process.env.NEXTAUTH_URL = 'https://secure-app.com'
      expect(authOptions.useSecureCookies).toBe(true)
    })

    test('HTTP URLでセキュアクッキーを使用しない', () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      expect(authOptions.useSecureCookies).toBe(false)
    })

    test('開発環境でデバッグが有効', () => {
      process.env.NODE_ENV = 'development'
      expect(authOptions.debug).toBe(true)
    })

    test('本番環境でデバッグが無効', () => {
      process.env.NODE_ENV = 'production'
      expect(authOptions.debug).toBe(false)
    })
  })

  describe('Supabaseクライアント設定', () => {
    test('認証用Supabaseクライアントが正しく設定', async () => {
      // Arrange
      const provider = authOptions.providers[0] as any

      // Act
      await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    })
  })

  describe('エラーハンドリング', () => {
    const provider = authOptions.providers[0] as any

    test('Supabaseネットワークエラーで認証失敗', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
    })

    test('Supabaseタイムアウトエラーで認証失敗', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Request timeout')
      )

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
    })

    test('予期しないエラーで認証失敗', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        'Unexpected string error'
      )

      // Act
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      expect(result).toBeNull()
    })
  })
})