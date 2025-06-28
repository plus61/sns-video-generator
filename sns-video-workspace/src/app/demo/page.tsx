'use client'

import { useState, useEffect } from 'react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'

export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [demoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  const [segments, setSegments] = useState<any[]>([])

  // Auto-start demo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 0) {
        startDemo()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [step])

  const startDemo = async () => {
    setStep(1)
    setProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setSegments([
        { id: 1, score: 95, thumbnail: '/api/placeholder/320/180', time: '0:15-0:30' },
        { id: 2, score: 88, thumbnail: '/api/placeholder/320/180', time: '1:05-1:20' },
        { id: 3, score: 92, thumbnail: '/api/placeholder/320/180', time: '2:30-2:45' }
      ])
      setProcessing(false)
      setStep(2)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 page-transition">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
              完璧なデモ体験
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            1.5秒で動画を解析。バイラルコンテンツを即座に。
          </p>
        </div>

        {/* Demo Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700">
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-5xl">🎬</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                デモを開始します
              </h2>
              <p className="text-gray-400 mb-8">
                実際のYouTube動画を使用して、AI解析の威力をご覧ください
              </p>
              <AnimatedButton onClick={startDemo} size="lg" variant="primary">
                デモを体験する
              </AnimatedButton>
            </div>
          )}

          {step === 1 && processing && (
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">🤖</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 loading-premium">
                AI解析中...
              </h2>
              <div className="w-full max-w-md mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full progress-bar-premium" />
              </div>
              <p className="text-gray-400 mt-4">
                {demoUrl}
              </p>
            </div>
          )}

          {step === 2 && !processing && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  解析完了！最適なクリップを発見
                </h2>
                <p className="text-gray-400">
                  AIが{segments.length}個のバイラル候補を検出しました
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="card-interactive bg-gray-800 rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="aspect-video bg-gray-700 relative">
                      <img 
                        src={segment.thumbnail} 
                        alt={`Segment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 viral-score-badge">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {segment.score}% バイラル
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-white font-medium">クリップ {index + 1}</p>
                      <p className="text-gray-400 text-sm">{segment.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <AnimatedButton variant="success" size="lg" className="mr-4">
                  全て投稿する
                </AnimatedButton>
                <AnimatedButton variant="secondary" size="lg" onClick={() => setStep(0)}>
                  もう一度見る
                </AnimatedButton>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">超高速処理</h3>
            <p className="text-gray-400">業界最速1.5秒で解析完了</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">高精度AI</h3>
            <p className="text-gray-400">95%の精度でバイラル予測</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-2">全SNS対応</h3>
            <p className="text-gray-400">ワンクリックで全投稿</p>
          </div>
        </div>
      </div>
    </div>
  )
}