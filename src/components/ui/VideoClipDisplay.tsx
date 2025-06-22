'use client'

import { useState } from 'react'

interface VideoClip {
  id: string
  title: string
  startTime: number
  endTime: number
  duration: number
  videoUrl: string
  thumbnailUrl?: string
}

interface VideoClipDisplayProps {
  clips: VideoClip[]
  onDownload?: (clipId: string) => void
}

export function VideoClipDisplay({ clips, onDownload }: VideoClipDisplayProps) {
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null)

  const handlePlay = (clipId: string) => {
    setPlayingClipId(clipId === playingClipId ? null : clipId)
  }

  const handleDownload = async (clip: VideoClip) => {
    setDownloadingClipId(clip.id)
    
    try {
      // 実際のダウンロード処理
      const response = await fetch(clip.videoUrl)
      const blob = await response.blob()
      
      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_')}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      onDownload?.(clip.id)
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      alert('ダウンロードに失敗しました')
    } finally {
      setDownloadingClipId(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // デモ用の固定3クリップ
  const displayClips = clips.length > 0 ? clips : [
    {
      id: 'demo-1',
      title: 'ハイライト 1',
      startTime: 0,
      endTime: 30,
      duration: 30,
      videoUrl: '/demo-video-1.mp4',
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=Clip+1'
    },
    {
      id: 'demo-2',
      title: 'ハイライト 2',
      startTime: 60,
      endTime: 90,
      duration: 30,
      videoUrl: '/demo-video-2.mp4',
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=Clip+2'
    },
    {
      id: 'demo-3',
      title: 'ハイライト 3',
      startTime: 120,
      endTime: 150,
      duration: 30,
      videoUrl: '/demo-video-3.mp4',
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=Clip+3'
    }
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        📹 分割された動画クリップ（{displayClips.length}個）
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayClips.map((clip) => (
          <div
            key={clip.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Video Preview */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
              {playingClipId === clip.id ? (
                <video
                  src={clip.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  onEnded={() => setPlayingClipId(null)}
                />
              ) : (
                <>
                  <img
                    src={clip.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video'}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handlePlay(clip.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Clip Info */}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {clip.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)} 
                  （{formatDuration(clip.duration)}）
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePlay(clip.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {playingClipId === clip.id ? '停止' : '再生'}
                </button>
                <button
                  onClick={() => handleDownload(clip)}
                  disabled={downloadingClipId === clip.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {downloadingClipId === clip.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      処理中...
                    </span>
                  ) : (
                    'ダウンロード'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 使い方の説明 */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          💡 クリップの使い方
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 各クリップは自動で最適な長さに分割されています</li>
          <li>• 再生ボタンでプレビューできます</li>
          <li>• ダウンロードボタンで個別に保存できます</li>
          <li>• SNSに合わせて自由に編集してご利用ください</li>
        </ul>
      </div>
    </div>
  )
}