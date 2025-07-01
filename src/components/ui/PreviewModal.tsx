'use client'

import React, { useEffect, useRef } from 'react'
import { AnimatedButton } from './AnimatedButton'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  segment: {
    id: number
    thumbnail: string
    time: string
    highlight: string
    suggestedCaption?: string
    platforms?: string[]
    score: number
  } | null
  videoTitle?: string
  videoUrl?: string
}

export function PreviewModal({ isOpen, onClose, segment, videoTitle, videoUrl }: PreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !segment) return null

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
        style={{
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">クリップ プレビュー</h2>
            <p className="text-gray-400 text-sm">{videoTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl text-gray-400">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Video Preview */}
          <div className="lg:w-3/5 bg-black flex items-center justify-center relative">
            <div className="aspect-video w-full relative">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  muted
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement
                    const [start, end] = segment.time.split('-').map(t => {
                      const parts = t.split(':').map(Number)
                      return parts.length === 2 ? parts[0] * 60 + parts[1] : 0
                    })
                    video.currentTime = start
                    
                    // Stop at end time
                    video.ontimeupdate = () => {
                      if (video.currentTime >= end) {
                        video.pause()
                        video.currentTime = start
                      }
                    }
                  }}
                />
              ) : (
                <>
                  <img 
                    src={segment.thumbnail}
                    alt="Video preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 cursor-pointer hover:bg-white/30 transition-colors">
                      <span className="text-5xl">▶️</span>
                    </div>
                  </div>
                </>
              )}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">{segment.time}</span>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {segment.score}% バイラル
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:w-2/5 p-6 space-y-6">
            {/* Highlight */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">ハイライト</h3>
              <p className="text-purple-400 font-medium">🌟 {segment.highlight}</p>
            </div>

            {/* Suggested Caption */}
            {segment.suggestedCaption && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">推奨キャプション</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{segment.suggestedCaption}</p>
                  <button 
                    className="mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(segment.suggestedCaption)
                    }}
                  >
                    📋 コピー
                  </button>
                </div>
              </div>
            )}

            {/* Platforms */}
            {segment.platforms && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">推奨プラットフォーム</h3>
                <div className="flex flex-wrap gap-2">
                  {segment.platforms.map((platform) => (
                    <span 
                      key={platform}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300 flex items-center gap-2"
                    >
                      {platform === 'TikTok' && '🎵'}
                      {platform === 'Instagram Reels' && '📷'}
                      {platform === 'YouTube Shorts' && '📺'}
                      {platform === 'Twitter' && '🐦'}
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <AnimatedButton variant="success" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span> このクリップを投稿
                </span>
              </AnimatedButton>
              <AnimatedButton variant="secondary" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <span>✏️</span> 編集してから投稿
                </span>
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}