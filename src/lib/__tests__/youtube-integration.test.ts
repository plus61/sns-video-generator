import { YouTubeAPIService, YouTubeAPIErrorType } from '../youtube-api-service'

describe('YouTube API Integration Tests', () => {
  let service: YouTubeAPIService

  beforeEach(() => {
    service = new YouTubeAPIService()
  })

  describe('Video Info Retrieval', () => {
    test('should handle valid YouTube URL with mock implementation', async () => {
      const metadata = await service.getVideoInfo('https://youtu.be/dQw4w9WgXcQ')
      
      expect(metadata).toBeDefined()
      expect(metadata.id).toBe('dQw4w9WgXcQ')
      expect(metadata.title).toBeTruthy()
      expect(metadata.duration).toBeGreaterThan(0)
      expect(metadata.viewCount).toBeGreaterThan(0)
      expect(metadata.thumbnail).toContain('dQw4w9WgXcQ')
      expect(metadata.uploader).toBeTruthy()
    }, 10000)

    test('should handle different YouTube URL formats', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=test123',
        'https://youtu.be/test123',
        'https://youtube.com/embed/test123'
      ]

      for (const url of urls) {
        const metadata = await service.getVideoInfo(url)
        expect(metadata.id).toBe('test123')
      }
    }, 15000)

    test('should generate consistent data for same video ID', async () => {
      const url = 'https://youtu.be/consistent123'
      
      const metadata1 = await service.getVideoInfo(url)
      const metadata2 = await service.getVideoInfo(url)
      
      expect(metadata1.title).toBe(metadata2.title)
      expect(metadata1.uploader).toBe(metadata2.uploader)
      expect(metadata1.duration).toBe(metadata2.duration)
      expect(metadata1.viewCount).toBe(metadata2.viewCount)
    }, 10000)
  })

  describe('Social Media Optimization', () => {
    test('should provide social media optimized metadata', async () => {
      const socialData = await service.getVideoMetadataForSocial('https://youtu.be/social123')
      
      expect(socialData).toBeDefined()
      expect(socialData.title).toBeTruthy()
      expect(socialData.title.length).toBeLessThanOrEqual(100)
      expect(socialData.description.length).toBeLessThanOrEqual(300)
      expect(socialData.suggestedTags).toBeInstanceOf(Array)
      expect(socialData.suggestedTags.length).toBeLessThanOrEqual(5)
      expect(typeof socialData.isShortForm).toBe('boolean')
      expect(typeof socialData.engagementScore).toBe('number')
      expect(socialData.engagementScore).toBeGreaterThanOrEqual(0)
      expect(socialData.engagementScore).toBeLessThanOrEqual(10)
    }, 10000)

    test('should correctly identify short-form content', async () => {
      // Mock short video
      const mockShort = await service.getVideoMetadataForSocial('https://youtu.be/short123')
      
      // Duration should be determined by mock implementation
      if (mockShort.duration <= 60) {
        expect(mockShort.isShortForm).toBe(true)
      } else {
        expect(mockShort.isShortForm).toBe(false)
      }
    }, 10000)
  })

  describe('Video Accessibility', () => {
    test('should check video accessibility correctly', async () => {
      const isAccessible = await service.isVideoAccessible('https://youtu.be/accessible123')
      expect(typeof isAccessible).toBe('boolean')
    }, 10000)

    test('should handle multiple accessibility checks', async () => {
      const urls = [
        'https://youtu.be/video1',
        'https://youtu.be/video2',
        'https://youtu.be/video3'
      ]

      const results = await Promise.all(
        urls.map(url => service.isVideoAccessible(url))
      )

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(typeof result).toBe('boolean')
      })
    }, 15000)
  })

  describe('Error Scenarios', () => {
    test('should handle invalid YouTube URLs gracefully', async () => {
      await expect(
        service.getVideoInfo('https://example.com/not-youtube')
      ).rejects.toThrow()
    })

    test('should handle malformed URLs', async () => {
      await expect(
        service.getVideoInfo('not-a-url-at-all')
      ).rejects.toThrow()
    })

    test('should handle empty or null URLs', async () => {
      await expect(
        service.getVideoInfo('')
      ).rejects.toThrow()
    })
  })

  describe('Performance', () => {
    test('should complete video info retrieval within reasonable time', async () => {
      const startTime = Date.now()
      
      await service.getVideoInfo('https://youtu.be/performance123')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 5 seconds for mock implementation
      expect(duration).toBeLessThan(5000)
    })

    test('should handle concurrent requests', async () => {
      const urls = [
        'https://youtu.be/concurrent1',
        'https://youtu.be/concurrent2',
        'https://youtu.be/concurrent3',
        'https://youtu.be/concurrent4',
        'https://youtu.be/concurrent5'
      ]

      const startTime = Date.now()
      
      const results = await Promise.all(
        urls.map(url => service.getVideoInfo(url))
      )

      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.id).toBeTruthy()
      })
      
      // Concurrent requests should not take much longer than sequential
      expect(duration).toBeLessThan(10000)
    }, 15000)
  })

  describe('Mock Implementation Validation', () => {
    test('should provide realistic mock data', async () => {
      const metadata = await service.getVideoInfo('https://youtu.be/realistic123')
      
      // Check for realistic data ranges
      expect(metadata.duration).toBeGreaterThan(60) // At least 1 minute
      expect(metadata.duration).toBeLessThan(3600) // Less than 1 hour
      expect(metadata.viewCount).toBeGreaterThan(1000) // At least 1k views
      expect(metadata.viewCount).toBeLessThan(1000000) // Less than 1M views
      expect(metadata.likeCount).toBeGreaterThan(0)
      expect(metadata.likeCount).toBeLessThan(metadata.viewCount) // Likes < Views
      
      // Check for proper Japanese content
      expect(metadata.title).toMatch(/[ひらがなカタカナ漢字]/)
      expect(metadata.uploader).toMatch(/[ひらがなカタカナ漢字]/)
    })

    test('should provide valid thumbnail URLs', async () => {
      const metadata = await service.getVideoInfo('https://youtu.be/thumbnail123')
      
      expect(metadata.thumbnail).toMatch(/^https:\/\//)
      expect(metadata.thumbnail).toContain('youtube.com')
      expect(metadata.thumbnail).toContain('thumbnail123')
    })

    test('should provide proper video categories', async () => {
      const socialData = await service.getVideoMetadataForSocial('https://youtu.be/category123')
      
      // Should have some tags for categorization
      expect(socialData.suggestedTags.length).toBeGreaterThan(0)
      socialData.suggestedTags.forEach(tag => {
        expect(tag).toMatch(/^#/)
        expect(tag.length).toBeGreaterThan(1)
      })
    })
  })
})