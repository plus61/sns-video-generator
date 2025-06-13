'use client'

import { useState } from 'react'
import { VideoUpload, VideoSegment } from '@/types'
import { VisualCueData } from '@/types/enhanced-segment'
import { AnalysisResult } from '@/types/analysis-result'
import { VisualMetrics } from '@/types/visual-metrics'

interface SegmentsListProps {
  segments: VideoSegment[]
  videoUpload: VideoUpload | null
}

export function SegmentsList({ segments, videoUpload }: SegmentsListProps) {
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'type'>('score')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedSegment, setSelectedSegment] = useState<VideoSegment | null>(null)

  const contentTypes = ['all', ...new Set(segments.map(s => s.content_type).filter(Boolean))]
  
  const sortedSegments = [...segments].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.engagement_score - a.engagement_score
      case 'time':
        return a.start_time - b.start_time
      case 'type':
        return (a.content_type || '').localeCompare(b.content_type || '')
      default:
        return 0
    }
  })

  const filteredSegments = sortedSegments.filter(segment => 
    filterType === 'all' || segment.content_type === filterType
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900/20'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-100 dark:bg-red-900/20'
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'education': return '📚'
      case 'entertainment': return '🎭'
      case 'question': return '❓'
      case 'tips': return '💡'
      default: return '📝'
    }
  }

  const exportSegment = async (segment: VideoSegment) => {
    try {
      const response = await fetch('/api/export-segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segmentId: segment.id,
          videoUploadId: segment.video_upload_id
        }),
      })

      if (!response.ok) {
        throw new Error('セグメントのエクスポートに失敗しました')
      }

      const data = await response.json()
      
      // Download the exported segment
      if (data.exportUrl) {
        window.open(data.exportUrl, '_blank')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              抽出されたセグメント
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredSegments.length}個のセグメントが見つかりました
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {contentTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'すべてのタイプ' : type}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'time' | 'type')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="score">スコア順</option>
              <option value="time">時間順</option>
              <option value="type">タイプ順</option>
            </select>
          </div>
        </div>
      </div>

      {/* Segments List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredSegments.map((segment) => (
          <div
            key={segment.id}
            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
          >
            <div className="flex items-start justify-between">
              {/* Segment Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">
                    {getContentTypeIcon(segment.content_type || 'general')}
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(segment.engagement_score)}`}>
                    スコア: {segment.engagement_score}/10
                  </span>
                  {segment.content_type && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {segment.content_type}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {segment.title || `セグメント ${formatTime(segment.start_time)}`}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {segment.description || segment.transcript_segment}
                </p>

                {segment.platform_optimizations?.analysis ? (
                  <div className="mb-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        詳細分析を表示
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="font-medium">エンゲージメント:</span> {(segment.platform_optimizations.analysis as AnalysisResult)?.engagement_score || 0}/10
                          </div>
                          <div>
                            <span className="font-medium">完結性:</span> {(segment.platform_optimizations.analysis as AnalysisResult)?.completeness_score || 0}/10
                          </div>
                          <div>
                            <span className="font-medium">SNS適性:</span> {(segment.platform_optimizations.analysis as AnalysisResult)?.sns_score || 0}/10
                          </div>
                          <div>
                            <span className="font-medium">バイラル性:</span> {(segment.platform_optimizations.analysis as AnalysisResult)?.viral_score || 0}/10
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="font-medium">理由:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {(segment.platform_optimizations.analysis as AnalysisResult)?.reasoning || 'No analysis available'}
                          </p>
                        </div>

                        {segment.platform_optimizations?.visual_metrics ? (
                          <div className="mb-3">
                            <span className="font-medium">映像解析結果:</span>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                              <div>シーン変更: {(segment.platform_optimizations.visual_metrics as VisualMetrics).scene_changes}回</div>
                              <div>顔検出: {(segment.platform_optimizations.visual_metrics as VisualMetrics).face_detection_score}フレーム</div>
                              <div>感情バリエーション: {(segment.platform_optimizations.visual_metrics as VisualMetrics).emotion_variety}種</div>
                              <div>映像品質: {(segment.platform_optimizations.visual_metrics as VisualMetrics).visual_quality_avg?.toFixed(1)}/10</div>
                            </div>
                          </div>
                        ) : null}

                        {segment.platform_optimizations?.analysis && (segment.platform_optimizations?.analysis as AnalysisResult)?.hashtags?.length ? (
                          <div className="mb-3">
                            <span className="font-medium">推奨ハッシュタグ:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {((segment.platform_optimizations?.analysis as AnalysisResult)?.hashtags || []).map((tag: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {segment.platform_optimizations?.analysis && (segment.platform_optimizations?.analysis as AnalysisResult)?.platform_recommendations?.length ? (
                          <div>
                            <span className="font-medium">推奨プラットフォーム:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {((segment.platform_optimizations?.analysis as AnalysisResult)?.platform_recommendations || []).map((platform: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => setSelectedSegment(segment)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200"
                >
                  プレビュー
                </button>
                <button
                  onClick={() => exportSegment(segment)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
                >
                  エクスポート
                </button>
                <button
                  onClick={() => window.open(`/studio?segmentId=${segment.id}`, '_blank')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors duration-200"
                >
                  編集
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSegments.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">🎬</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            セグメントが見つかりませんでした
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filterType === 'all' 
              ? '動画解析でセグメントが抽出されませんでした。別の動画を試してみてください。'
              : '選択した条件に一致するセグメントがありません。フィルターを変更してみてください。'
            }
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {selectedSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  セグメントプレビュー
                </h3>
                <button
                  onClick={() => setSelectedSegment(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getContentTypeIcon(selectedSegment.content_type || 'general')}</span>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedSegment.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(selectedSegment.start_time)} - {formatTime(selectedSegment.end_time)} 
                  ({selectedSegment.end_time - selectedSegment.start_time}秒)
                </p>
              </div>

              {videoUpload?.public_url && (
                <div className="mb-4">
                  <video
                    src={`${videoUpload.public_url}#t=${selectedSegment.start_time},${selectedSegment.end_time}`}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '300px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">転写テキスト</h5>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedSegment.transcript_segment}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">エンゲージメントスコア</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-16">総合:</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedSegment.engagement_score * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{selectedSegment.engagement_score}/10</span>
                    </div>
                    
                    {(selectedSegment.visual_cues as unknown as VisualCueData)?.visual_engagement_score && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm w-16">映像:</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(selectedSegment.visual_cues as unknown as VisualCueData).visual_engagement_score * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12">{(selectedSegment.visual_cues as unknown as VisualCueData).visual_engagement_score}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}