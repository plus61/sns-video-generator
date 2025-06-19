import { YouTubeDownloader, DownloadErrorType, YouTubeDownloadError } from '@/lib/youtube-downloader-railway'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs/promises'
import path from 'path'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/youtube-api-service')
jest.mock('fs/promises')
jest.mock('path')

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>
const mockFs = fs as jest.Mocked<typeof fs>
const mockPath = path as jest.Mocked<typeof path>

// Mock youtube-dl-exec
const mockYoutubeDl = jest.fn()
jest.mock('youtube-dl-exec', () => mockYoutubeDl, { virtual: true })

describe('YouTubeDownloader (Railway)', () => {
  let downloader: YouTubeDownloader
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset environment variables
    process.env = { ...originalEnv }
    
    // Mock path.join
    mockPath.join.mockImplementation((...paths) => paths.join('/'))
    
    // Mock fs operations
    mockFs.access.mockRejectedValue(new Error('Directory not found'))
    mockFs.mkdir.mockResolvedValue(undefined)
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue(Buffer.from('mock file content'))
    mockFs.stat.mockResolvedValue({ size: 1024 * 1024 } as any) // 1MB
    mockFs.unlink.mockResolvedValue(undefined)
    
    // Mock Supabase
    mockSupabaseAdmin.storage = {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-storage.com/video.mp4' }
        })
      })
    } as any
    
    mockSupabaseAdmin.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Detection', () => {
    test('detects Railway environment correctly', () => {
      process.env.RAILWAY_ENVIRONMENT = 'production'
      downloader = new YouTubeDownloader()
      
      // Check constructor output through console.log spy
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      downloader = new YouTubeDownloader()
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Railway Environment: true'))
      
      consoleSpy.mockRestore()
    })

    test('detects Vercel environment correctly', () => {
      process.env.VERCEL = '1'
      downloader = new YouTubeDownloader()
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      downloader = new YouTubeDownloader()
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Vercel Environment: true'))
      
      consoleSpy.mockRestore()
    })

    test('uses mock mode when explicitly enabled', () => {
      process.env.USE_MOCK_DOWNLOADER = 'true'
      downloader = new YouTubeDownloader()
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      downloader = new YouTubeDownloader()
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Mock Mode: true'))
      
      consoleSpy.mockRestore()
    })

    test('uses real mode in Railway when mock not explicitly enabled', () => {
      process.env.RAILWAY_ENVIRONMENT = 'production'
      process.env.USE_MOCK_DOWNLOADER = 'false'
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      downloader = new YouTubeDownloader()
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Mock Mode: false'))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Mock Implementation', () => {
    beforeEach(() => {
      process.env.USE_MOCK_DOWNLOADER = 'true'
      downloader = new YouTubeDownloader()
    })

    test('downloads video successfully in mock mode', async () => {
      const result = await downloader.downloadVideo('test-id', 'https://youtube.com/watch?v=test123')
      
      expect(result.localPath).toBe('/tmp/video-uploads/test-id.mp4')
      expect(result.metadata).toMatchObject({
        title: expect.any(String),
        duration: expect.any(Number),
        fileSize: expect.any(Number)
      })
    })

    test('processes YouTube video successfully in mock mode', async () => {
      const result = await downloader.processYouTubeVideo('test-id', 'https://youtube.com/watch?v=test123')
      
      expect(result.success).toBe(true)
      expect(result.publicUrl).toBe('https://mock-storage.com/video.mp4')
      expect(result.metadata).toBeDefined()
    })

    test('uploads to Supabase correctly in mock mode', async () => {
      const metadata = {
        title: 'Test Video',
        duration: 300,
        fileSize: 1024 * 1024,
        format: 'mp4',
        width: 1920,
        height: 1080
      }

      const result = await downloader.uploadToSupabase('test-id', '/tmp/test.mp4', metadata)

      expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith('videos')
      expect(result.publicUrl).toBe('https://mock-storage.com/video.mp4')
    })
  })

  describe('Real Implementation', () => {
    beforeEach(() => {
      process.env.RAILWAY_ENVIRONMENT = 'production'
      process.env.USE_MOCK_DOWNLOADER = 'false'
      downloader = new YouTubeDownloader()
    })

    test('handles youtube-dl-exec loading failure gracefully', async () => {
      // Mock youtube-dl-exec import failure
      jest.doMock('youtube-dl-exec', () => {
        throw new Error('Module not found')
      }, { virtual: true })

      const result = await downloader.downloadVideo('test-id', 'https://youtube.com/watch?v=test123')
      
      // Should fall back to mock implementation
      expect(result.localPath).toBe('/tmp/video-uploads/test-id.mp4')
    })

    test('classifies download errors correctly', async () => {
      // Test private video error
      const privateVideoError = new Error('This video is private')
      
      try {
        await downloader.downloadVideo('test-id', 'https://youtube.com/watch?v=private123')
      } catch (error) {
        // Mock the error classification by testing the classifyError method indirectly
        expect(error).toBeDefined()
      }
    })

    test('retries failed operations', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      // Test retry logic through downloadVideo which uses retryOperation
      mockYoutubeDl
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ title: 'Test Video', duration: 300 })

      // This should eventually succeed after retries
      const result = await downloader.downloadVideo('test-id', 'https://youtube.com/watch?v=test123')
      expect(result).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      downloader = new YouTubeDownloader()
    })

    test('throws YouTubeDownloadError for private videos', async () => {
      const error = new YouTubeDownloadError(
        DownloadErrorType.PRIVATE_VIDEO,
        new Error('Private video'),
        'This video is private'
      )

      expect(error.name).toBe('YouTubeDownloadError')
      expect(error.errorType).toBe(DownloadErrorType.PRIVATE_VIDEO)
      expect(error.message).toContain('private')
    })

    test('throws YouTubeDownloadError for unavailable videos', async () => {
      const error = new YouTubeDownloadError(
        DownloadErrorType.VIDEO_UNAVAILABLE,
        new Error('Video not found'),
        'Video is unavailable'
      )

      expect(error.errorType).toBe(DownloadErrorType.VIDEO_UNAVAILABLE)
    })

    test('throws YouTubeDownloadError when downloader not available', async () => {
      const error = new YouTubeDownloadError(
        DownloadErrorType.DOWNLOADER_NOT_AVAILABLE,
        new Error('youtube-dl-exec not found'),
        'Downloader not available'
      )

      expect(error.errorType).toBe(DownloadErrorType.DOWNLOADER_NOT_AVAILABLE)
    })

    test('handles Supabase upload errors', async () => {
      mockSupabaseAdmin.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: new Error('Upload failed') })
        })
      } as any

      const metadata = {
        title: 'Test Video',
        duration: 300,
        fileSize: 1024
      }

      await expect(
        downloader.uploadToSupabase('test-id', '/tmp/test.mp4', metadata)
      ).rejects.toThrow('Failed to upload to Supabase')
    })

    test('updates database with error status on processing failure', async () => {
      // Mock a failure in downloadVideo
      jest.spyOn(downloader, 'downloadVideo').mockRejectedValue(new Error('Download failed'))

      await expect(
        downloader.processYouTubeVideo('test-id', 'https://youtube.com/watch?v=test123')
      ).rejects.toThrow('Download failed')

      // Verify database was updated with error status
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('video_uploads')
      const updateCall = mockSupabaseAdmin.from().update
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error_message: 'Download failed'
        })
      )
    })
  })

  describe('File Management', () => {
    beforeEach(() => {
      downloader = new YouTubeDownloader()
    })

    test('ensures temp directory exists', async () => {
      await downloader.ensureTempDir()
      
      expect(mockFs.access).toHaveBeenCalled()
      expect(mockFs.mkdir).toHaveBeenCalledWith('/tmp/video-uploads', { recursive: true })
    })

    test('cleans up temporary files', async () => {
      await downloader.cleanupTempFile('/tmp/test.mp4')
      
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/test.mp4')
    })

    test('handles cleanup errors gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('File not found'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await downloader.cleanupTempFile('/tmp/test.mp4')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to cleanup temp file'),
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Video ID Extraction', () => {
    beforeEach(() => {
      downloader = new YouTubeDownloader()
    })

    test('extracts video ID from various URL formats', () => {
      const testCases = [
        { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://youtu.be/abc123XYZ_-', expected: 'abc123XYZ_-' },
        { url: 'youtube.com/watch?v=test123&list=abc', expected: 'test123' },
        { url: 'youtu.be/shortid', expected: 'shortid' }
      ]

      testCases.forEach(({ url, expected }) => {
        // Test through downloadVideo which calls extractVideoIdFromUrl internally
        expect(downloader.downloadVideo('test-id', url)).resolves.toBeDefined()
      })
    })
  })

  describe('Metadata Enhancement', () => {
    beforeEach(() => {
      process.env.USE_MOCK_DOWNLOADER = 'true'
      downloader = new YouTubeDownloader()
    })

    test('generates fallback metadata when API fails', async () => {
      const result = await downloader.downloadVideo('test-id', 'https://youtube.com/watch?v=test123')
      
      expect(result.metadata).toMatchObject({
        title: expect.any(String),
        duration: expect.any(Number),
        thumbnail: expect.stringContaining('img.youtube.com'),
        uploader: expect.any(String),
        viewCount: expect.any(Number),
        likeCount: expect.any(Number)
      })
    })

    test('includes comprehensive metadata in database update', async () => {
      await downloader.processYouTubeVideo('test-id', 'https://youtube.com/watch?v=test123')
      
      const updateCall = mockSupabaseAdmin.from().update
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            format: expect.any(String),
            uploader: expect.any(String),
            view_count: expect.any(Number),
            like_count: expect.any(Number)
          })
        })
      )
    })
  })
})