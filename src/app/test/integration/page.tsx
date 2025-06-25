'use client'

import { useState } from 'react'
import { VideoUploader } from '@/components/ui/VideoUploader'

export default function IntegrationTestPage() {
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  const [uploadHistory, setUploadHistory] = useState<Array<{
    videoId: string
    timestamp: string
    type: string
  }>>([])

  const handleUploadComplete = (videoId: string) => {
    console.log('Upload completed:', videoId)
    setUploadedVideoId(videoId)
    setUploadHistory(prev => [...prev, {
      videoId,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
      type: 'file'
    }])
  }

  const handleUploadProgress = (progress: number) => {
    console.log('Upload progress:', progress)
  }

  const handleUploadStart = () => {
    console.log('Upload started')
  }

  const handleUploadEnd = () => {
    console.log('Upload ended')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 統合テストページ
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Worker1 バックエンド × Worker2 フロントエンド統合
            </p>
          </div>

          {/* Video Uploader */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              動画アップロード（統合版）
            </h2>
            <VideoUploader
              onUploadComplete={handleUploadComplete}
              onUploadProgress={handleUploadProgress}
              onUploadStart={handleUploadStart}
              onUploadEnd={handleUploadEnd}
            />
          </div>

          {/* Upload Result */}
          {uploadedVideoId && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ アップロード成功！
              </h3>
              <div className="space-y-2">
                <p className="text-green-800 dark:text-green-200">
                  Video ID: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{uploadedVideoId}</code>
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  動画が正常にアップロードされ、処理が開始されました。
                </p>
              </div>
            </div>
          )}

          {/* Upload History */}
          {uploadHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📋 アップロード履歴
              </h3>
              <div className="space-y-3">
                {uploadHistory.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.videoId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.timestamp} - {item.type}
                      </p>
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Info */}
          <div className="mt-12 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              🔧 技術仕様
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• API: POST /api/upload-file (FormData)</li>
              <li>• SSE: GET /api/upload-progress?videoId={'{id}'}</li>
              <li>• リアルタイム進捗表示（EventSource）</li>
              <li>• 自動再接続（最大3回）</li>
              <li>• キャンセル機能（AbortController）</li>
              <li>• エラーハンドリング（APIError型）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}