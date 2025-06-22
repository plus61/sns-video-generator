'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  socialMediaIntegration, 
  PostData, 
  PostResult,
  PLATFORM_CONFIGS 
} from '../../lib/social-media-integration'

interface SocialMediaPostPanelProps {
  videoFile?: File | Blob
  videoDuration?: number
  onPostComplete?: (results: PostResult[]) => void
}

interface PlatformStatus {
  platform: string
  authenticated: boolean
  posting: boolean
  result?: PostResult
}

export function SocialMediaPostPanel({ 
  videoFile, 
  videoDuration = 0, 
  onPostComplete 
}: SocialMediaPostPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [postData, setPostData] = useState<PostData>({
    title: '',
    description: '',
    tags: [],
    videoFile: videoFile || new Blob(),
    visibility: 'public'
  })
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')

  // Initialize platform statuses
  useEffect(() => {
    const platforms = socialMediaIntegration.getSupportedPlatforms()
    const statuses = platforms.map(platform => ({
      platform,
      authenticated: socialMediaIntegration.isAuthenticated(platform),
      posting: false
    }))
    setPlatformStatuses(statuses)
  }, [])

  // Update video file when prop changes
  useEffect(() => {
    if (videoFile) {
      setPostData(prev => ({ ...prev, videoFile }))
    }
  }, [videoFile])

  // Platform selection handlers
  const handlePlatformToggle = useCallback((platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }, [])

  // Validation for each platform
  const getValidationResults = useCallback(() => {
    const results: Record<string, { valid: boolean; errors: string[]; warnings: string[] }> = {}
    
    selectedPlatforms.forEach(platform => {
      if (videoFile) {
        results[platform] = socialMediaIntegration.validateVideoForPlatform(
          platform, 
          videoFile as File, 
          videoDuration
        )
      }
    })
    
    return results
  }, [selectedPlatforms, videoFile, videoDuration])

  // Post to all selected platforms
  const handlePostToAll = useCallback(async () => {
    if (!videoFile || selectedPlatforms.length === 0) return

    setIsPosting(true)
    const results: PostResult[] = []

    try {
      // Update posting status for selected platforms
      setPlatformStatuses(prev => 
        prev.map(status => ({
          ...status,
          posting: selectedPlatforms.includes(status.platform)
        }))
      )

      // Post to each platform
      for (const platform of selectedPlatforms) {
        try {
          let result: PostResult

          switch (platform) {
            case 'youtube':
              result = await socialMediaIntegration.postToYouTube(postData)
              break
            case 'tiktok':
              result = await socialMediaIntegration.postToTikTok(postData)
              break
            case 'instagram':
              result = await socialMediaIntegration.postToInstagram(postData)
              break
            default:
              result = { success: false, error: `Platform ${platform} not implemented` }
          }

          results.push({ ...result, platform } as PostResult & { platform: string })

          // Update platform status with result
          setPlatformStatuses(prev => 
            prev.map(status => 
              status.platform === platform 
                ? { ...status, posting: false, result }
                : status
            )
          )

        } catch (error) {
          const errorResult: PostResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          results.push({ ...errorResult, platform } as PostResult & { platform: string })

          setPlatformStatuses(prev => 
            prev.map(status => 
              status.platform === platform 
                ? { ...status, posting: false, result: errorResult }
                : status
            )
          )
        }
      }

      onPostComplete?.(results)

    } finally {
      setIsPosting(false)
    }
  }, [videoFile, selectedPlatforms, postData, onPostComplete])

  // Tag management
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !postData.tags?.includes(newTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }, [newTag, postData.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }, [])

  // Authentication modal
  const openAuthModal = useCallback((platform: string) => {
    setShowAuthModal(platform)
  }, [])

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(null)
  }, [])

  const validationResults = getValidationResults()

  return (
    <div data-testid="social-media-post-panel" className="social-media-post-panel bg-white border border-gray-300 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">ソーシャルメディアに投稿</h2>

      {/* Platform Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">投稿先プラットフォーム</h3>
        <div className="grid grid-cols-2 gap-4">
          {platformStatuses.map(({ platform, authenticated, posting, result }) => {
            const config = PLATFORM_CONFIGS[platform]
            const isSelected = selectedPlatforms.includes(platform)
            const validation = validationResults[platform]

            return (
              <div
                key={platform}
                data-testid={`platform-card-${platform}`}
                className={`
                  platform-card border rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                  ${!authenticated ? 'opacity-60' : ''}
                `}
                onClick={() => authenticated && handlePlatformToggle(platform)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{config.name}</h4>
                  <div className="flex items-center gap-2">
                    {posting && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {authenticated ? (
                      <span className="text-green-600 text-xs">認証済み</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openAuthModal(platform)
                        }}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        認証する
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>最大ファイルサイズ: {config.maxFileSize}MB</div>
                  <div>最大時間: {Math.floor(config.maxDuration / 60)}分</div>
                  <div>対応形式: {config.supportedFormats.join(', ')}</div>
                </div>

                {/* Validation Results */}
                {isSelected && validation && (
                  <div className="mt-3 space-y-1">
                    {validation.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 flex items-center gap-1">
                        <span>❌</span>
                        {error}
                      </div>
                    ))}
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-600 flex items-center gap-1">
                        <span>⚠️</span>
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Result */}
                {result && (
                  <div className={`mt-3 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? (
                      <div className="flex items-center gap-1">
                        <span>✅</span>
                        投稿完了
                        {result.url && (
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 underline"
                          >
                            表示
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>❌</span>
                        {result.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Post Content Form */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">投稿内容</h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input
              data-testid="post-title-input"
              type="text"
              value={postData.title || ''}
              onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="動画のタイトルを入力..."
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              {(postData.title || '').length}/100文字
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">説明文</label>
            <textarea
              data-testid="post-description-input"
              value={postData.description || ''}
              onChange={(e) => setPostData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="動画の説明を入力..."
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {(postData.description || '').length}/5000文字
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">タグ</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {postData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                data-testid="new-tag-input"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="タグを追加..."
                maxLength={50}
              />
              <button
                data-testid="add-tag-button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-1">公開設定</label>
            <select
              data-testid="visibility-select"
              value={postData.visibility || 'public'}
              onChange={(e) => setPostData(prev => ({ 
                ...prev, 
                visibility: e.target.value as 'public' | 'private' | 'unlisted'
              }))}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="public">公開</option>
              <option value="unlisted">限定公開</option>
              <option value="private">非公開</option>
            </select>
          </div>
        </div>
      )}

      {/* Post Button */}
      {selectedPlatforms.length > 0 && (
        <div className="flex gap-4">
          <button
            data-testid="post-to-all-button"
            onClick={handlePostToAll}
            disabled={isPosting || !videoFile || selectedPlatforms.every(p => !validationResults[p]?.valid)}
            className={`
              flex-1 py-3 px-6 rounded-lg font-medium transition-colors
              ${isPosting || !videoFile || selectedPlatforms.every(p => !validationResults[p]?.valid)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {isPosting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                投稿中...
              </div>
            ) : (
              `選択したプラットフォームに投稿 (${selectedPlatforms.length})`
            )}
          </button>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          platform={showAuthModal}
          onClose={closeAuthModal}
          onAuthComplete={() => {
            // Refresh authentication status
            setPlatformStatuses(prev => 
              prev.map(status => ({
                ...status,
                authenticated: status.platform === showAuthModal 
                  ? socialMediaIntegration.isAuthenticated(showAuthModal)
                  : status.authenticated
              }))
            )
            closeAuthModal()
          }}
        />
      )}
    </div>
  )
}

// Authentication Modal Component
interface AuthModalProps {
  platform: string
  onClose: () => void
  onAuthComplete: () => void
}

function AuthModal({ platform, onClose, onAuthComplete }: AuthModalProps) {
  const [credentials, setCredentials] = useState({
    accessToken: '',
    apiKey: '',
    clientId: '',
    clientSecret: ''
  })

  const config = PLATFORM_CONFIGS[platform]

  const handleSaveCredentials = useCallback(() => {
    const filteredCredentials: Record<string, string> = {}
    
    // Only include non-empty credentials
    Object.entries(credentials).forEach(([key, value]) => {
      if (value.trim()) {
        filteredCredentials[key] = value.trim()
      }
    })

    socialMediaIntegration.setCredentials(platform, filteredCredentials)
    onAuthComplete()
  }, [platform, credentials, onAuthComplete])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{config.name} 認証設定</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {config.name}のAPIクレデンシャルを入力してください。
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">アクセストークン</label>
            <input
              type="password"
              value={credentials.accessToken}
              onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="アクセストークンを入力..."
            />
          </div>

          {platform === 'youtube' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">クライアントID</label>
                <input
                  type="text"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="クライアントIDを入力..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">クライアントシークレット</label>
                <input
                  type="password"
                  value={credentials.clientSecret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="クライアントシークレットを入力..."
                />
              </div>
            </>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveCredentials}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}