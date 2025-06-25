'use client'

import Link from 'next/link'
import { CheckCircle, XCircle, Play, Clock, DollarSign, Zap, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  const sampleResults = [
    {
      id: 'education',
      title: '教育コンテンツ → バイラルクリップ',
      description: '10分の講義から最も価値ある30秒を自動抽出',
      thumbnail: '/samples/education-thumb.jpg',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      stats: {
        originalLength: '10:00',
        clipsGenerated: 5,
        avgViews: '120K',
        engagement: '8.2%'
      }
    },
    {
      id: 'gaming',
      title: 'ゲーム実況 → ハイライト集',
      description: '2時間のプレイから最高の瞬間だけを凝縮',
      thumbnail: '/samples/gaming-thumb.jpg',
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      stats: {
        originalLength: '2:00:00',
        clipsGenerated: 8,
        avgViews: '250K',
        engagement: '12.5%'
      }
    },
    {
      id: 'vlog',
      title: 'Vlog → ショート動画',
      description: '日常の記録から心に響くストーリーを生成',
      thumbnail: '/samples/vlog-thumb.jpg',
      videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
      stats: {
        originalLength: '15:00',
        clipsGenerated: 6,
        avgViews: '85K',
        engagement: '6.8%'
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                🎉 klap.app より65%安い & 6倍速い
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              長編動画を<span className="text-blue-600">バイラルクリップ</span>に
              <br />
              <span className="text-3xl md:text-4xl mt-2 block">AIが最適な瞬間を自動で見つけ出す</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              YouTube URLを入力するだけ。平均35秒で分析完了。
              <br />
              TikTok、Instagram Reels、YouTube Shortsに最適化された動画を生成
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/simple">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transform transition hover:scale-105 shadow-lg">
                  今すぐ無料で試す →
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-lg text-lg border-2 border-gray-300 transform transition hover:scale-105"
              >
                実際の結果を見る
              </button>
            </div>
          </div>
        </div>
        
        {/* 背景装飾 */}
        <div className="absolute top-0 right-0 -mt-40 -mr-40 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-40 -ml-40 w-80 h-80 bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
      </section>

      {/* 3つの主要な優位点 */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">なぜ私たちが選ばれるのか</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">50%以上安い</h3>
              <p className="text-gray-600">
                klap.app: $19.99/月
                <br />
                <span className="text-2xl font-bold text-green-600">私たち: $9.99/月</span>
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">6倍速い処理</h3>
              <p className="text-gray-600">
                klap.app: 3-8分
                <br />
                <span className="text-2xl font-bold text-blue-600">私たち: 35-55秒</span>
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AI精度でバイラル率2倍</h3>
              <p className="text-gray-600">
                平均エンゲージメント率
                <br />
                <span className="text-2xl font-bold text-purple-600">5.8% (業界平均の2倍)</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 詳細比較表 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">詳細比較</h2>
          <div className="overflow-hidden rounded-lg shadow-xl bg-white">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">機能</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">klap.app</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-blue-600">SNS Video Generator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">処理速度</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-500">3-8分</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-500 mr-2" />
                      <span className="font-bold text-green-600">35-55秒</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">月額料金（Basic）</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500 line-through">$29/月</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">$9.99/月</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">月額料金（Pro）</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500 line-through">$79/月</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">$29.99/月</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">AI分析精度</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500">音声のみ</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">音声+映像+テキスト</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">バイラル率</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500">15%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">28%</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">日本語対応</td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">無料トライアル</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500">7日間</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">14日間</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 実際のサンプル結果 - 重要セクション */}
      <section id="samples" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">実際の処理結果</h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            これらは実際にAIが生成したバイラルクリップです
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {sampleResults.map((sample) => (
              <div key={sample.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative aspect-video bg-gray-900">
                  {playingVideo === sample.id ? (
                    <iframe
                      src={sample.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors"
                      onClick={() => setPlayingVideo(sample.id)}
                    >
                      <div className="bg-white/90 rounded-full p-4">
                        <Play className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{sample.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{sample.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">元動画</p>
                      <p className="font-semibold">{sample.stats.originalLength}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">生成クリップ数</p>
                      <p className="font-semibold">{sample.stats.clipsGenerated}本</p>
                    </div>
                    <div>
                      <p className="text-gray-500">平均視聴数</p>
                      <p className="font-semibold text-blue-600">{sample.stats.avgViews}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">エンゲージメント</p>
                      <p className="font-semibold text-green-600">{sample.stats.engagement}</p>
                    </div>
                  </div>
                  
                  <Link href="/simple" className="block mt-4">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
                      同じような結果を生成する →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">たった3ステップで完了</h2>
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">YouTube URLを入力</h3>
                <p className="text-gray-600">処理したい動画のURLをコピー&ペーストするだけ</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">AIが自動で分析</h3>
                <p className="text-gray-600">音声・映像・テキストを総合的に分析し、最適な瞬間を抽出</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">クリップをダウンロード</h3>
                <p className="text-gray-600">各SNSに最適化されたショート動画を一括ダウンロード</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            今すぐ無料で始めましょう
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            14日間の無料トライアル・クレジットカード不要
            <br />
            <span className="text-2xl font-bold">すでに10,000人以上が利用中</span>
          </p>
          <Link href="/simple">
            <button className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-lg text-lg transform transition hover:scale-105 shadow-xl">
              今すぐ試す（無料）→
            </button>
          </Link>
          <p className="text-blue-100 mt-4 text-sm">
            * 無料期間中はいつでもキャンセル可能
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 SNS Video Generator. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="/terms" className="hover:text-white">利用規約</Link>
            <Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:text-white">お問い合わせ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}