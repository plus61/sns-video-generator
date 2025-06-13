import { SocialMediaIntegration, PLATFORM_CONFIGS } from '../social-media-integration'

// Mock fetch for testing API calls
global.fetch = jest.fn()

const mockVideoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' })

describe('SocialMediaIntegration', () => {
  let integration: SocialMediaIntegration
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    integration = new SocialMediaIntegration()
    mockFetch.mockClear()
  })

  describe('Platform Configuration', () => {
    it('should have all required platform configs', () => {
      expect(PLATFORM_CONFIGS.youtube).toBeDefined()
      expect(PLATFORM_CONFIGS.tiktok).toBeDefined()
      expect(PLATFORM_CONFIGS.instagram).toBeDefined()
      expect(PLATFORM_CONFIGS.twitter).toBeDefined()
    })

    it('should return supported platforms list', () => {
      const platforms = integration.getSupportedPlatforms()
      expect(platforms).toContain('youtube')
      expect(platforms).toContain('tiktok')
      expect(platforms).toContain('instagram')
      expect(platforms).toContain('twitter')
    })

    it('should get platform config by name', () => {
      const youtubeConfig = integration.getPlatformConfig('youtube')
      expect(youtubeConfig).toEqual(PLATFORM_CONFIGS.youtube)
      
      const invalidConfig = integration.getPlatformConfig('invalid')
      expect(invalidConfig).toBeNull()
    })
  })

  describe('Credential Management', () => {
    it('should set and get credentials', () => {
      const credentials = {
        accessToken: 'test-token',
        clientId: 'test-client-id'
      }

      integration.setCredentials('youtube', credentials)
      const retrieved = integration.getCredentials('youtube')
      
      expect(retrieved).toEqual(credentials)
    })

    it('should check authentication status', () => {
      expect(integration.isAuthenticated('youtube')).toBe(false)
      
      integration.setCredentials('youtube', { accessToken: 'test-token' })
      expect(integration.isAuthenticated('youtube')).toBe(true)
    })

    it('should handle expired tokens', () => {
      const expiredCredentials = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      }

      integration.setCredentials('youtube', expiredCredentials)
      expect(integration.isAuthenticated('youtube')).toBe(false)
    })

    it('should clear credentials', () => {
      integration.setCredentials('youtube', { accessToken: 'test-token' })
      integration.setCredentials('tiktok', { accessToken: 'test-token-2' })
      
      integration.clearCredentials('youtube')
      expect(integration.isAuthenticated('youtube')).toBe(false)
      expect(integration.isAuthenticated('tiktok')).toBe(true)
      
      integration.clearCredentials()
      expect(integration.isAuthenticated('tiktok')).toBe(false)
    })
  })

  describe('Video Validation', () => {
    it('should validate video for YouTube', () => {
      const validation = integration.validateVideoForPlatform('youtube', mockVideoFile, 300)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect file size violations', () => {
      const largeFile = new File(['x'.repeat(1000000)], 'large.mp4', { type: 'video/mp4' })
      Object.defineProperty(largeFile, 'size', { value: 5000 * 1024 * 1024 }) // 5GB
      
      const validation = integration.validateVideoForPlatform('tiktok', largeFile, 60)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContainEqual(expect.stringContaining('File size'))
    })

    it('should detect duration violations', () => {
      const validation = integration.validateVideoForPlatform('tiktok', mockVideoFile, 300) // 5 minutes
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContainEqual(expect.stringContaining('Duration'))
    })

    it('should detect unsupported formats', () => {
      const unsupportedFile = new File(['content'], 'test.avi', { type: 'video/avi' })
      const validation = integration.validateVideoForPlatform('tiktok', unsupportedFile, 60)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContainEqual(expect.stringContaining('Format'))
    })

    it('should provide platform-specific warnings', () => {
      const validation = integration.validateVideoForPlatform('tiktok', mockVideoFile, 10)
      
      expect(validation.valid).toBe(true)
      expect(validation.warnings).toContainEqual(expect.stringContaining('shorter than 15 seconds'))
    })
  })

  describe('YouTube Integration', () => {
    beforeEach(() => {
      integration.setCredentials('youtube', { accessToken: 'test-youtube-token' })
    })

    it('should post to YouTube successfully', async () => {
      // Mock successful upload initiation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'Location': 'https://upload.youtube.com/resumable-upload-123' })
        } as Response)
        // Mock successful video upload
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'test-video-id' })
        } as Response)
        // Mock successful metadata update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'test-video-id' })
        } as Response)

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToYouTube(postData)

      expect(result.success).toBe(true)
      expect(result.postId).toBe('test-video-id')
      expect(result.url).toBe('https://youtube.com/watch?v=test-video-id')
    })

    it('should handle YouTube upload failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      } as Response)

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToYouTube(postData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('YouTube upload initiation failed')
    })

    it('should require authentication for YouTube', async () => {
      integration.clearCredentials('youtube')

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToYouTube(postData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated with YouTube')
    })
  })

  describe('TikTok Integration', () => {
    beforeEach(() => {
      integration.setCredentials('tiktok', { accessToken: 'test-tiktok-token' })
    })

    it('should post to TikTok successfully', async () => {
      // Mock upload initialization
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              upload_url: 'https://tiktok.com/upload/123',
              upload_id: 'upload-123'
            }
          })
        } as Response)
        // Mock file upload
        .mockResolvedValueOnce({
          ok: true
        } as Response)
        // Mock publish
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { publish_id: 'publish-123' }
          })
        } as Response)

      const postData = {
        title: 'Test TikTok',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToTikTok(postData)

      expect(result.success).toBe(true)
      expect(result.postId).toBe('publish-123')
    })

    it('should require authentication for TikTok', async () => {
      integration.clearCredentials('tiktok')

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToTikTok(postData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated with TikTok')
    })
  })

  describe('Instagram Integration', () => {
    beforeEach(() => {
      integration.setCredentials('instagram', { accessToken: 'test-instagram-token' })
    })

    it('should post to Instagram successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'instagram-post-123' })
      } as Response)

      const postData = {
        title: 'Test Instagram',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToInstagram(postData)

      expect(result.success).toBe(true)
      expect(result.postId).toBe('instagram-post-123')
    })

    it('should require authentication for Instagram', async () => {
      integration.clearCredentials('instagram')

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      const result = await integration.postToInstagram(postData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated with Instagram')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      integration.setCredentials('tiktok', { accessToken: 'test-token' })
      
      // Mock many requests to trigger rate limit
      for (let i = 0; i < 1001; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { upload_url: 'test', upload_id: 'test' } })
        } as Response)
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { publish_id: 'test' } })
        } as Response)
      }

      const postData = {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        videoFile: mockVideoFile,
        visibility: 'public' as const
      }

      // First 1000 should work, 1001st should be rate limited
      let lastResult
      for (let i = 0; i < 1001; i++) {
        lastResult = await integration.postToTikTok(postData)
      }

      expect(lastResult?.success).toBe(false)
      expect(lastResult?.error).toBe('Rate limit exceeded for TikTok')
    })
  })

  describe('Storage Persistence', () => {
    it('should persist credentials to localStorage', () => {
      const credentials = { accessToken: 'test-token' }
      integration.setCredentials('youtube', credentials)

      const stored = localStorage.getItem('social_media_credentials')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.youtube).toEqual(credentials)
    })

    it('should load credentials from localStorage', () => {
      const credentials = { youtube: { accessToken: 'test-token' } }
      localStorage.setItem('social_media_credentials', JSON.stringify(credentials))

      const newIntegration = new SocialMediaIntegration()
      expect(newIntegration.isAuthenticated('youtube')).toBe(true)
    })
  })
})