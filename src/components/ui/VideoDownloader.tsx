'use client'

import { useState } from 'react'

interface VideoDownloaderProps {
  videoBlob: Blob | null
  projectTitle: string
  onClose?: () => void
}

export function VideoDownloader({ videoBlob, projectTitle, onClose }: VideoDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadVideo = async (format: 'webm' | 'mp4' = 'webm') => {
    if (!videoBlob) return

    setIsDownloading(true)
    
    try {
      const finalBlob = videoBlob

      // For MP4 conversion, we would need server-side conversion
      // For now, we'll download as WebM which is natively supported
      if (format === 'mp4') {
        // In production, you would send the blob to a server endpoint
        // that converts WebM to MP4 using FFmpeg
        console.log('MP4 conversion would happen server-side')
      }

      // Create download link
      const url = URL.createObjectURL(finalBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const shareVideo = async () => {
    if (!videoBlob || !navigator.share) {
      alert('Sharing not supported on this device')
      return
    }

    try {
      const file = new File([videoBlob], `${projectTitle}.webm`, { type: 'video/webm' })
      
      await navigator.share({
        title: projectTitle,
        text: 'Check out this AI-generated video!',
        files: [file]
      })
    } catch (error) {
      console.error('Sharing failed:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        alert('Sharing failed. Please try downloading instead.')
      }
    }
  }

  const copyVideoUrl = async () => {
    if (!videoBlob) return

    try {
      const url = URL.createObjectURL(videoBlob)
      await navigator.clipboard.writeText(url)
      alert('Video URL copied to clipboard!')
    } catch (error) {
      console.error('Copy failed:', error)
      alert('Failed to copy URL')
    }
  }

  if (!videoBlob) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No video available for download
        </p>
      </div>
    )
  }

  const videoUrl = URL.createObjectURL(videoBlob)
  const videoSizeMB = (videoBlob.size / (1024 * 1024)).toFixed(2)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Video Ready!
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Video Preview */}
      <div className="mb-6">
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg"
          style={{ maxHeight: '300px' }}
        >
          Your browser does not support the video tag.
        </video>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Size: {videoSizeMB} MB
        </p>
      </div>

      {/* Download Options */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => downloadVideo('webm')}
            disabled={isDownloading}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Download WebM
          </button>

          <button
            onClick={() => downloadVideo('mp4')}
            disabled={isDownloading}
            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download MP4
          </button>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(typeof navigator !== 'undefined' && 'share' in navigator) && (
            <button
              onClick={shareVideo}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Video
            </button>
          )}

          <button
            onClick={copyVideoUrl}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy URL
          </button>
        </div>
      </div>

      {/* Format Information */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Format Information:
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>WebM:</strong> Smaller file size, good for web sharing</li>
          <li>• <strong>MP4:</strong> Better compatibility across devices and platforms</li>
          <li>• <strong>Share:</strong> Direct sharing to social media apps (mobile only)</li>
        </ul>
      </div>
    </div>
  )
}