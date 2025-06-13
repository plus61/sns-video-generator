'use client'

interface OptimalSegmentsBadgeProps {
  isOptimal: boolean
  qualityScore?: number
}

export function OptimalSegmentsBadge({ isOptimal, qualityScore }: OptimalSegmentsBadgeProps) {
  if (!isOptimal) return null

  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
        ✨ 最適
      </span>
      {qualityScore && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          品質: {qualityScore.toFixed(1)}/10
        </span>
      )}
    </div>
  )
}