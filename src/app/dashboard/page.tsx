'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { VideoProjectCard } from '@/components/ui/VideoProjectCard'
import { VideoUploadCard } from '@/components/ui/VideoUploadCard'
import { UsageCard } from '@/components/ui/UsageCard'
import type { VideoProject, VideoUpload } from '@/types'

interface UserUsage {
  videos_generated: number
  monthly_limit: number
  remaining: number
  last_generation_at: string | null
  reset_date: string
}

// Server Component for initial data loading
interface DashboardServerData {
  projects: VideoProject[]
  videoUploads: VideoUpload[]
  usage: UserUsage | null
}

function DashboardContent() {
  const { user, isLoading } = useAuth({ required: true })
  const router = useRouter()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [videoUploads, setVideoUploads] = useState<VideoUpload[]>([])
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'uploads'>('projects')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [projectsRes, uploadsRes, usageRes] = await Promise.all([
        fetch('/api/video-projects'),
        fetch('/api/video-uploads'),
        fetch('/api/user-usage')
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects)
      }

      if (uploadsRes.ok) {
        const uploadsData = await uploadsRes.json()
        setVideoUploads(uploadsData.uploads)
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Protected route handles authentication automatically

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {session?.user?.name || session?.user?.email}!
          </p>
        </div>

        {usage && (
          <div className="mb-8">
            <UsageCard usage={usage} />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Generated Videos ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'uploads'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Uploaded Videos ({videoUploads.length})
            </button>
          </div>
        </div>

        {/* Tab Content Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {activeTab === 'projects' ? 'Generated Video Projects' : 'Uploaded Videos for Analysis'}
          </h2>
          <div className="flex space-x-3">
            {activeTab === 'projects' ? (
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Create New Video
              </button>
            ) : (
              <button
                onClick={() => router.push('/upload')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Upload New Video
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'projects' ? (
          projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No video projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first AI-generated video
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
            >
              Create Your First Video
            </button>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <VideoProjectCard
                  key={project.id}
                  project={project}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )
        ) : (
          /* Uploads Tab */
          videoUploads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No uploaded videos yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload a long-form video to extract engaging short clips with AI
              </p>
              <button
                onClick={() => router.push('/upload')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
              >
                Upload Your First Video
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {videoUploads.map((upload) => (
                <VideoUploadCard
                  key={upload.id}
                  upload={upload}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}