'use client'

import { useState, useEffect } from 'react'
import { SocialPlatform, PostContent, SocialMediaAccount, PostTemplate } from '@/types/social-platform'
import { PLATFORM_CONFIGS } from '../../lib/social-publisher'
import { PostTemplateManager } from '../../lib/post-template-manager'
import { PostScheduler, OptimalPostingTime } from '../../lib/post-scheduler'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface SocialPublishPanelProps {
  videoSegment: {
    id: string
    title: string
    description: string
    duration: number
    videoPath: string
    thumbnailPath?: string
  }
  userAccounts: SocialMediaAccount[]
  onPublishComplete?: (results: any[]) => void
}

export function SocialPublishPanel({ 
  videoSegment, 
  userAccounts, 
  onPublishComplete 
}: SocialPublishPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  const [postContent, setPostContent] = useState<PostContent>({
    videoPath: videoSegment.videoPath,
    thumbnailPath: videoSegment.thumbnailPath,
    caption: '',
    hashtags: [],
    mentions: [],
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    allowStitch: true
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null)
  const [optimalTimes, setOptimalTimes] = useState<OptimalPostingTime[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'completed' | 'error'>('idle')

  const templateManager = PostTemplateManager.getInstance()
  const scheduler = PostScheduler.getInstance()

  useEffect(() => {
    loadTemplates()
  }, [selectedPlatforms])

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      loadOptimalTimes()
    }
  }, [selectedPlatforms])

  const loadTemplates = async () => {
    try {
      const userTemplates = await templateManager.getUserTemplates('current-user', selectedPlatforms)
      const defaultTemplates = await templateManager.getDefaultTemplates(selectedPlatforms)
      setTemplates([...userTemplates, ...defaultTemplates])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadOptimalTimes = async () => {
    try {
      const times = await scheduler.getOptimalPostingTimes('current-user', selectedPlatforms)
      setOptimalTimes(times.slice(0, 5))
    } catch (error) {
      console.error('Failed to load optimal times:', error)
    }
  }

  const handlePlatformToggle = (platform: SocialPlatform) => {
    const hasAccount = userAccounts.some(account => account.platform === platform && account.isActive)
    if (!hasAccount) {
      setError(`${PLATFORM_CONFIGS[platform].displayName}のアカウントが連携されていません`)
      return
    }

    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate('')
      return
    }

    try {
      setSelectedTemplate(templateId)
      
      const generatedContent = await templateManager.generateContentFromTemplate(
        templateId,
        {
          title: videoSegment.title,
          description: videoSegment.description,
          duration: `${videoSegment.duration}秒`
        },
        {
          title: videoSegment.title,
          description: videoSegment.description,
          keywords: extractKeywordsFromDescription(videoSegment.description),
          duration: videoSegment.duration
        }
      )

      setPostContent(prev => ({
        ...prev,
        caption: generatedContent.caption,
        hashtags: generatedContent.hashtags,
        privacy: generatedContent.privacy,
        allowComments: generatedContent.allowComments,
        allowDuet: generatedContent.allowDuet,
        allowStitch: generatedContent.allowStitch
      }))
    } catch (error) {
      setError('テンプレートの適用に失敗しました')
    }
  }

  const handleOptimalTimeSelect = (time: OptimalPostingTime) => {
    const now = new Date()
    const selectedTime = new Date()
    
    // 次回のその曜日・時間を計算
    const daysUntil = (time.dayOfWeek - now.getDay() + 7) % 7
    selectedTime.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil))
    selectedTime.setHours(time.hour, 0, 0, 0)
    
    setScheduledTime(selectedTime)
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      setError('投稿するプラットフォームを選択してください')
      return
    }

    if (!postContent.caption.trim()) {
      setError('キャプションを入力してください')
      return
    }

    setIsPublishing(true)
    setPublishStatus('publishing')
    setError(null)
    setPublishProgress(0)

    try {
      // プラットフォーム別の進捗シミュレーション
      const progressIncrement = 100 / selectedPlatforms.length
      let currentProgress = 0

      const activeAccounts = userAccounts.filter(account => 
        selectedPlatforms.includes(account.platform) && account.isActive
      )

      if (scheduledTime) {
        // スケジュール投稿
        const scheduledPost = await scheduler.schedulePost(
          'current-user',
          videoSegment.id,
          selectedPlatforms,
          postContent,
          scheduledTime,
          {
            timezone: 'Asia/Tokyo',
            retryAttempts: 3,
            retryDelay: 5
          }
        )

        setPublishProgress(100)
        setPublishStatus('completed')
        
        onPublishComplete?.([{
          scheduled: true,
          scheduledTime: scheduledTime,
          postId: scheduledPost.id
        }])
      } else {
        // 即座に投稿
        const { SocialPublisher } = await import('../../lib/social-publisher')
        const publisher = SocialPublisher.getInstance()

        // 進捗更新をシミュレート
        const progressTimer = setInterval(() => {
          currentProgress += progressIncrement * 0.1
          setPublishProgress(Math.min(currentProgress, 95))
        }, 200)

        const results = await publisher.publishToMultiplePlatforms(
          'current-user',
          activeAccounts,
          postContent,
          { optimizeForPlatform: true }
        )

        clearInterval(progressTimer)
        setPublishProgress(100)
        setPublishStatus('completed')
        
        onPublishComplete?.(results)
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : '投稿に失敗しました')
      setPublishStatus('error')
    } finally {
      setIsPublishing(false)
    }
  }

  const extractKeywordsFromDescription = (description: string): string[] => {
    const words = description.split(/\s+/)
    return words
      .filter(word => word.length > 2)
      .filter(word => !['です', 'ます', 'この', 'その', 'あの', 'という'].includes(word))
      .slice(0, 5)
  }

  const getPlatformColor = (platform: SocialPlatform) => {
    const config = PLATFORM_CONFIGS[platform]
    return config?.color || '#gray'
  }

  const formatOptimalTime = (time: OptimalPostingTime) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${days[time.dayOfWeek]} ${time.hour}:00 (スコア: ${time.engagementScore})`
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          📱 SNS投稿設定
        </h2>

        {/* プラットフォーム選択 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            投稿プラットフォーム
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(PLATFORM_CONFIGS).map(config => {
              const platform = config.name as SocialPlatform
              const hasAccount = userAccounts.some(account => 
                account.platform === platform && account.isActive
              )
              const isSelected = selectedPlatforms.includes(platform)

              return (
                <button
                  key={platform}
                  onClick={() => handlePlatformToggle(platform)}
                  disabled={!hasAccount}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : hasAccount
                        ? 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-2">{config.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {config.displayName}
                  </div>
                  {!hasAccount && (
                    <div className="text-xs text-red-500 mt-1">未連携</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* テンプレート選択 */}
        {selectedPlatforms.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              投稿テンプレート
            </h3>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">テンプレートを選択...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.platforms.join(', ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* キャプション編集 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            キャプション
          </h3>
          <textarea
            value={postContent.caption}
            onChange={(e) => setPostContent(prev => ({ ...prev, caption: e.target.value }))}
            placeholder="投稿のキャプションを入力してください..."
            rows={6}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            文字数: {postContent.caption.length}
          </div>
        </div>

        {/* ハッシュタグ */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            ハッシュタグ ({postContent.hashtags.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {postContent.hashtags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 最適投稿時間 */}
        {optimalTimes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🎯 おすすめ投稿時間
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {optimalTimes.slice(0, 5).map((time, index) => (
                <button
                  key={index}
                  onClick={() => handleOptimalTimeSelect(time)}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatOptimalTime(time)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {time.platform.toUpperCase()} - エンゲージメント率予測: {time.engagementScore}/10
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* スケジュール設定 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            投稿スケジュール
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="schedule"
                checked={!scheduledTime}
                onChange={() => setScheduledTime(null)}
                className="mr-2"
              />
              今すぐ投稿
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="schedule"
                checked={!!scheduledTime}
                onChange={() => setScheduledTime(new Date(Date.now() + 60 * 60 * 1000))}
                className="mr-2"
              />
              スケジュール投稿
            </label>
          </div>
          
          {scheduledTime && (
            <div className="mt-3">
              <input
                type="datetime-local"
                value={scheduledTime.toISOString().slice(0, 16)}
                onChange={(e) => setScheduledTime(new Date(e.target.value))}
                min={new Date().toISOString().slice(0, 16)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* プログレスバー */}
        {isPublishing && (
          <div className="mb-6">
            <ProgressBar
              progress={publishProgress}
              status={publishStatus}
              size="md"
              animated={true}
            />
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-6">
            <ErrorAlert
              error={error}
              variant="error"
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* 投稿ボタン */}
        <div className="flex justify-end">
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedPlatforms.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {scheduledTime ? 'スケジュール中...' : '投稿中...'}
              </>
            ) : (
              <>
                📤 {scheduledTime ? 'スケジュール投稿' : '今すぐ投稿'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}