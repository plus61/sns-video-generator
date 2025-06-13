'use client'

import { VideoUpload } from '@/types'
import { AnalysisData } from '@/types/analysis-data'

interface VideoAnalysisStatusProps {
  videoUpload: VideoUpload
  onRetryAnalysis?: () => void
}

export function VideoAnalysisStatus({ videoUpload, onRetryAnalysis }: VideoAnalysisStatusProps) {
  const getStatusInfo = (status: VideoUpload['status']) => {
    switch (status) {
      case 'uploaded':
        return {
          icon: '📁',
          title: 'アップロード完了',
          description: '動画のアップロードが完了しました',
          color: 'blue',
          showAction: true
        }
      case 'pending_download':
        return {
          icon: '⏳',
          title: 'ダウンロード待機中',
          description: 'YouTube動画のダウンロード処理を待機しています',
          color: 'yellow',
          showAction: false
        }
      case 'processing':
        return {
          icon: '🔄',
          title: '動画処理中',
          description: '動画ファイルを処理しています',
          color: 'blue',
          showAction: false
        }
      case 'ready_for_analysis':
        return {
          icon: '✅',
          title: '解析準備完了',
          description: '動画の解析準備が完了しました',
          color: 'green',
          showAction: true
        }
      case 'analyzing':
        return {
          icon: '🧠',
          title: 'AI解析中',
          description: 'Whisper音声認識とGPT-4分析を実行中です',
          color: 'purple',
          showAction: false
        }
      case 'completed':
        return {
          icon: '🎉',
          title: '解析完了',
          description: 'セグメント抽出と分析が完了しました',
          color: 'green',
          showAction: false
        }
      case 'error':
        return {
          icon: '❌',
          title: 'エラーが発生',
          description: videoUpload.error_message || '不明なエラーが発生しました',
          color: 'red',
          showAction: true
        }
      default:
        return {
          icon: '❓',
          title: '不明な状態',
          description: '状態を確認できません',
          color: 'gray',
          showAction: false
        }
    }
  }

  const statusInfo = getStatusInfo(videoUpload.status)
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      button: 'bg-green-600 hover:bg-green-700'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-800 dark:text-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      button: 'bg-red-600 hover:bg-red-700'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      button: 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const colors = colorClasses[statusInfo.color as keyof typeof colorClasses]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Video Info Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {videoUpload.original_filename || 'YouTube動画'}
            </h2>
            {videoUpload.file_size && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                サイズ: {(videoUpload.file_size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            {videoUpload.duration && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                長さ: {Math.floor(videoUpload.duration / 60)}分{videoUpload.duration % 60}秒
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              アップロード: {new Date(videoUpload.created_at).toLocaleDateString('ja-JP')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              更新: {new Date(videoUpload.updated_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className={`px-6 py-6 ${colors.bg} ${colors.border} border-l-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{statusInfo.icon}</div>
            <div>
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {statusInfo.title}
              </h3>
              <p className={`text-sm ${colors.text} opacity-90`}>
                {statusInfo.description}
              </p>
            </div>
          </div>

          {statusInfo.showAction && onRetryAnalysis && (
            <div>
              {videoUpload.status === 'error' ? (
                <button
                  onClick={onRetryAnalysis}
                  className={`px-4 py-2 ${colors.button} text-white rounded-lg font-medium transition-colors duration-200`}
                >
                  再試行
                </button>
              ) : (videoUpload.status === 'uploaded' || videoUpload.status === 'ready_for_analysis') ? (
                <button
                  onClick={onRetryAnalysis}
                  className={`px-4 py-2 ${colors.button} text-white rounded-lg font-medium transition-colors duration-200`}
                >
                  解析開始
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Progress indicator for analyzing state */}
        {videoUpload.status === 'analyzing' && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                解析進行中...
              </span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              通常5-10分程度で完了します
            </p>
          </div>
        )}

        {/* Analysis results summary */}
        {videoUpload.status === 'completed' && videoUpload.analysis_data && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(videoUpload.analysis_data as unknown as AnalysisData)?.segments_count || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">セグメント</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(videoUpload.analysis_data as unknown as AnalysisData)?.language?.toUpperCase() || 'N/A'}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">言語</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(videoUpload.analysis_data as unknown as AnalysisData)?.duration ? `${Math.floor((videoUpload.analysis_data as unknown as AnalysisData).duration / 60)}:${((videoUpload.analysis_data as unknown as AnalysisData).duration % 60).toFixed(0).padStart(2, '0')}` : 'N/A'}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">音声時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(videoUpload.analysis_data as unknown as AnalysisData)?.confidence_avg ? ((videoUpload.analysis_data as unknown as AnalysisData).confidence_avg * 100).toFixed(0) + '%' : 'N/A'}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">信頼度</div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Preview */}
      {videoUpload.transcript && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            転写テキストプレビュー
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {videoUpload.transcript.length > 200 
                ? videoUpload.transcript.substring(0, 200) + '...'
                : videoUpload.transcript
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}