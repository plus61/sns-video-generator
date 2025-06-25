'use client'

import { useState } from 'react'
import { VideoUploader } from '@/components/ui/VideoUploader'

export default function EmergencyIntegrationTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  
  const addTestResult = (test: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, { test, success, details, timestamp: new Date().toISOString() }])
  }
  
  const testAnalyzeEndpoint = async () => {
    try {
      // Test with mock URL
      const response = await fetch('/api/analyze-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: uploadedVideoId 
            ? `/storage/videos/${uploadedVideoId}?videoId=${uploadedVideoId}`
            : '/test/video.mp4?videoId=test-123' 
        })
      })
      
      const data = await response.json()
      addTestResult('Analyze Endpoint Test', response.ok, data)
    } catch (error) {
      addTestResult('Analyze Endpoint Test', false, error)
    }
  }
  
  const testUploadFlow = async () => {
    try {
      // Create a test file
      const blob = new Blob(['test video content'], { type: 'video/mp4' })
      const file = new File([blob], 'test-video.mp4', { type: 'video/mp4' })
      
      const formData = new FormData()
      formData.append('video', file)
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      addTestResult('Upload Flow Test', response.ok, data)
      
      if (data.videoId) {
        setUploadedVideoId(data.videoId)
      }
    } catch (error) {
      addTestResult('Upload Flow Test', false, error)
    }
  }
  
  const handleUploadComplete = (videoId: string) => {
    setUploadedVideoId(videoId)
    addTestResult('VideoUploader Component', true, { videoId })
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">緊急統合テスト - Worker2</h1>
      
      <div className="grid gap-6">
        {/* Test Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">テスト実行</h2>
          <div className="flex gap-4">
            <button
              onClick={testAnalyzeEndpoint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Analyze APIテスト
            </button>
            <button
              onClick={testUploadFlow}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            >
              Upload Flowテスト
            </button>
          </div>
        </div>
        
        {/* Video Uploader */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">実際のアップロードコンポーネント</h2>
          <VideoUploader onUploadComplete={handleUploadComplete} />
        </div>
        
        {/* Test Results */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">テスト結果</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded ${result.success ? 'bg-green-900' : 'bg-red-900'}`}
              >
                <div className="font-medium">{result.test}</div>
                <div className="text-sm text-gray-300">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
        
        {/* Current State */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">現在の状態</h2>
          <p>Uploaded Video ID: {uploadedVideoId || 'なし'}</p>
        </div>
      </div>
    </div>
  )
}