'use client'

interface PlatformOptimizationIndicatorProps {
  platforms: string[]
  selectedPlatform?: string
  onPlatformSelect?: (platform: string) => void
}

export function PlatformOptimizationIndicator({ 
  platforms, 
  selectedPlatform,
  onPlatformSelect 
}: PlatformOptimizationIndicatorProps) {
  const platformIcons = {
    tiktok: '🎵',
    instagram: '📸',
    youtube: '🎬'
  }

  const platformColors = {
    tiktok: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    instagram: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    youtube: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  return (
    <div className="flex flex-wrap gap-1">
      {platforms.map(platform => (
        <button
          key={platform}
          onClick={() => onPlatformSelect?.(platform)}
          className={`
            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all
            ${selectedPlatform === platform 
              ? 'ring-2 ring-blue-500 ring-offset-1' 
              : ''
            }
            ${platformColors[platform as keyof typeof platformColors] || 'bg-gray-100 text-gray-800'}
          `}
        >
          <span>{platformIcons[platform as keyof typeof platformIcons] || '📱'}</span>
          <span className="capitalize">{platform}</span>
        </button>
      ))}
    </div>
  )
}