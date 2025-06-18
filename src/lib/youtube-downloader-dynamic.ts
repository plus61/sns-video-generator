// Dynamic importer for YouTube downloader to handle build environments
import type { YouTubeDownloader as YouTubeDownloaderType } from './youtube-downloader'

export async function getYouTubeDownloader(): Promise<typeof YouTubeDownloaderType> {
  // Always use mock in Vercel environment
  if (process.env.VERCEL || process.env.USE_MOCK_DOWNLOADER === 'true') {
    const { YouTubeDownloader } = await import('./youtube-downloader-mock')
    return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
  }
  
  // Try to use real implementation in other environments
  try {
    const { YouTubeDownloader } = await import('./youtube-downloader')
    return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
  } catch (error) {
    console.warn('Failed to load real YouTube downloader, falling back to mock:', error)
    const { YouTubeDownloader } = await import('./youtube-downloader-mock')
    return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
  }
}