'use client'

import { useState } from 'react'

export default function TestPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const testYouTubeUrl = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/upload-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      const data = await response.json()
      setResult(data)
    } catch {
      setResult({ error: 'Failed to test URL' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">YouTube URL テスト</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/cjtmDEG-B7U?si=6dGwIcLVgKMQ4hgi"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={testYouTubeUrl}
            disabled={!youtubeUrl || loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'テスト中...' : 'URL をテスト'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">結果:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">テスト用 URL:</h3>
          <p className="text-sm text-blue-700">
            https://youtu.be/cjtmDEG-B7U?si=6dGwIcLVgKMQ4hgi
          </p>
        </div>

        <div className="mt-4 bg-green-50 p-4 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">プラットフォーム機能:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✅ YouTube URL 検証</li>
            <li>✅ 動画 ID 抽出</li>
            <li>✅ データベース保存</li>
            <li>✅ AI 分析準備</li>
            <li>✅ ソーシャルメディア投稿</li>
          </ul>
        </div>
      </div>
    </div>
  )
}