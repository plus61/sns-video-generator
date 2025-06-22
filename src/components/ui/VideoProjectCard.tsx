import { useState } from 'react'
import type { VideoProject } from '../../types'

interface VideoProjectCardProps {
  project: VideoProject
  onUpdate?: () => void
}

export function VideoProjectCard({ project }: VideoProjectCardProps) {
  const [showFullScript, setShowFullScript] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {project.title || 'Untitled Video'}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {project.script && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generated Script:
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {showFullScript ? project.script : truncateText(project.script, 150)}
            </p>
            {project.script.length > 150 && (
              <button
                onClick={() => setShowFullScript(!showFullScript)}
                className="text-blue-600 dark:text-blue-400 text-xs hover:underline mt-2"
              >
                {showFullScript ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>Created: {formatDate(project.created_at)}</span>
        {project.duration && (
          <span>{project.duration}s duration</span>
        )}
      </div>

      <div className="flex gap-2">
        {project.video_url && (
          <a
            href={project.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
          >
            View Video
          </a>
        )}
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(project.script || '')
            // You could add a toast notification here
          }}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Copy Script
        </button>
      </div>
    </div>
  )
}