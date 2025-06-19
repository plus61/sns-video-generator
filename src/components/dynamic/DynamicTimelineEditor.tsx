import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Heavy timeline editor loaded dynamically
const TimelineEditorInternal = dynamic(() => import('@/components/ui/TimelineEditor'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading timeline editor...</p>
      </div>
    </div>
  ),
  ssr: false
})

export function DynamicTimelineEditor(props: any) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading timeline editor...</p>
        </div>
      </div>
    }>
      <TimelineEditorInternal {...props} />
    </Suspense>
  )
}