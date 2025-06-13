'use client'

import { useRouter } from 'next/navigation'
import { VideoUpload } from '@/types'
import { AnalysisData } from '@/types/analysis-data'

interface VideoUploadCardProps {
  upload: VideoUpload
  onUpdate?: () => void
}

export function VideoUploadCard({ upload, onUpdate }: VideoUploadCardProps) {
  const router = useRouter()

  const getStatusInfo = (status: VideoUpload['status']) => {
    switch (status) {
      case 'uploaded':
        return { label: 'アップロード完了', color: 'blue', icon: '📁' }
      case 'pending_download':
        return { label: 'ダウンロード待機', color: 'yellow', icon: '⏳' }
      case 'processing':
        return { label: '処理中', color: 'blue', icon: '🔄' }
      case 'ready_for_analysis':
        return { label: '解析準備完了', color: 'green', icon: '✅' }
      case 'analyzing':
        return { label: 'AI解析中', color: 'purple', icon: '🧠' }
      case 'completed':
        return { label: '解析完了', color: 'green', icon: '🎉' }
      case 'error':
        return { label: 'エラー', color: 'red', icon: '❌' }
      default:
        return { label: '不明', color: 'gray', icon: '❓' }
    }
  }

  const statusInfo = getStatusInfo(upload.status)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleViewAnalysis = () => {
    router.push(`/analyze/${upload.id}`)
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {upload.original_filename || `YouTube Video`}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {upload.upload_source === 'youtube' ? 'YouTube' : 'ファイル'} • {new Date(upload.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            {/* Video Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {upload.file_size && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">サイズ</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(upload.file_size)}
                  </div>
                </div>
              )}
              
              {upload.duration && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">長さ</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDuration(upload.duration)}
                  </div>
                </div>
              )}

              {upload.analysis_data && (upload.analysis_data as unknown as AnalysisData)?.segments_count ? (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">セグメント</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(upload.analysis_data as unknown as AnalysisData).segments_count}
                  </div>
                </div>
              ) : null}

              {upload.analysis_data && (upload.analysis_data as unknown as AnalysisData)?.language ? (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">言語</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(upload.analysis_data as unknown as AnalysisData).language.toUpperCase()}
                  </div>
                </div>
              ) : null}
            </div>

            {/* YouTube URL */}
            {upload.youtube_url && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">YouTube URL</div>
                <a
                  href={upload.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm truncate block"
                >
                  {upload.youtube_url}
                </a>
              </div>
            )}

            {/* Transcript Preview */}
            {upload.transcript && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">転写プレビュー</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded line-clamp-2">
                  {upload.transcript.length > 150 
                    ? upload.transcript.substring(0, 150) + '...'
                    : upload.transcript
                  }
                </p>
              </div>
            )}

            {/* Error Message */}
            {upload.error_message && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">エラー</div>
                <p className="text-sm text-red-700 dark:text-red-300">{upload.error_message}</p>
              </div>
            )}
          </div>

          {/* Status and Actions */}
          <div className="ml-6 flex flex-col items-end gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color as keyof typeof colorClasses]}`}>
              {statusInfo.label}
            </span>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleViewAnalysis}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium transition-colors duration-200"
              >
                詳細を表示
              </button>

              {(upload.status === 'uploaded' || upload.status === 'ready_for_analysis' || upload.status === 'error') && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/analyze-video', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoId: upload.id }),
                      })
                      
                      if (response.ok) {
                        onUpdate?.()
                      }
                    } catch (error) {
                      console.error('Error starting analysis:', error)
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium transition-colors duration-200"
                >
                  {upload.status === 'error' ? '再解析' : '解析開始'}
                </button>
              )}

              {upload.status === 'completed' && (
                <button
                  onClick={() => router.push(`/analyze/${upload.id}`)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md font-medium transition-colors duration-200"
                >
                  セグメント一覧
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Processing Progress */}
        {(upload.status === 'processing' || upload.status === 'analyzing') && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {upload.status === 'processing' ? '動画処理中...' : 'AI解析中...'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {upload.status === 'processing' ? '数分' : '5-10分'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}