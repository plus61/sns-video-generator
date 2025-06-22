'use client'

import React, { Component, ReactNode } from 'react'
import { errorReporter } from '../../lib/error-reporting'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生した際にstateを更新
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラー情報をstateに保存
    this.setState({
      error,
      errorInfo
    })

    // エラーレポートシステムに報告
    errorReporter.reportError(error, {
      category: 'react_component',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    })

    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // カスタムfallbackが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              エラーが発生しました
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              申し訳ありません。予期しないエラーが発生しました。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 rounded border">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  開発者向け詳細情報
                </summary>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>エラー:</strong> {this.state.error.message}</p>
                  <p><strong>スタック:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs bg-white p-2 border rounded mt-1">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="mt-2"><strong>コンポーネントスタック:</strong></p>
                      <pre className="whitespace-pre-wrap text-xs bg-white p-2 border rounded mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                再試行
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                ページを更新
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              問題が続く場合は、ブラウザのキャッシュをクリアしてみてください。
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 特定用途向けのError Boundary
export const VideoProcessingErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      errorReporter.reportError(error, {
        category: 'video_processing',
        context: {
          componentStack: errorInfo.componentStack,
          feature: 'video_processing'
        }
      })
    }}
    fallback={
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              動画処理でエラーが発生しました
            </h3>
            <p className="mt-1 text-sm text-red-700">
              動画のアップロードまたは処理中に問題が発生しました。ファイルサイズやフォーマットを確認してください。
            </p>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)

// API呼び出し用のError Boundary
export const ApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      errorReporter.reportError(error, {
        category: 'api_error',
        context: {
          componentStack: errorInfo.componentStack,
          feature: 'api_call'
        }
      })
    }}
    fallback={
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              データの読み込みでエラーが発生しました
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              サーバーとの通信中に問題が発生しました。ページを更新してみてください。
            </p>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)