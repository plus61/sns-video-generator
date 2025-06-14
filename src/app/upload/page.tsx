'use client'

import { useState, Suspense, useEffect } from 'react'
import { Header } from '@/components/ui/Header'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { measureComponentRender } from '@/lib/performance-monitor'

function UploadContent() {
  const { user } = useAuth({ required: true })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const stopMeasurement = measureComponentRender('UploadPage')
    return stopMeasurement
  }, [])

  const handleUploadComplete = (videoId: string) => {
    // Navigate to analysis page with video ID
    window.location.href = `/analyze/${videoId}`
  }

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress)
  }

  // Protected route handles authentication automatically

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            動画をアップロード
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            長尺動画をアップロードして、AIがエンゲージメントの高いショート動画を自動抽出します
          </p>
        </div>

        <VideoUploader
          onUploadComplete={handleUploadComplete}
          onUploadProgress={handleUploadProgress}
          onUploadStart={() => setIsUploading(true)}
          onUploadEnd={() => setIsUploading(false)}
        />

        {isUploading && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                アップロード中...
              </h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {Math.round(uploadProgress)}% 完了
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              1. 動画をアップロード
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              ローカルファイルまたはYouTube URLから動画をアップロード
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              2. AI解析
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              音声認識と映像解析でコンテンツを自動分析
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              3. ショート動画生成
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              エンゲージメントの高いセグメントを自動抽出
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Upload() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <UploadContent />
      </Suspense>
    </ProtectedRoute>
  )
}