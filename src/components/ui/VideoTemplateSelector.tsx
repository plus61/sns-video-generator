'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { VideoTemplate } from '@/types'

interface VideoTemplateSelectorProps {
  selectedTemplate: VideoTemplate | null
  onTemplateSelect: (template: VideoTemplate | null) => void
}

export function VideoTemplateSelector({ selectedTemplate, onTemplateSelect }: VideoTemplateSelectorProps) {
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/video-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDimensionsText = (config: { dimensions?: { width: number; height: number } }) => {
    const { dimensions } = config
    if (!dimensions?.width || !dimensions?.height) {
      return 'Custom'
    }
    if (dimensions.width === dimensions.height) {
      return 'Square (1:1)'
    } else if (dimensions.height > dimensions.width) {
      return 'Vertical (9:16)'
    } else {
      return 'Horizontal (16:9)'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
      case 'youtube':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose a Video Template
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 dark:bg-gray-700 h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Choose a Video Template (Optional)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* No Template Option */}
        <div
          onClick={() => onTemplateSelect(null)}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedTemplate === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          } bg-white dark:bg-gray-800`}
        >
          <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            No Template
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate content without a specific template
          </p>
        </div>

        {/* Template Options */}
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } bg-white dark:bg-gray-800`}
          >
            {template.thumbnail_url ? (
              <Image
                src={template.thumbnail_url}
                alt={template.name}
                width={300}
                height={128}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            ) : (
              <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {template.name.charAt(0)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {template.name}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {template.description}
            </p>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{getDimensionsText(template.config)}</span>
              <span>{template.config.duration}s</span>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            Selected: {selectedTemplate.name}
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            Your video will be generated using the {selectedTemplate.name} template 
            ({getDimensionsText(selectedTemplate.config)}, {selectedTemplate.config.duration}s duration)
          </p>
        </div>
      )}
    </div>
  )
}