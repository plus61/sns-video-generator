'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createStorageService } from '../lib/supabase-storage'

interface VideoUploadProps {
  onUploadComplete?: (videoId: string) => void
  onError?: (error: Error) => void
}

export default function VideoUpload({ onUploadComplete, onError }: VideoUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setStatusMessage('Uploading video...')

    try {
      // For now, use a dummy user ID
      const userId = 'test-user-123'
      const storageService = createStorageService(userId)

      const result = await storageService.uploadVideo(file, {
        onProgress: (progress) => {
          setUploadProgress(progress)
        }
      })

      if (result.success && result.videoId) {
        setStatusMessage('Upload complete!')
        onUploadComplete?.(result.videoId)
      } else {
        const errorMessage = result.error || 'Upload failed'
        if (errorMessage.includes('file too large') || errorMessage.includes('size')) {
          throw new Error('📦 ファイルサイズが大きすぎます\n\n✅ 対処法：\n• 最大500MBまでの動画をアップロード\n• 動画を圧縮してから再試行\n• より短い動画を選択')
        } else if (errorMessage.includes('format') || errorMessage.includes('type')) {
          throw new Error('🎬 対応していないファイル形式です\n\n✅ 対応形式：\n• MP4 (推奨)\n• MOV\n• AVI\n• MKV\n\n動画変換ツールで形式を変更してください')
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          throw new Error('🌐 ネットワークエラー\n\n✅ 確認事項：\n• インターネット接続を確認\n• ファイルが大きい場合は安定した接続で再試行\n• VPNを使用中の場合は一時的にオフ')
        }
        throw new Error(result.error || '⚠️ アップロードに失敗しました\n\n再度お試しください')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setStatusMessage('Upload failed')
      const errorToReport = error instanceof Error ? error : new Error('⚠️ アップロードに失敗しました\n\n予期しないエラーが発生しました。\n時間をおいて再度お試しください。')
      onError?.(errorToReport)
    } finally {
      setIsUploading(false)
    }
  }

  // YouTube URL handler
  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) return

    setIsUploading(true)
    setStatusMessage('Downloading from YouTube...')

    try {
      const response = await fetch('/api/upload-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'YouTube download failed'
        if (errorMessage.includes('Invalid URL') || errorMessage.includes('not found')) {
          throw new Error('🔍 動画が見つかりません\n\n✅ 確認事項：\n• URLが正しくコピーされているか\n• 動画が公開されているか\n• 地域制限がないか\n\n例: https://www.youtube.com/watch?v=XXXXXXXXXXX')
        } else if (errorMessage.includes('private') || errorMessage.includes('restricted')) {
          throw new Error('🔒 アクセス制限された動画です\n\n✅ 対処法：\n• 公開動画のURLを使用\n• プライベート動画は事前にダウンロード\n• 年齢制限のない動画を選択')
        } else if (errorMessage.includes('too long') || errorMessage.includes('duration')) {
          throw new Error('⏱️ 動画が長すぎます\n\n✅ 対処法：\n• 60分以内の動画を選択\n• 長い動画は分割してからアップロード\n• ハイライト部分のみを使用')
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          throw new Error('📊 利用制限に達しました\n\n✅ 対処法：\n• 1日のダウンロード制限に達しています\n• 24時間後に再試行\n• プレミアムプランへのアップグレードを検討')
        }
        throw new Error(data.error || '❌ YouTube動画のダウンロードに失敗しました\n\nURLを確認して再度お試しください')
      }

      setStatusMessage('Download started! Processing video...')
      onUploadComplete?.(data.videoId)
    } catch (error) {
      console.error('YouTube upload error:', error)
      setStatusMessage('YouTube download failed')
      const errorToReport = error instanceof Error ? error : new Error('❌ YouTube動画のダウンロードに失敗しました\n\n予期しないエラーが発生しました。\n時間をおいて再度お試しください。')
      onError?.(errorToReport)
    } finally {
      setIsUploading(false)
    }
  }

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Upload Type Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setUploadType('file')}
          className={`px-4 py-2 rounded ${
            uploadType === 'file'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          disabled={isUploading}
        >
          Upload File
        </button>
        <button
          onClick={() => setUploadType('youtube')}
          className={`px-4 py-2 rounded ${
            uploadType === 'youtube'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          disabled={isUploading}
        >
          YouTube URL
        </button>
      </div>

      {/* File Upload */}
      {uploadType === 'file' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the video here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop a video here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: MP4, MOV, AVI, MKV
              </p>
            </div>
          )}
        </div>
      )}

      {/* YouTube URL Input */}
      {uploadType === 'youtube' && (
        <div className="space-y-4">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <button
            onClick={handleYouTubeUpload}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || !youtubeUrl.trim()}
          >
            Download from YouTube
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-700">{statusMessage}</p>
        </div>
      )}
    </div>
  )
}