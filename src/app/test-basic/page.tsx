'use client'

import { useState } from 'react'

export default function TestPage() {
  const [status, setStatus] = useState<string>('待機中...')
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testUpload = async () => {
    setStatus('アップロードテスト中...')
    addResult('アップロードテスト開始')
    
    const file = new File(['test content'], 'test.mp4', { type: 'video/mp4' })
    const formData = new FormData()
    formData.append('video', file)
    
    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      })
      
      addResult(`レスポンス: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        addResult(`成功: ${JSON.stringify(data)}`)
      } else {
        const text = await response.text()
        addResult(`エラー: ${text.substring(0, 100)}`)
      }
    } catch (error) {
      addResult(`例外: ${error}`)
    }
    
    setStatus('完了')
  }

  const testHealth = async () => {
    setStatus('ヘルスチェック中...')
    addResult('ヘルスチェック開始')
    
    try {
      const response = await fetch('/api/health')
      addResult(`レスポンス: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const text = await response.text()
        addResult(`結果: ${text}`)
      }
    } catch (error) {
      addResult(`例外: ${error}`)
    }
    
    setStatus('完了')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">基本動作確認ページ</h1>
      
      <div className="mb-4">
        <p className="text-lg">ステータス: {status}</p>
      </div>
      
      <div className="space-x-4 mb-8">
        <button
          onClick={testHealth}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          ヘルスチェック
        </button>
        
        <button
          onClick={testUpload}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          アップロードテスト
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">結果ログ:</h2>
        <div className="space-y-1">
          {results.map((result, index) => (
            <div key={index} className="text-sm font-mono">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}