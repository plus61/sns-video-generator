// マルチプラットフォーム同時投稿 - 5分TDD実装

import { publishToYouTube } from './platform-integrations/youtube-api'
import { publishToTikTok } from './platform-integrations/tiktok-api'
import { publishToInstagram } from './platform-integrations/instagram-api'

interface PublishResult {
  platform: string
  success: boolean
  postId?: string
  error?: string
}

interface ProcessedVideo {
  filePath: string
  title: string
  description: string
  tags: string[]
  thumbnail?: string
}

export async function publishToAllPlatforms(
  video: ProcessedVideo,
  platforms: string[] = ['youtube', 'tiktok', 'instagram', 'twitter']
): Promise<PublishResult[]> {
  
  // 各プラットフォームへの投稿を並列化
  const publishPromises = platforms.map(async (platform): Promise<PublishResult> => {
    try {
      const result = await publishToPlatform(video, platform)
      return {
        platform,
        success: true,
        postId: result.postId
      }
    } catch (error) {
      return {
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
  
  // allSettledで全ての結果を待つ（エラーがあっても続行）
  const results = await Promise.allSettled(publishPromises)
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        platform: platforms[index],
        success: false,
        error: result.reason
      }
    }
  })
}

async function publishToPlatform(video: ProcessedVideo, platform: string): Promise<any> {
  switch (platform) {
    case 'youtube':
      return publishToYouTube({
        videoPath: video.filePath,
        title: video.title,
        description: video.description,
        tags: video.tags
      })
    
    case 'tiktok':
      return publishToTikTok({
        videoPath: video.filePath,
        caption: `${video.title} ${video.tags.map(t => `#${t}`).join(' ')}`
      })
    
    case 'instagram':
      return publishToInstagram({
        videoPath: video.filePath,
        caption: video.description,
        hashtags: video.tags
      })
    
    case 'twitter':
      // Twitter実装は簡略化
      return { postId: 'mock-twitter-id' }
    
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

// 進捗トラッキング付き並列投稿
export async function publishWithProgress(
  video: ProcessedVideo,
  onProgress: (platform: string, status: string) => void
): Promise<PublishResult[]> {
  const platforms = ['youtube', 'tiktok', 'instagram', 'twitter']
  
  const publishPromises = platforms.map(async (platform) => {
    onProgress(platform, 'starting')
    
    try {
      const result = await publishToPlatform(video, platform)
      onProgress(platform, 'completed')
      return { platform, success: true, postId: result.postId }
    } catch (error) {
      onProgress(platform, 'failed')
      return { platform, success: false, error: error.message }
    }
  })
  
  return Promise.all(publishPromises)
}

// 簡単なテスト
export async function testParallelPublishing() {
  const testVideo: ProcessedVideo = {
    filePath: '/test/video.mp4',
    title: 'Test Video',
    description: 'This is a test',
    tags: ['test', 'demo']
  }
  
  const results = await publishToAllPlatforms(testVideo)
  console.log('Publishing results:', results)
  return results
}