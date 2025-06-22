'use client'

import { useState } from 'react'
import { supabaseClient } from '../../../lib/supabase-storage'

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  // Simple upload test
  const handleUpload = async () => {
    if (!file) return

    setStatus('Uploading...')
    const fileName = `test/${Date.now()}_${file.name}`

    const { data, error } = await supabaseClient.storage
      .from('videos')
      .upload(fileName, file)

    if (error) {
      setStatus(`Upload error: ${error.message}`)
      return
    }

    setStatus('Upload success!')
    setUploadUrl(fileName)

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('videos')
      .getPublicUrl(fileName)

    setDownloadUrl(publicUrl)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Storage Test</h1>
      
      <div className="space-y-4">
        {/* Upload Test */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">1. Upload Test</h2>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />
          <button
            onClick={handleUpload}
            disabled={!file}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Upload
          </button>
        </div>

        {/* Status */}
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Status</h2>
          <p>{status}</p>
        </div>

        {/* Download Test */}
        {downloadUrl && (
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">2. Download Test</h2>
            <p className="text-sm mb-2">URL: {downloadUrl}</p>
            <video
              controls
              src={downloadUrl}
              className="w-full max-w-md"
            />
          </div>
        )}
      </div>
    </div>
  )
}