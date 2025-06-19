'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { errorReporter } from '@/lib/error-reporting'

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
}

export const GlobalErrorBoundary: React.FC<GlobalErrorBoundaryProps> = ({ children }) => {
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // グローバルエラーとして特別な処理
    errorReporter.reportError(error, {
      category: 'global_error',
      severity: 'high',
      context: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        isGlobalBoundary: true
      }
    })

    // 重要なエラーの場合は追加の処理
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      // JavaScript チャンクの読み込みエラー - ページリロードを促す
      console.warn('Chunk load error detected, suggesting page reload')
    }

    // 開発環境では詳細ログ
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Boundary')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Stack:', error.stack)
      console.groupEnd()
    }
  }

  return (
    <ErrorBoundary
      onError={handleGlobalError}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="max-w-lg w-full mx-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
              {/* アニメーション付きエラーアイコン */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 animate-pulse">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                申し訳ありません
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                アプリケーションで予期しないエラーが発生しました。
                <br />
                この問題は自動的に報告されました。
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  ページを再読み込み
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  ホームに戻る
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    技術情報を表示
                  </summary>
                  <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    <p><strong>時刻:</strong> {new Date().toLocaleString('ja-JP')}</p>
                    <p><strong>ユーザーエージェント:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}</p>
                    <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Unknown'}</p>
                  </div>
                </details>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                エラーID: {Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 開発環境専用のエラー表示
export const DevErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.group('🔧 Development Error Boundary')
        console.error('Error:', error)
        console.error('Component Stack:', errorInfo.componentStack)
        console.error('Error Stack:', error.stack)
        console.groupEnd()
      }}
      fallback={
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-red-900 text-white p-6 rounded-lg max-w-4xl max-h-96 overflow-auto">
            <h2 className="text-xl font-bold mb-4">🔧 Development Error</h2>
            <p className="mb-4">エラーが発生しました。詳細はブラウザコンソールを確認してください。</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
            >
              Reload
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}