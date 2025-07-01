'use client'

import { useState, useEffect } from 'react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { PreviewModal } from '@/components/ui/PreviewModal'
import { ClientVideoProcessor, ProcessingProgress } from '@/lib/client-video-processor'

interface VideoMetadata {
  title: string
  description: string
  thumbnail: string
  duration: string
  viewCount: number
  channelTitle?: string
  publishedAt?: string
  tags?: string[]
  likeCount?: number
  commentCount?: number
}

interface VideoSegment {
  id: number
  score: number
  thumbnail: string
  time: string
  highlight: string
  suggestedCaption?: string
  platforms?: string[]
}

export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [demoUrl, setDemoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  const [segments, setSegments] = useState<VideoSegment[]>([])
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<'fetching' | 'analyzing' | 'complete'>('fetching')
  const [error, setError] = useState<string | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<number[]>([])
  const [previewSegment, setPreviewSegment] = useState<number | null>(null)
  const [processor, setProcessor] = useState<ClientVideoProcessor | null>(null)
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null)
  const [useLocalDemo, setUseLocalDemo] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [showFeedback, setShowFeedback] = useState(false)

  // Initialize video processor
  useEffect(() => {
    const initProcessor = async () => {
      const proc = new ClientVideoProcessor()
      await proc.initialize((progress) => {
        setProcessingProgress(progress)
      })
      setProcessor(proc)
    }
    initProcessor()
  }, [])

  // Auto-start demo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 0) {
        startDemo()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [step])

  const generateCaption = (segment: any) => {
    const captions = [
      '冒頭から引き込まれる展開！#必見 #バズり確定',
      'この瞬間が全てを変える 🔥 #感動 #拡散希望',
      '最後まで見逃せない！結末に鳥肌... #神回 #永久保存版'
    ]
    return captions[segment.id % captions.length]
  }

  const suggestPlatforms = (segment: any) => {
    if (segment.score > 90) {
      return ['TikTok', 'Instagram Reels', 'YouTube Shorts']
    } else if (segment.score > 85) {
      return ['Instagram Reels', 'Twitter']
    }
    return ['YouTube Shorts']
  }

  const startDemo = async () => {
    setStep(1)
    setProcessing(true)
    setError(null)
    setLoadingPhase('fetching')

    try {
      // Step 1: Fetch YouTube metadata
      const metadataResponse = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: demoUrl })
      })

      if (!metadataResponse.ok) {
        throw new Error('動画情報の取得に失敗しました')
      }

      const metadataResult = await metadataResponse.json()
      if (metadataResult.success) {
        setVideoMetadata(metadataResult.data)
        setLoadingPhase('analyzing')
        
        // Step 2: Use real video processing if available
        if (processor && !useLocalDemo) {
          // Process with FFmpeg.wasm
          const processedSegments = await processor.processYouTubeVideo(demoUrl)
          
          // Convert to demo format
          const formattedSegments = processedSegments.map((seg, index) => ({
            id: seg.id,
            score: seg.score,
            thumbnail: seg.thumbnail,
            time: `${Math.floor(seg.startTime / 60)}:${(seg.startTime % 60).toString().padStart(2, '0')}-${Math.floor(seg.endTime / 60)}:${(seg.endTime % 60).toString().padStart(2, '0')}`,
            highlight: seg.highlight || 'AIが検出したハイライト',
            suggestedCaption: generateCaption(seg),
            platforms: suggestPlatforms(seg)
          }))
          
          setSegments(formattedSegments)
        } else {
          // Fallback to simulation
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const thumbnail = metadataResult.data.thumbnail
          setSegments([
            { 
              id: 1, 
              score: 95, 
              thumbnail, 
              time: '0:15-0:30', 
              highlight: 'エキサイティングなオープニング',
              suggestedCaption: '冒頭から引き込まれる展開！#必見 #バズり確定',
              platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts']
            },
            { 
              id: 2, 
              score: 88, 
              thumbnail, 
              time: '1:05-1:20', 
              highlight: 'キーモーメント',
              suggestedCaption: 'この瞬間が全てを変える 🔥 #感動 #拡散希望',
              platforms: ['Instagram Reels', 'Twitter']
            },
            { 
              id: 3, 
              score: 92, 
              thumbnail, 
              time: '2:30-2:45', 
              highlight: 'クライマックスシーン',
              suggestedCaption: '最後まで見逃せない！結末に鳥肌... #神回 #永久保存版',
              platforms: ['TikTok', 'YouTube Shorts']
            }
          ])
        }
        
        // Extract video ID for embed URL
        const videoIdMatch = demoUrl.match(/(?:v=|\/v\/|youtu\.be\/)([^&\n?#]+)/)
        if (videoIdMatch) {
          setVideoUrl(`https://www.youtube.com/embed/${videoIdMatch[1]}`)
        }
        
        setLoadingPhase('complete')
        setProcessing(false)
        setStep(2)
      } else {
        throw new Error(metadataResult.error || '予期しないエラーが発生しました')
      }
    } catch (err) {
      console.error('Demo error:', err)
      setError(err instanceof Error ? err.message : '処理中にエラーが発生しました')
      setProcessing(false)
      setStep(3) // Error state
    }
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
              <p className="text-gray-400 mb-6">
                実際のYouTube動画を使用して、AI解析の威力をご覧ください
              </p>
              <div className="max-w-lg mx-auto mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="YouTube URLを入力"
                    className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔗
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  例: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </p>
                {demoUrl && !demoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)[\w-]+/) && demoUrl.length > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    ⚠️ 正しいYouTube URLを入力してください
                  </p>
                )}
              </div>
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
                    {loadingPhase === 'fetching' ? (
                      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl">🤖</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {loadingPhase === 'fetching' ? (
                  <span className="flex items-center justify-center gap-2">
                    動画情報を取得中
                    <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}>•</span>
                    <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }}>•</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    AI解析中
                    <span className="inline-block w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="inline-block w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}>•</span>
                    <span className="inline-block w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}>•</span>
                  </span>
                )}
              </h2>
              <div className="w-full max-w-md mx-auto">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full progress-bar-premium" />
                </div>
                {videoMetadata && (
                  <div className="mt-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={videoMetadata.thumbnail} 
                        alt="Video thumbnail"
                        className="w-16 h-9 object-cover rounded-lg"
                      />
                      <div className="text-left flex-1">
                        <p className="text-gray-300 font-semibold text-sm line-clamp-1">{videoMetadata.title}</p>
                        <p className="text-gray-400 text-xs">
                          {videoMetadata.channelTitle} • {videoMetadata.viewCount.toLocaleString()}回視聴
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full text-gray-400">
                        ⏱️ {videoMetadata.duration}
                      </span>
                      {videoMetadata.likeCount && (
                        <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full text-gray-400">
                          👍 {videoMetadata.likeCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-500 mt-4 text-sm">
                {demoUrl}
              </p>
            </div>
          )}

          {step === 2 && !processing && videoMetadata && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-800/70 to-gray-900/70 rounded-2xl border border-gray-700 backdrop-blur-sm">
                  <div className="flex items-start gap-5">
                    <div className="relative group">
                      <img 
                        src={videoMetadata.thumbnail} 
                        alt={videoMetadata.title}
                        className="w-40 h-24 object-cover rounded-xl shadow-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{videoMetadata.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <span className="text-blue-400">▶️</span> {videoMetadata.channelTitle}
                        </span>
                        <span>•</span>
                        <span>{videoMetadata.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                          👁️ {videoMetadata.viewCount.toLocaleString()}
                        </span>
                        {videoMetadata.likeCount && (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                            👍 {videoMetadata.likeCount.toLocaleString()}
                          </span>
                        )}
                        {videoMetadata.commentCount && (
                          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium">
                            💬 {videoMetadata.commentCount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                      解析完了！
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg">
                    AIが<span className="text-purple-400 font-bold">{segments.length}個</span>のバイラル候補を発見しました
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {segments.map((segment, index) => {
                  const isSelected = selectedSegments.includes(segment.id)
                  return (
                    <div
                      key={segment.id}
                      className={`card-interactive bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${
                        isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700 hover:border-purple-500/50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        setSelectedSegments(prev => 
                          prev.includes(segment.id) 
                            ? prev.filter(id => id !== segment.id)
                            : [...prev, segment.id]
                        )
                      }}
                    >
                    <div className="aspect-video bg-gray-700 relative group overflow-hidden">
                      <img 
                        src={segment.thumbnail} 
                        alt={`Segment ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Viral Score Badge */}
                      <div className="absolute top-4 right-4 viral-score-badge">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          {segment.score}% 🔥
                        </div>
                      </div>
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                          <span className="text-4xl">▶️</span>
                        </div>
                      </div>
                      
                      {/* Time Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-white text-xs font-medium">{segment.time}</span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-semibold text-lg">クリップ {index + 1}</p>
                        <div className="flex items-center gap-1">
                          {segment.platforms?.map((platform, idx) => (
                            <span key={idx} className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                              {platform === 'TikTok' && '🎵'}
                              {platform === 'Instagram Reels' && '📷'}
                              {platform === 'YouTube Shorts' && '📺'}
                              {platform === 'Twitter' && '🐦'}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {segment.highlight && (
                        <p className="text-purple-400 text-sm font-medium mb-3">🌟 {segment.highlight}</p>
                      )}
                      
                      {segment.suggestedCaption && (
                        <div className="bg-gray-700/30 rounded-lg p-3 mt-3">
                          <p className="text-gray-300 text-xs leading-relaxed">
                            📝 {segment.suggestedCaption}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex gap-2">
                        <button 
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewSegment(segment.id)
                          }}
                        >
                          プレビュー
                        </button>
                        <button 
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors relative"
                          onClick={(e) => {
                            e.stopPropagation()
                            // 編集機能は後で実装
                          }}
                        >
                          編集
                          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-xs text-black font-bold px-2 py-0.5 rounded-full">Soon</span>
                        </button>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="relative">
                    <AnimatedButton variant="success" size="lg" className="min-w-[200px]">
                      <span className="flex items-center gap-2">
                        <span>🚀</span> 全て投稿する
                      </span>
                    </AnimatedButton>
                    <span className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-500 to-purple-600 text-xs text-white font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">Coming Soon</span>
                  </div>
                  <AnimatedButton 
                    variant="primary" 
                    size="lg" 
                    className="min-w-[200px]"
                    disabled={selectedSegments.length === 0}
                  >
                    <span className="flex items-center gap-2">
                      <span>✨</span> 選択して投稿 {selectedSegments.length > 0 && `(${selectedSegments.length})`}
                    </span>
                  </AnimatedButton>
                </div>
                <AnimatedButton variant="secondary" size="md" onClick={() => setStep(0)}>
                  もう一度見る
                </AnimatedButton>
                <p className="text-gray-400 text-sm mt-4">
                  💡 ヒント: クリップをクリックしてプレビューを確認できます
                </p>
              </div>
            </div>
          )}

          {step === 3 && error && (
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-5xl">😢</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                おっと！問題が発生しました
              </h2>
              <div className="max-w-md mx-auto mb-8">
                <p className="text-red-400 font-medium mb-4">
                  {error}
                </p>
                {error && error.includes('URL') && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-left">
                    <p className="text-gray-300 font-semibold mb-2">💡 YouTube URLの正しい形式:</p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <code className="bg-gray-900 px-2 py-1 rounded">https://www.youtube.com/watch?v=VIDEO_ID</code>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <code className="bg-gray-900 px-2 py-1 rounded">https://youtu.be/VIDEO_ID</code>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <code className="bg-gray-900 px-2 py-1 rounded">https://m.youtube.com/watch?v=VIDEO_ID</code>
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                      ※ VIDEO_IDは11文字の英数字です
                    </p>
                  </div>
                )}
              </div>
              <AnimatedButton onClick={() => setStep(0)} size="lg" variant="primary">
                もう一度試す
              </AnimatedButton>
              <div className="mt-6 space-y-2">
                <p className="text-gray-500 text-sm">
                  心配しないで！すぐに解決します
                </p>
                <div className="flex justify-center gap-4 text-xs">
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                    ヘルプを見る
                  </a>
                  <span className="text-gray-600">•</span>
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                    サポートに連絡
                  </a>
                </div>
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
            <p className="text-yellow-400 text-xs mt-2 font-semibold">✨ NEW: FFmpeg.wasm統合</p>
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
      
      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewSegment !== null}
        onClose={() => setPreviewSegment(null)}
        segment={segments.find(s => s.id === previewSegment) || null}
        videoTitle={videoMetadata?.title}
        videoUrl={videoUrl}
      />
    </div>
  )
}