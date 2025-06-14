'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { VideoGenerationForm } from '@/components/ui/VideoGenerationForm'
import { VideoTemplateSelector } from '@/components/ui/VideoTemplateSelector'
import type { VideoTemplate } from '@/types'

export default function Home() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null)
  const [generatedContent, setGeneratedContent] = useState<{
    id?: string
    script: string
    title: string
    status?: string
    created_at?: string
  } | null>(null)

  const handleGenerate = async (prompt: string, title: string, templateId?: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, title, template_id: templateId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate video content')
      }

      const data = await response.json()
      setGeneratedContent(data)
      
      // Navigate to studio with generated content
      const params = new URLSearchParams({
        title: data.title || '',
        script: data.script || ''
      })
      router.push(`/studio?${params.toString()}`)
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Failed to generate video. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Video Generation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Create engaging social media videos with AI. Simply describe your content and let our AI generate the perfect video script and title.
          </p>
          
          {/* Database Test Link */}
          <div className="mt-6">
            <a 
              href="/database-test" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🧪 Test Database Connection
            </a>
          </div>
        </div>

        <VideoTemplateSelector 
          selectedTemplate={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
        />

        <VideoGenerationForm 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating}
          selectedTemplate={selectedTemplate}
        />

        {generatedContent && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Generated Video Content
              </h3>
              
              {generatedContent.title && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title:
                  </h4>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {generatedContent.title}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Script:
                </h4>
                <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg whitespace-pre-wrap">
                  {generatedContent.script}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
