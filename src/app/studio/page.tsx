'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { VideoTemplateSelector } from '@/components/ui/VideoTemplateSelector'
import { VideoPreview } from '@/components/ui/VideoPreview'
import { VideoGenerator } from '@/components/ui/VideoGenerator'
import { VideoDownloader } from '@/components/ui/VideoDownloader'
import { TTSControls } from '@/components/ui/TTSControls'
import { SocialMediaPostPanel } from '@/components/ui/SocialMediaPostPanel'
import type { VideoTemplate } from '@/types'

function StudioContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null)
  const [content, setContent] = useState({
    title: '',
    script: ''
  })
  const [generatedVideo, setGeneratedVideo] = useState<Blob | null>(null)
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null)
  const [activeTab, setActiveTab] = useState<'template' | 'preview' | 'generate' | 'download' | 'share'>('template')

  // Get content from URL params (from main page)
  useEffect(() => {
    const title = searchParams.get('title')
    const script = searchParams.get('script')
    
    if (title || script) {
      setContent({
        title: title || '',
        script: script || ''
      })
      if (title && script) {
        setActiveTab('template')
      }
    }
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎬</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                スタジオアクセスにはサインインが必要
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                動画編集スタジオを利用するには、サインインしてください。
              </p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                サインインページへ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleVideoGenerated = (videoBlob: Blob) => {
    setGeneratedVideo(videoBlob)
    setActiveTab('download')
  }

  const handleTemplateSelect = (template: VideoTemplate | null) => {
    setSelectedTemplate(template)
    if (template && content.title && content.script) {
      setActiveTab('preview')
    }
  }

  const handleContentChange = (field: 'title' | 'script', value: string) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  const handleAudioGenerated = (audioBlob: Blob) => {
    setGeneratedAudio(audioBlob)
  }

  const canPreview = selectedTemplate && (content.title || content.script)
  const canGenerate = selectedTemplate && content.title && content.script

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Video Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, preview, and generate your AI-powered videos
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'template', name: 'Template', icon: '🎨' },
              { id: 'preview', name: 'Preview', icon: '👁️', disabled: !canPreview },
              { id: 'generate', name: 'Generate', icon: '⚡', disabled: !canGenerate },
              { id: 'download', name: 'Download', icon: '📥', disabled: !generatedVideo },
              { id: 'share', name: 'Share', icon: '📤', disabled: !generatedVideo }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as 'template' | 'preview' | 'generate' | 'download' | 'share')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : tab.disabled
                    ? 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                disabled={tab.disabled}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Content & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Content Input */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Video Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter video title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Script
                  </label>
                  <textarea
                    value={content.script}
                    onChange={(e) => handleContentChange('script', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-32 resize-none"
                    placeholder="Enter video script..."
                  />
                </div>
              </div>
            </div>

            {/* Template Selection (when template tab is active) */}
            {activeTab === 'template' && (
              <div>
                <VideoTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                />
              </div>
            )}

            {/* TTS Controls */}
            {content.script && (
              <TTSControls
                text={content.script}
                onAudioGenerated={handleAudioGenerated}
              />
            )}

            {/* Generation Controls (when generate tab is active) */}
            {activeTab === 'generate' && selectedTemplate && (
              <VideoGenerator
                template={selectedTemplate}
                content={content}
                audioBlob={generatedAudio}
                onVideoGenerated={handleVideoGenerated}
              />
            )}
          </div>

          {/* Right Panel - Preview & Download */}
          <div className="lg:col-span-2">
            {activeTab === 'preview' && (
              <VideoPreview
                template={selectedTemplate}
                content={content}
                className="h-full"
              />
            )}

            {activeTab === 'generate' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use the generator on the left to create your video
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'download' && generatedVideo && (
              <VideoDownloader
                videoBlob={generatedVideo}
                projectTitle={content.title || 'My Video'}
              />
            )}

            {activeTab === 'share' && generatedVideo && (
              <SocialMediaPostPanel
                videoFile={generatedVideo}
                videoDuration={30} // This should be calculated from actual video
                onPostComplete={(results) => {
                  console.log('Post results:', results)
                  // Handle post completion - show notifications, etc.
                }}
              />
            )}

            {(activeTab === 'template' || activeTab === 'download' && !generatedVideo) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm3 3a1 1 0 112 0v6a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Video Studio
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'template' 
                      ? 'Select a template and add your content to get started'
                      : 'Generate a video to access download options'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Studio() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  )
}