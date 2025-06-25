'use client'

import { useState } from 'react'

export default function TestRailwayPage() {
  const [status, setStatus] = useState<string>('待機中...')
  const [results, setResults] = useState<string[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [error, setError] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sns-video-generator.up.railway.app'

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testYoutubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      setError('YouTube URLを入力してください')
      return
    }

    setStatus('YouTube動画を処理中...')
    setError('')
    addResult('YouTube処理開始')
    
    try {
      const response = await fetch(`${API_URL}/api/upload-youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      })
      
      addResult(`レスポンス: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        addResult(`成功: ${JSON.stringify(data)}`)
      } else {
        const text = await response.text()
        
        // Railway特有のエラーハンドリング
        if (text.includes('FFmpeg') || text.includes('ffmpeg')) {
          setError('動画処理エラー: FFmpegの設定を確認中です。しばらくお待ちください。')
        } else if (response.status === 500) {
          setError('サーバーエラー: 再試行してください。問題が続く場合はサポートにお問い合わせください。')
        } else if (response.status === 404) {
          setError('APIエンドポイントが見つかりません。設定を確認中です。')
        } else {
          setError(`エラー: ${text.substring(0, 100)}`)
        }
        
        addResult(`エラー詳細: ${text.substring(0, 200)}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        setError('サービスに接続できません。しばらくお待ちください。')
        addResult(`接続エラー: ${error.message}`)
      }
    }
    
    setStatus('完了')
  }

  const testHealth = async () => {
    setStatus('ヘルスチェック中...')
    addResult('ヘルスチェック開始')
    
    try {
      const response = await fetch(`${API_URL}/api/health`)
      addResult(`レスポンス: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.text()
        addResult(`ヘルス状態: ${data}`)
        setError('')
      } else {
        setError('APIヘルスチェックに失敗しました')
      }
    } catch (error) {
      setError('APIに接続できません')
      addResult(`例外: ${error}`)
    }
    
    setStatus('完了')
  }

  const testSimpleProcess = async () => {
    setStatus('動画処理テスト中...')
    addResult('シンプル処理開始')
    
    try {
      const response = await fetch(`${API_URL}/api/process-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        })
      })
      
      addResult(`レスポンス: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        addResult(`成功: セグメント数 = ${data.segments?.length || 0}`)
      } else {
        const text = await response.text()
        setError(`処理エラー: ${text.substring(0, 100)}`)
        addResult(`エラー: ${text.substring(0, 200)}`)
      }
    } catch (error) {
      setError('処理中にエラーが発生しました')
      addResult(`例外: ${error}`)
    }
    
    setStatus('完了')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Railway UI接続テスト</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          API URL: <code className="bg-blue-100 px-2 py-1 rounded">{API_URL}</code>
        </p>
      </div>

      {/* YouTube URL入力 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          YouTube URL（オプション）
        </label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* ステータス表示 */}
      <div className="mb-6">
        <p className="text-lg">ステータス: <span className="font-semibold">{status}</span></p>
      </div>

      {/* テストボタン */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={testHealth}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          ヘルスチェック
        </button>
        
        <button
          onClick={testYoutubeUpload}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          YouTube処理テスト
        </button>
        
        <button
          onClick={testSimpleProcess}
          className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          シンプル処理テスト
        </button>
      </div>

      {/* 結果表示 */}
      <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
        <h3 className="font-semibold mb-2">テスト結果:</h3>
        {results.length === 0 ? (
          <p className="text-gray-500">まだテストが実行されていません</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <p key={index} className="text-sm font-mono">{result}</p>
            ))}
          </div>
        )}
      </div>

      {/* チェックリスト */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-3">動作確認チェックリスト:</h3>
        <ul className="space-y-2">
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>YouTube URL入力フォームが表示される</span>
          </li>
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>「処理開始」ボタンが機能する</span>
          </li>
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>エラー時に適切なメッセージが表示される</span>
          </li>
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>ローディング状態が正しく表示される</span>
          </li>
        </ul>
      </div>
    </div>
  )
}