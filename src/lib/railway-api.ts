'use client'

// Railway API Configuration and Client

interface RailwayApiConfig {
  baseUrl: string
  timeout: number
  retries: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

interface AuthTokens {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

class RailwayApiClient {
  private config: RailwayApiConfig
  private authTokens: AuthTokens = {}

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'http://localhost:3001',
      timeout: 30000, // 30 seconds
      retries: 3
    }
  }

  // Set authentication tokens
  setAuthTokens(tokens: AuthTokens) {
    this.authTokens = tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('railway_auth_tokens', JSON.stringify(tokens))
    }
  }

  // Get authentication tokens
  getAuthTokens(): AuthTokens {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('railway_auth_tokens')
      if (stored) {
        this.authTokens = JSON.parse(stored)
      }
    }
    return this.authTokens
  }

  // Clear authentication tokens
  clearAuthTokens() {
    this.authTokens = {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('railway_auth_tokens')
    }
  }

  // Check if token is expired
  private isTokenExpired(): boolean {
    const tokens = this.getAuthTokens()
    if (!tokens.expiresAt) return false
    return Date.now() > tokens.expiresAt
  }

  // Get default headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const tokens = this.getAuthTokens()
    if (tokens.accessToken && !this.isTokenExpired()) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`
    }

    return headers
  }

  // Make API request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          this.clearAuthTokens()
          throw new Error('認証が必要です。再度ログインしてください。')
        }

        // Handle other HTTP errors
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      // Retry logic
      if (retryCount < this.config.retries && !this.isAbortError(error)) {
        await this.delay(Math.pow(2, retryCount) * 1000) // Exponential backoff
        return this.makeRequest(endpoint, options, retryCount + 1)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Check if error is abort error
  private isAbortError(error: any): boolean {
    return error.name === 'AbortError' || error.message?.includes('aborted')
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // API Methods

  // Authentication
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: any, tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: any, tokens: AuthTokens }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    if (response.success && response.data?.tokens) {
      this.setAuthTokens(response.data.tokens)
    }

    return response
  }

  async signOut(): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/signout', {
      method: 'POST'
    })

    this.clearAuthTokens()
    return response
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string, timestamp: string }>> {
    return this.makeRequest('/api/health')
  }

  // Database Test
  async testDatabase(): Promise<ApiResponse<{ connected: boolean, latency: number }>> {
    return this.makeRequest('/api/test-supabase')
  }

  async testDatabaseCRUD(action: 'create' | 'read' | 'update' | 'delete', data?: any): Promise<ApiResponse> {
    return this.makeRequest('/api/test-db', {
      method: action === 'read' ? 'GET' : 'POST',
      body: action !== 'read' ? JSON.stringify({ action, data }) : undefined
    })
  }

  // Video Operations
  async uploadVideo(formData: FormData): Promise<ApiResponse<{ videoId: string }>> {
    return this.makeRequest('/api/upload-video', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  async uploadYouTubeVideo(url: string): Promise<ApiResponse<{ videoId: string }>> {
    return this.makeRequest('/api/upload-youtube', {
      method: 'POST',
      body: JSON.stringify({ url })
    })
  }

  async analyzeVideo(videoId: string): Promise<ApiResponse<{ analysisId: string }>> {
    return this.makeRequest('/api/analyze-video', {
      method: 'POST',
      body: JSON.stringify({ videoId })
    })
  }

  async getVideoProjects(): Promise<ApiResponse<{ projects: any[] }>> {
    return this.makeRequest('/api/video-projects')
  }

  async getVideoUploads(): Promise<ApiResponse<{ uploads: any[] }>> {
    return this.makeRequest('/api/video-uploads')
  }

  async getUserUsage(): Promise<ApiResponse<{ usage: any }>> {
    return this.makeRequest('/api/user-usage')
  }

  // Settings
  async getUserProfile(): Promise<ApiResponse<{ profile: any }>> {
    return this.makeRequest('/api/user/profile')
  }

  async updateUserProfile(profile: any): Promise<ApiResponse> {
    return this.makeRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    })
  }

  async updateApiSettings(settings: any): Promise<ApiResponse> {
    return this.makeRequest('/api/user/api-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse> {
    return this.makeRequest('/api/user/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  // Connection Status
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck()
      return response.success
    } catch {
      return false
    }
  }

  // Get API configuration
  getConfig(): RailwayApiConfig {
    return { ...this.config }
  }

  // Update API base URL
  updateBaseUrl(baseUrl: string) {
    this.config.baseUrl = baseUrl
  }
}

// Create singleton instance
const railwayApi = new RailwayApiClient()

// Export for use in components
export { railwayApi, type ApiResponse, type AuthTokens, type RailwayApiConfig }

// Hook for using Railway API in React components
export const useRailwayApi = () => {
  return railwayApi
}

// Connection status hook
import { useState, useEffect } from 'react'

export const useRailwayConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const connected = await railwayApi.checkConnection()
      setIsConnected(connected)
    } catch {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { isConnected, isChecking, checkConnection }
}