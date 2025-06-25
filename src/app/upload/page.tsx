'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoUpload from '../../components/VideoUpload'

export default function UploadPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUploadComplete = (videoId: string) => {
    setSuccess(true)
    setError(null)
    
    // Redirect to analyze page after 2 seconds
    setTimeout(() => {
      router.push(`/analyze/${videoId}`)
    }, 2000)
  }

  const handleError = (error: Error | string) => {
    // エラーメッセージを処理
    const errorMessage = error instanceof Error ? error.message : error
    setError(errorMessage)
    setSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            動画をアップロード
          </h1>
          <p className="text-lg text-gray-600">
            ローカルファイルまたはYouTube URLから動画をインポート
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 max-w-2xl mx-auto bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  アップロード成功！解析ページへ移動します...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Upload Component */}
        <VideoUpload
          onUploadComplete={handleUploadComplete}
          onError={handleError}
        />

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              高速アップロード
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              最大500MBの動画を高速でアップロード
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              YouTube対応
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              YouTube URLから直接インポート可能
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              AI自動解析
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              アップロード後、自動でAI解析開始
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}