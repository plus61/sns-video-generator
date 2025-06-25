'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, signup } from '../actions'
import { createClient } from '../../../utils/supabase/client'
import { Header } from '../../../components/ui/Header'

export default function SignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [mounted, setMounted] = useState(false)
  const message = searchParams.get('message')

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      
      if (isSignUp) {
        await signup(formData)
      } else {
        await login(formData)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      // エラーメッセージをより具体的に
      let errorMessage = '🔐 認証に失敗しました'
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '❌ メールアドレスまたはパスワードが正しくありません\n\n✅ 確認事項：\n• メールアドレスの入力ミスがないか\n• パスワードの大文字・小文字が正しいか\n• Caps Lockがオンになっていないか'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '📧 メールアドレスの確認が必要です\n\nアカウント作成時に送信された確認メールをご確認ください。\n\n✅ メールが見つからない場合：\n• 迷惑メールフォルダを確認\n• 再送信をリクエスト'
        } else if (error.message.includes('User already registered')) {
          errorMessage = '👤 このメールアドレスは既に登録されています\n\n✅ 対処法：\n• サインインを選択してください\n• パスワードを忘れた場合は、パスワードリセットを利用'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '🔒 パスワードが短すぎます\n\n✅ パスワードの要件：\n• 6文字以上\n• 英数字を推奨\n• 記号を含めるとより安全'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '🌐 ネットワークエラーが発生しました\n\n✅ 確認事項：\n• インターネット接続を確認\n• VPNを一時的にオフ\n• しばらく待ってから再試行'
        } else if (error.message.includes('rate limit')) {
          errorMessage = '⏱️ アクセス制限中です\n\n短時間に多くのリクエストがありました。\n\n✅ 対処法：5分ほど待ってから再度お試しください'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isSignUp ? 'アカウント作成' : 'サインイン'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp ? '新しいアカウントを作成' : 'アカウントにアクセスして動画制作を開始'}
            </p>
          </div>

          {message && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 dark:text-red-200 text-sm whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="test@sns-video-generator.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder={isSignUp ? "安全なパスワード" : "test123456"}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  isSignUp ? 'アカウント作成' : 'サインイン'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm transition-colors"
                >
                  {isSignUp ? 'すでにアカウントをお持ちですか？ サインイン' : 'アカウントをお持ちでないですか？ サインアップ'}
                </button>
              </div>

              {!isSignUp && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 テストアカウント: test@sns-video-generator.com / test123456
                  </p>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                サインインすることで、{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">利用規約</a>
                {' '}と{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">プライバシーポリシー</a>
                {' '}に同意したものとみなされます
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}