'use client'

import { ReactNode } from 'react'
import { Header } from '../ui/Header'
import { NavigationMenu } from '@/components/ui/NavigationMenu'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface MainLayoutProps {
  children: ReactNode
  showNavigation?: boolean
  title?: string
  description?: string
}

export function MainLayout({ 
  children, 
  showNavigation = true, 
  title,
  description 
}: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        {showNavigation && <NavigationMenu />}
        
        {/* Page Header */}
        {(title || description) && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 SNS Video Generator. All rights reserved.
              </div>
              <div className="flex space-x-6 mt-4 sm:mt-0">
                <a href="/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ヘルプ
                </a>
                <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  プライバシー
                </a>
                <a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  利用規約
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

// Specialized layouts for different page types
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout 
      title="ダッシュボード" 
      description="プロジェクトと動画を管理"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </MainLayout>
  )
}

export function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout 
      title="スタジオ" 
      description="動画編集とプレビュー"
    >
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </MainLayout>
  )
}

export function UploadLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout 
      title="動画アップロード" 
      description="動画をアップロードしてAI解析を開始"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </MainLayout>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout showNavigation={false}>
      {children}
    </MainLayout>
  )
}