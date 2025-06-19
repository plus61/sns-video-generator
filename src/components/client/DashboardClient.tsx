'use client'

import { useState, useEffect } from 'react'
import { VideoProjectCard } from '@/components/ui/VideoProjectCard'
import { VideoUploadCard } from '@/components/ui/VideoUploadCard'
import { UsageCard } from '@/components/ui/UsageCard'
import type { VideoProject, VideoUpload } from '@/types'
import type { DashboardServerData } from '@/components/server/DashboardData'

interface UserUsage {
  videos_generated: number
  monthly_limit: number
  remaining: number
  last_generation_at: string | null
  reset_date: string
}

interface DashboardClientProps {
  initialData: DashboardServerData
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [projects, setProjects] = useState<VideoProject[]>(initialData.projects)
  const [videoUploads, setVideoUploads] = useState<VideoUpload[]>(initialData.videoUploads)
  const [usage, setUsage] = useState<UserUsage | null>(initialData.usage)
  const [activeTab, setActiveTab] = useState<'projects' | 'uploads'>('projects')

  // Real-time updates (client-side)
  useEffect(() => {
    const refreshData = async () => {
      try {
        if (activeTab === 'projects') {
          const response = await fetch('/api/video-projects')
          if (response.ok) {
            const data = await response.json()
            setProjects(data.projects || [])
          }
        } else {
          const response = await fetch('/api/video-uploads')
          if (response.ok) {
            const data = await response.json()
            setVideoUploads(data.uploads || [])
          }
        }
      } catch (error) {
        console.error('Failed to refresh data:', error)
      }
    }

    // Refresh every 30 seconds for live updates
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  return (
    <div className="space-y-8">
      {/* Usage Statistics */}
      {usage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UsageCard
            title="動画生成数"
            value={usage.videos_generated}
            max={usage.monthly_limit}
            type="generation"
          />
          <UsageCard
            title="残り回数"
            value={usage.remaining}
            max={usage.monthly_limit}
            type="remaining"
          />
          <UsageCard
            title="次回リセット"
            value={usage.reset_date}
            type="date"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          動画プロジェクト ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'uploads'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          動画アップロード ({videoUploads.length})
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'projects' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((project) => (
                <VideoProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(id) => {
                    window.location.href = `/studio?project=${id}`
                  }}
                  onDelete={async (id) => {
                    try {
                      const response = await fetch(`/api/video-projects`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: id })
                      })
                      if (response.ok) {
                        setProjects(prev => prev.filter(p => p.id !== id))
                      }
                    } catch (error) {
                      console.error('Delete failed:', error)
                    }
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  プロジェクトがありません
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  新しい動画プロジェクトを作成して始めましょう
                </p>
                <button
                  onClick={() => { window.location.href = '/studio' }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  プロジェクト作成
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoUploads.length > 0 ? (
              videoUploads.map((upload) => (
                <VideoUploadCard
                  key={upload.id}
                  upload={upload}
                  onAnalyze={(id) => {
                    window.location.href = `/analyze/${id}`
                  }}
                  onDelete={async (id) => {
                    try {
                      const response = await fetch(`/api/video-uploads`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uploadId: id })
                      })
                      if (response.ok) {
                        setVideoUploads(prev => prev.filter(u => u.id !== id))
                      }
                    } catch (error) {
                      console.error('Delete failed:', error)
                    }
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  アップロードされた動画がありません
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  動画をアップロードしてAI解析を始めましょう
                </p>
                <button
                  onClick={() => { window.location.href = '/upload' }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  動画アップロード
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}