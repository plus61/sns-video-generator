'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { VideoTemplate } from '@/types'

interface VideoGenerationFormProps {
  onGenerate: (prompt: string, title: string, templateId?: string) => Promise<void>
  isGenerating: boolean
  selectedTemplate: VideoTemplate | null
}

export function VideoGenerationForm({ onGenerate, isGenerating, selectedTemplate }: VideoGenerationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('')
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    await onGenerate(prompt, title, selectedTemplate?.id)
    setPrompt('')
    setTitle('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Video Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="Enter video title..."
          />
        </div>
        
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Video Content Prompt *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white h-32 resize-none"
            placeholder="Describe the video content you want to generate..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating || !user}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Video...
            </div>
          ) : (
            'Generate Video'
          )}
        </button>
        
        {!user && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Please sign in to generate videos
          </p>
        )}
      </form>
    </div>
  )
}