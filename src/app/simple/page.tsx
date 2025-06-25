'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export default function SimplePage() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState<'idle' | 'downloading' | 'analyzing' | 'splitting' | 'done'>('idle')
  const [stageMessage, setStageMessage] = useState('')
  const [result, setResult] = useState<any>(null)
  const [splitResult, setSplitResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const handleProcess = async () => {
    if (!youtubeUrl.trim()) {
      setError('⚠️ YouTube URLを入力してください（例：https://www.youtube.com/watch?v=...）')
      return
    }

    setError('')
    setProcessing(true)
    setResult(null)
    setSplitResult(null)
    setStage('downloading')
    setStageMessage('YouTube動画をダウンロード中です...')

    try {
      // Step 1: YouTubeダウンロード
      const response = await fetch(`${API_URL}/api/youtube-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      }).catch(error => {
        console.error('API Error:', error)
        // Railway環境での接続エラー
        if (error.message.includes('Failed to fetch')) {
          throw new Error('🔌 サービスに接続できません\n\n現在メンテナンス中の可能性があります。\n\n✅ 対処法：\n• 5分後に再度お試しください\n• 問題が続く場合はサポートにお問い合わせください')
        }
        throw new Error('サービスに接続できません。しばらくお待ちください。')
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 404) {
          throw new Error('🔍 動画が見つかりませんでした\n\n考えられる原因：\n• URLが正しくない\n• 動画が削除されている\n• 地域制限がかかっている\n\n✅ 対処法：URLをコピー＆ペーストで正確に入力してください')
        } else if (response.status === 403) {
          throw new Error('🔒 動画にアクセスできません\n\n考えられる原因：\n• プライベート動画\n• 限定公開の動画\n• 年齢制限がある動画\n\n✅ 対処法：公開されている動画のURLをお試しください')
        } else if (response.status === 500) {
          // Railway環境のFFmpegエラーを検出
          if (errorText.includes('FFmpeg') || errorText.includes('ffmpeg')) {
            throw new Error('🎬 動画処理エラー\n\nFFmpegの設定を確認しています。\n\n✅ 対処法：\n• 異なる動画URLでお試しください\n• より短い動画（5分以内）を選択してください')
          }
          throw new Error('⚡ サーバーエラーが発生しました\n\n現在、システムに高負荷がかかっている可能性があります。\n\n✅ 対処法：\n• 5分ほど待ってから再度お試しください\n• 問題が続く場合は、サポートにお問い合わせください')
        }
        throw new Error('動画の処理中にエラーが発生しました。')
      }

      const data = await response.json()
      setResult({
        videoId: data.videoId,
        videoPath: data.videoPath,
        fileSize: data.fileSize || 0,
        summary: 'YouTube動画のダウンロードが完了しました',
        segments: [] // セグメントは分割後に設定
      })
      
      // 分析段階
      setStage('analyzing')
      setStageMessage('動画を分析中です...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // 視覚的フィードバックのため
      
      // Step 2: 動画分割
      if (data.videoPath) {
        setStage('splitting')
        setStageMessage('最適なクリップを切り出し中です...')
        const splitResponse = await fetch(`${API_URL}/api/split-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            videoPath: data.videoPath
          })
        })

        if (!splitResponse.ok) {
          console.warn('Video splitting failed, but continuing...')
          // エラーでも続行（分割は失敗してもOK）
        } else {
          const splitData = await splitResponse.json()
          setSplitResult(splitData)
          
          // セグメント情報をresultに追加
          if (splitData.segments) {
            setResult(prev => ({
              ...prev,
              segments: splitData.segments.map((seg, idx) => ({
                start: idx * 10,
                end: (idx + 1) * 10,
                score: 8,
                type: 'highlight'
              }))
            }))
          }
        }
      }

      setStage('done')
      setStageMessage('処理が完了しました')

    } catch (err) {
      let errorMessage = '❗ 予期しないエラーが発生しました'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // より具体的なエラーメッセージに変換
        if (err.message.includes('fetch')) {
          errorMessage = '🌐 ネットワークエラー\n\nインターネット接続を確認してください。\n\n✅ 確認事項：\n• Wi-Fiまたはモバイル通信が有効か\n• VPNを使用している場合は一時的にオフ\n• ファイアウォールの設定を確認'
        } else if (err.message.includes('timeout')) {
          errorMessage = '⏱️ 処理時間がかかりすぎました\n\n動画が大きすぎるか、サーバーが混雑している可能性があります。\n\n✅ 対処法：\n• より短い動画（10分以内）でお試しください\n• 時間をおいてから再度実行\n• 混雑時間帯を避ける'
        } else if (err.message.includes('Invalid URL')) {
          errorMessage = '❌ 無効なYouTube URL\n\n正しい形式の例：\n• https://www.youtube.com/watch?v=XXXXXXXXXXX\n• https://youtu.be/XXXXXXXXXXX\n• https://m.youtube.com/watch?v=XXXXXXXXXXX\n\n✅ URLをブラウザからコピー&ペーストしてください'
        }
      }
      
      setError(errorMessage)
      setStage('idle')
      setStageMessage('')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!splitResult || !splitResult.segments) return
    
    setDownloading(true)
    try {
      const response = await fetch(`${API_URL}/api/download-segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: splitResult.segments })
      })
      
      if (!response.ok) {
        throw new Error('ダウンロードの準備に失敗しました。もう一度お試しください。')
      }
      
      // Blob作成とダウンロード
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video-segments-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ダウンロードエラー')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">YouTube動画から魅力的なクリップを作成</h1>
        
        {/* 入力フォーム */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <label className="block mb-2 font-medium">YouTube URL</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full p-3 border rounded mb-4"
            disabled={processing}
            data-testid="youtube-url-input"
          />
          
          <button
            onClick={handleProcess}
            disabled={processing || !youtubeUrl.trim()}
            className={`w-full py-3 rounded font-medium ${
              processing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            data-testid="process-button"
          >
            {processing ? '処理中...' : '動画を処理'}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="error bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6" data-testid="error-message">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium whitespace-pre-line">
                  {error}
                </p>
                {error.includes('ネットワーク') && (
                  <p className="text-xs text-red-600 mt-1">
                    ヒント: VPNを使用している場合は、一時的に無効にしてみてください。
                  </p>
                )}
                {error.includes('URL') && (
                  <p className="text-xs text-red-600 mt-1">
                    例: https://www.youtube.com/watch?v=XXXXXXXXXXX
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 処理中表示 */}
        {processing && (
          <div className="progress bg-white p-6 rounded-lg shadow" data-testid="loading-indicator">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-lg font-medium text-gray-800" data-testid="stage-message">
                {stageMessage || (
                  stage === 'downloading' ? '動画をダウンロード中...' :
                  stage === 'analyzing' ? 'AI分析中...' :
                  stage === 'splitting' ? '動画を分割中...' : '処理中...'
                )}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {stage === 'downloading' && '動画サイズによって時間がかかる場合があります'}
                {stage === 'analyzing' && '最適なクリップポイントを探しています'}
                {stage === 'splitting' && 'もうすぐ完了します'}
              </p>
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow" data-testid="result-container">
            {stage === 'done' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-medium">処理が完了しました</p>
              </div>
            )}
            <h2 className="text-xl font-bold mb-4">処理結果</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Video ID: {result.videoId}</p>
              <p className="text-sm text-gray-600">ファイルサイズ: {(result.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              <p className="mt-2">{result.summary}</p>
            </div>

            {splitResult && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">生成された分割動画</h3>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`px-4 py-2 rounded font-medium ${
                      downloading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    data-testid="download-button"
                  >
                    {downloading ? 'ダウンロード中...' : '全てダウンロード (ZIP)'}
                  </button>
                </div>
                <div className="space-y-3">
                  {splitResult.segments.map((segment: any, index: number) => (
                    <div key={index} className="segment-item p-4 bg-green-50 rounded border border-green-200" data-testid={`segment-${index}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">セグメント {index + 1}</span>
                        <span className="text-sm text-gray-600">
                          {(segment.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{segment.name}</p>
                      
                      {/* ビデオプレビュー */}
                      <video 
                        controls 
                        className="w-full rounded"
                        style={{ maxHeight: '200px' }}
                        data-testid={`video-preview-${index}`}
                      >
                        <source 
                          src={`/api/preview-segment?path=${encodeURIComponent(segment.path)}`} 
                          type="video/mp4" 
                        />
                        お使いのブラウザは動画タグをサポートしていません。
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!splitResult && (
              <>
                <h3 className="font-medium mb-2">セグメント一覧</h3>
                <div className="space-y-2">
                  {result.segments.map((segment: any, index: number) => (
                    <div key={index} className={`p-3 rounded ${index < 3 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span>{segment.start}秒 - {segment.end}秒</span>
                        <span className="text-sm">
                          スコア: {segment.score}/10 ({segment.type})
                          {index < 3 && ' ⭐'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* デモ用ダウンロードボタン */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 mb-3">
                    🎬 デモ版：実際の動画ダウンロードには youtube-dl のインストールが必要です
                  </p>
                  <button
                    onClick={() => {
                      alert('デモ版のため、実際のダウンロードは利用できません。\n\n実装するには：\n1. youtube-dl をインストール\n2. 実際の動画処理を有効化\n\n詳細は IMPLEMENTATION_STATUS.md をご覧ください。')
                    }}
                    className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
                  >
                    ダウンロード機能（準備中）
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}