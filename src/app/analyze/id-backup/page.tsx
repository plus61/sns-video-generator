'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { VideoAnalysisStatus } from '@/components/ui/VideoAnalysisStatus'
import { SegmentsList } from '@/components/ui/SegmentsList'
import type { VideoUpload, VideoSegment } from '@/types'

function AnalyzeContent() {
  const { user, isLoading: authLoading } = useAuth({ required: true })
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string

  const [videoUpload, setVideoUpload] = useState<VideoUpload | null>(null)
  const [segments, setSegments] = useState<VideoSegment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideoData = useCallback(async () => {
    try {
      const response = await fetch(`/api/video-uploads/${videoId}`)
      if (!response.ok) {
        throw new Error('動画データの取得に失敗しました')
      }

      const data = await response.json()
      setVideoUpload(data.video)
      setSegments(data.segments || [])
    } catch (error) {
      console.error('Error fetching video data:', error)
      setError(error instanceof Error ? error.message : '動画データの取得でエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    if (!authLoading && user && videoId) {
      fetchVideoData()
    }
  }, [authLoading, user, videoId, fetchVideoData])

  const pollAnalysisStatus = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video-uploads/${videoId}`)
        if (response.ok) {
          const data = await response.json()
          setVideoUpload(data.video)
          
          if (data.video.status === 'completed') {
            setSegments(data.segments || [])
            clearInterval(interval)
          } else if (data.video.status === 'error') {
            setError(data.video.error_message || '動画解析でエラーが発生しました')
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Error polling status:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => clearInterval(interval), 300000)
  }, [videoId])

  const startAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) {
        throw new Error('動画解析の開始に失敗しました')
      }

      // Poll for status updates
      pollAnalysisStatus()
    } catch (error) {
      console.error('Error starting analysis:', error)
      setError(error instanceof Error ? error.message : '動画解析の開始でエラーが発生しました')
    }
  }, [videoId, pollAnalysisStatus])



  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              アップロードページに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            動画解析
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AIが動画を分析して、エンゲージメントの高いセグメントを抽出します
          </p>
        </div>

        {videoUpload && (
          <VideoAnalysisStatus 
            videoUpload={videoUpload}
            onRetryAnalysis={startAnalysis}
          />
        )}

        {segments.length > 0 && (
          <div className="mt-8">
            <SegmentsList 
              segments={segments}
              videoUpload={videoUpload}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  )
}