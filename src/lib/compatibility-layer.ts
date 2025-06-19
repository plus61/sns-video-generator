/**
 * Compatibility layer for environment detection and dynamic module loading
 * Provides unified interface for Vercel/Railway/Development environments
 */

export type DeploymentEnvironment = 'vercel' | 'railway' | 'development'

export interface EnvironmentConfig {
  environment: DeploymentEnvironment
  supportsFFmpeg: boolean
  requiresRemoteProcessing: boolean
  apiBaseUrl: string
  maxFileSize: number
  processingTimeout: number
}

/**
 * Detect current deployment environment
 */
export function detectEnvironment(): DeploymentEnvironment {
  // Vercel environment detection
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return 'vercel'
  }
  
  // Railway environment detection
  if (process.env.RAILWAY_ENVIRONMENT) {
    return 'railway'
  }
  
  // Default to development
  return 'development'
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment()
  
  const configs: Record<DeploymentEnvironment, EnvironmentConfig> = {
    vercel: {
      environment: 'vercel',
      supportsFFmpeg: false, // FFmpeg not supported due to binary size
      requiresRemoteProcessing: true,
      apiBaseUrl: process.env.RAILWAY_BACKEND_URL || 'https://your-railway-backend.railway.app',
      maxFileSize: 50 * 1024 * 1024, // 50MB limit for Vercel
      processingTimeout: 60000 // 60 seconds
    },
    railway: {
      environment: 'railway',
      supportsFFmpeg: true, // Full FFmpeg support
      requiresRemoteProcessing: false,
      apiBaseUrl: process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3000',
      maxFileSize: 500 * 1024 * 1024, // 500MB for Railway
      processingTimeout: 300000 // 5 minutes
    },
    development: {
      environment: 'development',
      supportsFFmpeg: false, // Use mocks in development
      requiresRemoteProcessing: false,
      apiBaseUrl: 'http://localhost:3000',
      maxFileSize: 100 * 1024 * 1024, // 100MB for development
      processingTimeout: 30000 // 30 seconds
    }
  }
  
  return configs[environment]
}

/**
 * Dynamic video processor factory
 * Returns appropriate processor based on environment
 */
export async function createVideoProcessor() {
  const config = getEnvironmentConfig()
  
  switch (config.environment) {
    case 'vercel':
      const { VercelVideoProcessor: VercelProcessor } = await import('./video-processor-vercel')
      return new VercelProcessor({
        environment: 'vercel',
        railwayBackendUrl: config.apiBaseUrl,
        maxFileSize: config.maxFileSize,
        allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
      })
      
    case 'railway':
      // Railway has full FFmpeg support
      try {
        const { RailwayVideoProcessor } = await import('./video-processor-railway')
        return new RailwayVideoProcessor({
          environment: 'railway',
          maxFileSize: config.maxFileSize,
          allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
        })
      } catch (error) {
        console.warn('Railway processor not available, falling back to Vercel processor')
        const { VercelVideoProcessor: FallbackProcessor } = await import('./video-processor-vercel')
        return new FallbackProcessor({
          environment: 'railway',
          railwayBackendUrl: config.apiBaseUrl,
          maxFileSize: config.maxFileSize,
          allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
        })
      }
      
    case 'development':
    default:
      const { VercelVideoProcessor: DevProcessor } = await import('./video-processor-vercel')
      return new DevProcessor({
        environment: 'development',
        maxFileSize: config.maxFileSize,
        allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
      })
  }
}

// Legacy compatibility exports
export const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === 'true'
export const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production'
export const canvasEnabled = !process.env.DISABLE_CANVAS && !isVercel
export const bullmqEnabled = !process.env.DISABLE_BULLMQ && !isVercel
export const ffmpegNativeEnabled = !process.env.DISABLE_FFMPEG_NATIVE && !isVercel

// Legacy getVideoProcessor function
export async function getVideoProcessor() {
  return await createVideoProcessor()
}

/**
 * Environment-aware feature flags
 */
export function getFeatureFlags() {
  const config = getEnvironmentConfig()
  
  return {
    enableLocalProcessing: config.supportsFFmpeg,
    enableRemoteProcessing: config.requiresRemoteProcessing,
    enableBatchProcessing: config.environment !== 'vercel',
    enableAdvancedAnalysis: config.environment === 'railway',
    enableVideoUpload: true,
    enableYouTubeDownload: process.env.USE_MOCK_DOWNLOADER !== 'true',
    maxConcurrentJobs: config.environment === 'vercel' ? 3 : 10,
    enableRealTimeProgress: true,
    enableThumbnailGeneration: true,
    enableAudioExtraction: true
  }
}

/**
 * API endpoint routing based on environment
 */
export function getApiEndpoints() {
  const config = getEnvironmentConfig()
  
  const baseUrl = config.apiBaseUrl
  
  return {
    videoUpload: `${baseUrl}/api/video/upload`,
    videoProcess: config.requiresRemoteProcessing 
      ? `${config.apiBaseUrl}/api/video/process`
      : '/api/video/process',
    videoMetadata: config.requiresRemoteProcessing
      ? `${config.apiBaseUrl}/api/video/metadata`
      : '/api/video/metadata',
    videoThumbnail: config.requiresRemoteProcessing
      ? `${config.apiBaseUrl}/api/video/thumbnail`
      : '/api/video/thumbnail',
    videoOptimize: config.requiresRemoteProcessing
      ? `${config.apiBaseUrl}/api/video/optimize`
      : '/api/video/optimize',
    jobStatus: config.requiresRemoteProcessing
      ? `${config.apiBaseUrl}/api/video/job`
      : '/api/video/job'
  }
}

/**
 * Environment validation
 */
export function validateEnvironment(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const config = getEnvironmentConfig()
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required environment variables
  if (config.environment === 'vercel') {
    if (!process.env.RAILWAY_BACKEND_URL) {
      errors.push('RAILWAY_BACKEND_URL is required for Vercel deployment')
    }
    if (!process.env.RAILWAY_API_KEY) {
      errors.push('RAILWAY_API_KEY is required for video processing')
    }
  }
  
  if (config.environment === 'railway') {
    if (!process.env.RAILWAY_ENVIRONMENT) {
      warnings.push('RAILWAY_ENVIRONMENT not set, assuming Railway deployment')
    }
  }
  
  // General validations
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set, AI features will be limited')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Legacy function implementations for backward compatibility
export async function getVideoProcessingQueue() {
  const config = getEnvironmentConfig()
  
  if (config.environment === 'vercel') {
    try {
      const { videoProcessingQueue } = await import('./queues/video-processing-queue-vercel')
      return videoProcessingQueue
    } catch {
      // Return mock queue if not available
      return {
        add: async () => ({ id: 'mock-job' }),
        process: () => {},
        getJob: async () => null
      }
    }
  } else if (bullmqEnabled) {
    try {
      const { getVideoProcessingQueue } = await import('./queues/video-processing-queue')
      return getVideoProcessingQueue()
    } catch {
      // Fallback to Vercel implementation
      const { videoProcessingQueue } = await import('./queues/video-processing-queue-vercel')
      return videoProcessingQueue
    }
  }
  
  // Default mock implementation
  return {
    add: async () => ({ id: 'mock-job' }),
    process: () => {},
    getJob: async () => null
  }
}

export async function getThumbnailGenerator() {
  const config = getEnvironmentConfig()
  
  if (config.supportsFFmpeg && canvasEnabled) {
    try {
      const { getThumbnailGenerator } = await import('./thumbnail-generator')
      return getThumbnailGenerator()
    } catch {
      // Fall through to mock
    }
  }
  
  // Return a mock implementation
  return {
    generateFromVideo: async () => [],
    generateFromImage: async () => null,
    generateAnimatedThumbnail: async () => null
  }
}

export async function getVideoTextEditor() {
  const config = getEnvironmentConfig()
  
  if (config.supportsFFmpeg && canvasEnabled) {
    try {
      const { createTextElement, updateTextElement } = await import('./video-text-editor')
      return { createTextElement, updateTextElement }
    } catch {
      // Fall through to mock
    }
  }
  
  // Return mock implementations
  return {
    createTextElement: () => ({ id: 'mock', content: '', position: { x: 0, y: 0 } }),
    updateTextElement: () => ({})
  }
}

// Configuration based on platform (legacy compatibility)
export const getProcessingConfig = () => {
  const config = getEnvironmentConfig()
  
  return {
    maxVideoSize: config.maxFileSize,
    maxProcessingTime: config.processingTimeout,
    useExternalProcessing: config.requiresRemoteProcessing,
    externalProcessingUrl: config.requiresRemoteProcessing ? config.apiBaseUrl : '',
    tempDir: config.environment === 'vercel' ? '/tmp' : '/tmp/video-processing'
  }
}

// Platform-specific error messages (legacy compatibility)
export const getPlatformErrorMessage = (error: string) => {
  const config = getEnvironmentConfig()
  
  if (config.environment === 'vercel' && error.includes('canvas')) {
    return 'Video thumbnail generation is not available in the current environment. Please use our Railway deployment for full video processing capabilities.'
  }
  if (config.environment === 'vercel' && error.includes('ffmpeg')) {
    return 'Advanced video processing is not available in the current environment. Basic video upload and AI analysis are still available.'
  }
  if (config.environment === 'vercel' && error.includes('timeout')) {
    return 'Video processing exceeded time limit. For larger videos, please use our Railway deployment.'
  }
  return error
}

/**
 * Environment info for debugging
 */
export function getEnvironmentInfo() {
  const config = getEnvironmentConfig()
  const featureFlags = getFeatureFlags()
  const validation = validateEnvironment()
  
  return {
    environment: config.environment,
    config,
    featureFlags,
    validation,
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    environmentVariables: {
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      USE_MOCK_DOWNLOADER: process.env.USE_MOCK_DOWNLOADER
    }
  }
}