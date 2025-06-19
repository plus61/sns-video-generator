import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import with loading fallback
const VideoUploaderInternal = dynamic(() => import('@/components/ui/VideoUploader'), {
  loading: () => (
    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading uploader...</p>
      </div>
    </div>
  ),
  ssr: false
})

export function DynamicVideoUploader(props: any) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading uploader...</p>
        </div>
      </div>
    }>
      <VideoUploaderInternal {...props} />
    </Suspense>
  )
}