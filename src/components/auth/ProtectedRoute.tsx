'use client'

import { useAuth } from '../../hooks/useAuth'
import { Header } from '../ui/Header'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/signin' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth({ 
    required: true, 
    redirectTo 
  })
  const router = useRouter()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Show fallback or default signin prompt if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                サインインが必要です
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                この機能を利用するには、サインインしてください。
              </p>
              <button
                onClick={() => router.push(redirectTo)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                サインインページへ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}

export default ProtectedRoute