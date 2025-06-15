'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugSession() {
  const { data: session, status } = useSession()
  const [clientInfo, setClientInfo] = useState<any>(null)

  useEffect(() => {
    // Get client-side information
    setClientInfo({
      userAgent: navigator.userAgent,
      url: window.location.href,
      cookies: document.cookie,
      localStorage: {
        length: localStorage.length,
        keys: Object.keys(localStorage)
      },
      sessionStorage: {
        length: sessionStorage.length,
        keys: Object.keys(sessionStorage)
      }
    })
  }, [])

  const testAuthAPI = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      console.log('API Session:', sessionData)
      alert(`API Session: ${JSON.stringify(sessionData, null, 2)}`)
    } catch (error) {
      console.error('Session API error:', error)
      alert(`Session API Error: ${error}`)
    }
  }

  const testProtectedAPI = async () => {
    try {
      const response = await fetch('/api/debug-auth?debug=true')
      const debugData = await response.json()
      console.log('Debug Data:', debugData)
      alert(`Debug Data: ${JSON.stringify(debugData, null, 2)}`)
    } catch (error) {
      console.error('Debug API error:', error)
      alert(`Debug API Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">認証デバッグページ</h1>
        
        <div className="space-y-8">
          {/* Session Status */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">セッション状態</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</p>
              {session && (
                <div className="bg-gray-100 p-4 rounded">
                  <pre>{JSON.stringify(session, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">クライアント情報</h2>
            {clientInfo && (
              <div className="bg-gray-100 p-4 rounded">
                <pre>{JSON.stringify(clientInfo, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Test Buttons */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">テスト機能</h2>
            <div className="space-x-4">
              <button
                onClick={testAuthAPI}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                セッションAPIテスト
              </button>
              <button
                onClick={testProtectedAPI}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                認証デバッグAPIテスト
              </button>
              <button
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                ログインページへ
              </button>
              <button
                onClick={() => window.location.href = '/upload'}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                アップロードページテスト
              </button>
            </div>
          </div>

          {/* Manual Cookie Check */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Cookie チェック</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre>{document.cookie || 'No cookies found'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}