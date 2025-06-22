'use client'

import { useState } from 'react'

export default function TestYouTubePage() {
  const [url, setUrl] = useState('')
  const [videoId, setVideoId] = useState('')
  const [status, setStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const handleDownload = async () => {
    if (!url) return

    setStatus('Downloading from YouTube...')
    
    try {
      const response = await fetch('/api/upload-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Download failed')
      }

      setStatus('Download started! Video ID: ' + data.videoId)
      setVideoId(data.videoId)

      // Poll for video status
      pollVideoStatus(data.videoId)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const pollVideoStatus = async (id: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/video-uploads?id=' + id)
        const data = await response.json()
        
        if (data.video) {
          setStatus(`Status: ${data.video.status}`)
          
          if (data.video.status === 'ready_for_analysis' && data.video.public_url) {
            setVideoUrl(data.video.public_url)
            setStatus('Download complete!')
            return true
          } else if (data.video.status === 'error') {
            setStatus(`Error: ${data.video.error_message}`)
            return true
          }
        }
        
        return false
      } catch (error) {
        console.error('Poll error:', error)
        return false
      }
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const done = await checkStatus()
      if (done) {
        clearInterval(interval)
      }
    }, 2000)

    // Initial check
    checkStatus()

    // Stop after 2 minutes
    setTimeout(() => clearInterval(interval), 120000)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">YouTube Download Test</h1>
      
      <div className="space-y-4">
        {/* YouTube URL Input */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">1. Enter YouTube URL</h2>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleDownload}
            disabled={!url}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Download
          </button>
        </div>

        {/* Status */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Status</h2>
          <p>{status}</p>
          {videoId && <p className="text-sm text-gray-600">Video ID: {videoId}</p>}
        </div>

        {/* Video Player */}
        {videoUrl && (
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">2. Downloaded Video</h2>
            <video
              controls
              src={videoUrl}
              className="w-full max-w-md"
            />
          </div>
        )}
      </div>
    </div>
  )
}