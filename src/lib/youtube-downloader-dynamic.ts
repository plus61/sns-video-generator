// Dynamic importer for YouTube downloader to handle build environments
import type { YouTubeDownloader as YouTubeDownloaderType } from './youtube-downloader'

/**
 * Environment detection helper
 */
function detectEnvironment() {
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV)
  const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const explicitMock = process.env.USE_MOCK_DOWNLOADER
  
  return {
    isVercel,
    isRailway,
    isDevelopment,
    explicitMock,
    shouldUseMock: explicitMock === 'true' || (explicitMock !== 'false' && isVercel)
  }
}

export async function getYouTubeDownloader(): Promise<typeof YouTubeDownloaderType> {
  const env = detectEnvironment()
  
  console.log('YouTube Downloader Environment Detection:', {
    vercel: env.isVercel,
    railway: env.isRailway,
    development: env.isDevelopment,
    explicitMock: env.explicitMock,
    shouldUseMock: env.shouldUseMock
  })
  
  // Explicit mock mode
  if (env.explicitMock === 'true') {
    console.log('Using mock downloader: Explicitly enabled')
    const { YouTubeDownloader } = await import('./youtube-downloader-mock')
    return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
  }
  
  // Vercel environment always uses mock due to serverless limitations
  if (env.isVercel) {
    console.log('Using mock downloader: Vercel environment')
    const { YouTubeDownloader } = await import('./youtube-downloader-mock')
    return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
  }
  
  // Railway environment - use Railway-optimized downloader
  if (env.isRailway) {
    console.log('Using Railway downloader: Railway environment detected')
    try {
      const { YouTubeDownloader } = await import('./youtube-downloader-railway')
      return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
    } catch (error) {
      console.warn('Failed to load Railway downloader, falling back to mock:', error)
      const { YouTubeDownloader } = await import('./youtube-downloader-mock')
      return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
    }
  }
  
  // Development or other environments - try real implementation first
  if (env.isDevelopment || env.explicitMock === 'false') {
    console.log('Attempting real downloader for development/explicit environment')
    try {
      const { YouTubeDownloader } = await import('./youtube-downloader')
      return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
    } catch (error) {
      console.warn('Failed to load real YouTube downloader, falling back to Railway implementation:', error)
      try {
        const { YouTubeDownloader } = await import('./youtube-downloader-railway')
        return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
      } catch (railwayError) {
        console.warn('Failed to load Railway downloader, falling back to mock:', railwayError)
        const { YouTubeDownloader } = await import('./youtube-downloader-mock')
        return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
      }
    }
  }
  
  // Default fallback to mock
  console.log('Using mock downloader: Default fallback')
  const { YouTubeDownloader } = await import('./youtube-downloader-mock')
  return YouTubeDownloader as unknown as typeof YouTubeDownloaderType
}