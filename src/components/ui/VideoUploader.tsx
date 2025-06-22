'use client'

import { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { performanceMonitor } from '../../lib/performance-monitor'
import { ProgressBar } from './ProgressBar'
import { ErrorAlert } from './ErrorAlert'

interface VideoUploaderProps {
  onUploadComplete: (videoId: string) => void
  onUploadProgress?: (progress: number) => void
  onUploadStart?: () => void
  onUploadEnd?: () => void
}

export function VideoUploader({
  onUploadComplete,
  onUploadProgress,
  onUploadStart,
  onUploadEnd
}: VideoUploaderProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error'>('idle')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setUploadStatus('uploading')
    onUploadStart?.()

    try {
      await performanceMonitor.measureAsyncOperation('video_upload', async () => {
        // Validate file
        if (!file.type.startsWith('video/')) {
          throw new Error('選択されたファイルは動画ファイルではありません')
        }

        // Create FormData
        const formData = new FormData()
        formData.append('video', file)
        formData.append('filename', file.name)
        formData.append('filesize', file.size.toString())

        // Upload with progress tracking using Promise wrapper
        return new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(progress)
              onUploadProgress?.(progress)
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText)
              setUploadProgress(100)
              setUploadStatus('processing')
              setTimeout(() => {
                setUploadStatus('completed')
                onUploadComplete(response.videoId)
              }, 1000)
              resolve()
            } else {
              setUploadStatus('error')
              reject(new Error('アップロードに失敗しました'))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('ネットワークエラーが発生しました'))
          })

          xhr.open('POST', '/api/upload-video')
          xhr.send(formData)
        })
      }, { fileSize: file.size.toString(), fileName: file.name })

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'アップロードエラーが発生しました')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
      onUploadEnd?.()
    }
  }, [onUploadComplete, onUploadProgress, onUploadStart, onUploadEnd])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0])
    }
  }, [handleFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    disabled: isUploading
  })

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      setError('YouTube URLを入力してください')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setUploadStatus('processing')
    onUploadStart?.()

    try {
      await performanceMonitor.measureAsyncOperation('youtube_upload', async () => {
        const response = await fetch('/api/upload-youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: youtubeUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || errorData.message || 'YouTube動画の取得に失敗しました')
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        setUploadStatus('completed')
        onUploadComplete(data.videoId)
      }, { url: youtubeUrl })

    } catch (error) {
      console.error('YouTube upload error:', error)
      setError(error instanceof Error ? error.message : 'YouTube動画の処理でエラーが発生しました')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
      onUploadEnd?.()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Mode Tabs */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setUploadMode('file')}
          className={`py-2 px-4 font-medium transition-colors duration-200 ${
            uploadMode === 'file'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          ファイルアップロード
        </button>
        <button
          onClick={() => setUploadMode('url')}
          className={`py-2 px-4 font-medium transition-colors duration-200 ${
            uploadMode === 'url'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          YouTube URL
        </button>
      </div>

      {/* Progress Bar */}
      {(isUploading || uploadStatus !== 'idle') && (
        <div className="mb-6">
          <ProgressBar 
            progress={uploadProgress}
            status={uploadStatus}
            size="md"
            animated={true}
          />
        </div>
      )}

      {/* Error Display - Enhanced */}
      {error && (
        <div className="mb-6">
          <ErrorAlert
            error={error}
            variant="error"
            title="アップロードエラー"
            onClose={() => {
              setError(null)
              setUploadStatus('idle')
              setUploadProgress(0)
            }}
            actionLabel="再試行"
            onAction={() => {
              setError(null)
              setUploadStatus('idle')
              setUploadProgress(0)
              // Re-trigger upload if we have a file
              if (uploadMode === 'file' && fileInputRef.current?.files?.[0]) {
                handleFileUpload(fileInputRef.current.files[0])
              } else if (uploadMode === 'url' && youtubeUrl.trim()) {
                handleYouTubeUpload()
              }
            }}
          />
        </div>
      )}

      {uploadMode === 'file' ? (
        /* File Upload Mode */
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer transform ${
              isDragActive || dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg'
                : isUploading 
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                isDragActive || dragActive 
                  ? 'bg-blue-100 dark:bg-blue-900/30 animate-bounce' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {isUploading ? (
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : (
                  <svg className={`w-8 h-8 transition-colors duration-300 ${
                    isDragActive || dragActive ? 'text-blue-500' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isUploading 
                    ? 'アップロード中です...' 
                    : isDragActive || dragActive 
                      ? '📁 動画をドロップしてください' 
                      : '🎬 動画ファイルをドラッグ&ドロップ'
                  }
                </p>
                {!isUploading && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    または
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 ml-1 underline transition-colors duration-200"
                    >
                      ファイルを選択
                    </button>
                  </p>
                )}
              </div>
              
              {!isUploading && (
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="flex items-center justify-center gap-2">
                    <span>📹</span> MP4, AVI, MOV, MKV, WebM
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span>💾</span> 最大サイズ: 5GB
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleFileSelect}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isUploading ? 'アップロード中...' : 'ファイルを選択してアップロード'}
          </button>
        </div>
      ) : (
        /* YouTube URL Mode */
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  YouTube URLから動画を取得
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  YouTube動画のURLを入力して、自動で動画をダウンロード・解析します
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleYouTubeUpload}
            disabled={isUploading || !youtubeUrl.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isUploading ? 'YouTube動画を取得中...' : 'YouTube動画を取得'}
          </button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 動画アップロードのコツ
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• 10分以上の長尺動画がおすすめです</li>
          <li>• 話し声がクリアに録音されている動画が最適です</li>
          <li>• 教育・エンターテイメント・解説系コンテンツで効果的です</li>
          <li>• アップロード完了後、AI解析に5-10分程度かかります</li>
        </ul>
      </div>
    </div>
  )
}