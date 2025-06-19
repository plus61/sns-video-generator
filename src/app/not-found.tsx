import Link from 'next/link'
import { Header } from '@/components/ui/Header'
import { BackButton } from '@/components/ui/BackButton'

export default function NotFound() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
              404
            </div>
            <div className="text-6xl mb-6">
              🎬
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ページが見つかりません
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              お探しのページは存在しないか、移動された可能性があります。
              <br />
              動画制作を続けるために、ホームページに戻りましょう。
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
            >
              🏠 ホームに戻る
            </Link>
            
            <BackButton />
          </div>

          {/* Quick Links */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              よく使われるページ:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard"
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ダッシュボード
                </div>
              </Link>
              
              <Link
                href="/upload"
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  動画アップロード
                </div>
              </Link>
              
              <Link
                href="/studio"
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  スタジオ
                </div>
              </Link>
              
              <Link
                href="/settings"
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  設定
                </div>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 お困りですか？
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              動画制作に関するヘルプやガイドをご確認ください
            </p>
            <div className="space-y-2">
              <Link
                href="/help"
                className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                📚 ヘルプセンター
              </Link>
              <Link
                href="/contact"
                className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                📞 お問い合わせ
              </Link>
            </div>
          </div>

          {/* Error Code for Debug */}
          <div className="mt-8 text-xs text-gray-400 dark:text-gray-600">
            Error Code: 404 | Page Not Found
          </div>
        </div>
      </main>
    </div>
  )
}