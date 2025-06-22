'use client'

import { useState } from 'react'

export default function TestSplitPage() {
  const [videoId, setVideoId] = useState('')
  const [status, setStatus] = useState('')
  const [clips, setClips] = useState<Array<{ url: string; start: number; end: number }>>([])

  const handleSplit = async () => {
    if (!videoId) return

    setStatus('Splitting video into 10-second clips...')
    
    try {
      const response = await fetch('/api/split-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId,
          clipDuration: 10, // 10 seconds per clip
          maxClips: 3 // Create 3 clips
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Split failed')
      }

      setStatus('Split complete!')
      setClips(data.clips)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Split Test</h1>
      
      <div className="space-y-4">
        {/* Video ID Input */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">1. Enter Video ID</h2>
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Video ID from upload/YouTube download"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleSplit}
            disabled={!videoId}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Split into 3x10s clips
          </button>
        </div>

        {/* Status */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Status</h2>
          <p>{status}</p>
        </div>

        {/* Clips */}
        {clips.length > 0 && (
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">2. Generated Clips</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clips.map((clip, index) => (
                <div key={index} className="border p-2 rounded">
                  <h3 className="font-medium mb-1">Clip {index + 1}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {clip.start}s - {clip.end}s
                  </p>
                  <video
                    controls
                    src={clip.url}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}