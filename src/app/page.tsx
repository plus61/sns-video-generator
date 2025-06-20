export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SNS Video Generator
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            AI動画生成プラットフォーム
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
            YouTubeの長尺動画から、AIが自動でエンゲージメントの高いショート動画を抽出。
            ソーシャルメディア向けに最適化された動画を簡単に作成できます。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a 
              href="/upload"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              📤 動画をアップロード
            </a>
            <a 
              href="/test"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200"
            >
              🧪 YouTube URLテスト
            </a>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            テスト用YouTube URL: https://youtu.be/cjtmDEG-B7U
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🎬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              AI動画解析
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              GPT-4Vによる高度な映像解析で、最適なセグメントを自動抽出
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">✂️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              自動セグメント抽出
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              エンゲージメントの高い部分を自動で特定し、ショート動画として切り出し
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ソーシャルメディア統合
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              YouTube、TikTok、Instagram、Twitterに直接投稿可能
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              動画編集スタジオ
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              テキスト編集、音楽追加、エフェクトなどの包括的編集機能
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              AI音声認識
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Whisperエンジンによる高精度な音声認識と字幕生成
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              プロジェクト管理
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              動画プロジェクトの保存、管理、履歴追跡が可能
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🚀 今すぐ始める
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/upload"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl">📤</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">アップロード</p>
                <p className="text-sm text-gray-500">動画をアップロード</p>
              </div>
            </a>
            
            <a 
              href="/studio"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">スタジオ</p>
                <p className="text-sm text-gray-500">動画編集</p>
              </div>
            </a>
            
            <a 
              href="/dashboard"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">ダッシュボード</p>
                <p className="text-sm text-gray-500">プロジェクト管理</p>
              </div>
            </a>
            
            <a 
              href="/database-test"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl">🗄️</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">DB接続</p>
                <p className="text-sm text-gray-500">データベーステスト</p>
              </div>
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}
