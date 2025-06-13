interface UserUsage {
  videos_generated: number
  monthly_limit: number
  remaining: number
  last_generation_at: string | null
  reset_date: string
}

interface UsageCardProps {
  usage: UserUsage
}

export function UsageCard({ usage }: UsageCardProps) {
  const progressPercentage = (usage.videos_generated / usage.monthly_limit) * 100
  const resetDate = new Date(usage.reset_date).toLocaleDateString()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Monthly Usage
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Videos Generated
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {usage.videos_generated} / {usage.monthly_limit}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              progressPercentage >= 90
                ? 'bg-red-500'
                : progressPercentage >= 70
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {usage.remaining} videos remaining
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Resets on {resetDate}
          </span>
        </div>

        {usage.last_generation_at && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last generated: {new Date(usage.last_generation_at).toLocaleString()}
          </div>
        )}

        {usage.remaining === 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">
              You&apos;ve reached your monthly limit. Your usage will reset on {resetDate}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}