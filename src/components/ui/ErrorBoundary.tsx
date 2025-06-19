'use client'

import { Component, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Animation */}
            <div className="mb-8">
              <div className="text-6xl mb-4 animate-pulse">⚠️</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                エラーが発生しました
              </div>
            </div>

            {/* Error Details */}
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                🔄 ページを再読み込み
              </button>
              
              <Link
                href="/"
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
              >
                🏠 ホームに戻る
              </Link>
              
              <Link
                href="/database-test"
                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-block text-sm"
              >
                🔧 データベース接続をテスト
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 トラブルシューティング
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>• ブラウザの再読み込みを試してください</p>
                <p>• インターネット接続を確認してください</p>
                <p>• 問題が続く場合は管理者にお問い合わせください</p>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 text-xs text-gray-400 dark:text-gray-600">
              Error ID: {Date.now().toString(36)}
              <br />
              Timestamp: {new Date().toISOString()}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}