'use client'

import { useState, useEffect } from 'react'

interface ProgressBarProps {
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error'
  message?: string
  showPercentage?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({ 
  progress, 
  status, 
  message, 
  showPercentage = true, 
  animated = true,
  size = 'md'
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(current => {
        const diff = progress - current
        if (Math.abs(diff) < 0.1) {
          clearInterval(interval)
          return progress
        }
        return current + (diff * 0.1)
      })
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [progress])

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'analyzing':
        return 'bg-purple-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return '📤'
      case 'processing':
        return '⚙️'
      case 'analyzing':
        return '🧠'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'uploading':
        return 'アップロード中...'
      case 'processing':
        return '動画を処理中...'
      case 'analyzing':
        return 'AI解析中...'
      case 'completed':
        return '完了しました！'
      case 'error':
        return 'エラーが発生しました'
      default:
        return '待機中...'
    }
  }

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className="w-full">
      {/* Status Message */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${textSizeClasses[size]}`}>
            {getStatusMessage()}
          </span>
        </div>
        
        {showPercentage && (
          <span className={`font-semibold text-gray-600 dark:text-gray-400 ${textSizeClasses[size]}`}>
            {Math.round(displayProgress)}%
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${getStatusColor()} ${
            animated && status !== 'completed' && status !== 'error' ? 'animate-pulse' : ''
          }`}
          style={{ 
            width: `${Math.max(0, Math.min(100, displayProgress))}%`,
            transition: animated ? 'width 0.3s ease-out' : 'none'
          }}
        />
      </div>

      {/* Processing Animation for Indeterminate States */}
      {(status === 'processing' || status === 'analyzing') && progress === 0 && (
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]} mt-1`}>
          <div className={`${sizeClasses[size]} bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer`} />
        </div>
      )}
      
      {/* Time Estimate */}
      {status === 'uploading' && progress > 0 && progress < 100 && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          推定残り時間: {Math.max(1, Math.ceil((100 - progress) / Math.max(1, progress) * 2))}分
        </div>
      )}
      
      {status === 'analyzing' && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          AI解析は通常5-10分程度かかります
        </div>
      )}
    </div>
  )
}