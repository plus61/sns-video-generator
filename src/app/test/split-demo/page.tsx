'use client'

import { useState } from 'react'

// AI分析モックデータ
const mockAIAnalysis = {
  emotionScores: [8.5, 6.2, 9.1],
  engagementPrediction: "High",
  suggestedHashtags: ["#viral", "#amazing", "#mustwatch"],
  highlights: [
    { time: "0:00-0:10", type: "高エンゲージメント", reason: "驚きの瞬間" },
    { time: "0:10-0:20", type: "教育的", reason: "重要な情報共有" },
    { time: "0:20-0:30", type: "感動的", reason: "感情に訴える場面" }
  ]
}

export default function TestSplitDemoPage() {
  const [videoId, setVideoId] = useState('')
  const [status, setStatus] = useState('')
  const [clips, setClips] = useState<Array<{ url: string; start: number; end: number }>>([])
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSplit = async () => {
    if (!videoId) return

    setIsProcessing(true)
    setStatus('🤖 AI分析を開始しています...')
    
    // AI分析の演出（2秒待機）
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setStatus('✂️ 最適なクリップを抽出中...')
    
    // さらに1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // デモ用のクリップデータ
    const demoClips = [
      { url: `https://example.com/video/${videoId}#t=0,10`, start: 0, end: 10 },
      { url: `https://example.com/video/${videoId}#t=10,20`, start: 10, end: 20 },
      { url: `https://example.com/video/${videoId}#t=20,30`, start: 20, end: 30 }
    ]
    
    setStatus('✅ AI分析完了！最適な3クリップを生成しました')
    setClips(demoClips)
    setShowAnalysis(true)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Video Splitter Demo
        </h1>
        <p className="text-gray-600 mb-8">YouTube動画をAIが分析し、バイラルな短尺クリップを自動生成</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：入力セクション */}
          <div className="space-y-6">
            {/* Video ID Input */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">📹</span> 
                動画を選択
              </h2>
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="YouTube URL または Video ID"
                className="w-full p-3 border rounded-lg mb-4"
              />
              <button
                onClick={handleSplit}
                disabled={!videoId || isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
              >
                {isProcessing ? '🤖 AI分析中...' : '✨ AIで分析開始'}
              </button>
            </div>

            {/* AI Analysis Results */}
            {showAnalysis && (
              <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
                <h2 className="font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">🧠</span> 
                  AI分析結果
                </h2>
                
                <div className="space-y-4">
                  {/* Emotion Scores */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">感情スコア</h3>
                    <div className="flex space-x-4">
                      {mockAIAnalysis.emotionScores.map((score, index) => (
                        <div key={index} className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">クリップ {index + 1}</div>
                          <div className="relative h-2 bg-gray-200 rounded">
                            <div 
                              className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 rounded"
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                          <div className="text-sm font-bold mt-1">{score}/10</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Prediction */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">エンゲージメント予測</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {mockAIAnalysis.engagementPrediction} 🚀
                    </span>
                  </div>

                  {/* Suggested Hashtags */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">推奨ハッシュタグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {mockAIAnalysis.suggestedHashtags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-center font-medium">{status}</p>
              </div>
            )}
          </div>

          {/* 右側：クリップ表示 */}
          <div>
            {clips.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎬</span> 
                  生成されたクリップ
                </h2>
                <div className="space-y-4">
                  {clips.map((clip, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">クリップ {index + 1}</h3>
                          <p className="text-sm text-gray-600">
                            {mockAIAnalysis.highlights[index].type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {mockAIAnalysis.highlights[index].reason}
                          </p>
                        </div>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {clip.start}s - {clip.end}s
                        </span>
                      </div>
                      
                      {/* Video placeholder */}
                      <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <p className="text-sm text-gray-600">動画プレビュー</p>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-2 mt-3">
                        <button className="flex-1 text-sm bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
                          TikTokに投稿
                        </button>
                        <button className="flex-1 text-sm bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition-colors">
                          Instagram Reels
                        </button>
                        <button className="flex-1 text-sm bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors">
                          YouTube Shorts
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}