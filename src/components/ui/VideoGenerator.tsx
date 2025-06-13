'use client'

import { useState, useRef } from 'react'
import type { VideoTemplate } from '@/types'

interface VideoGeneratorProps {
  template: VideoTemplate | null
  content: {
    title: string
    script: string
  }
  audioBlob?: Blob | null
  onVideoGenerated: (videoBlob: Blob) => void
}

export function VideoGenerator({ template, content, audioBlob, onVideoGenerated }: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateVideo = async () => {
    if (!template || !content.title || !content.script) {
      setError('Missing required content')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      // Use simpler Canvas-based video generation for browser compatibility
      const videoBlob = await generateCanvasVideo(template, content, audioBlob, setProgress)
      onVideoGenerated(videoBlob)
    } catch (error) {
      console.error('Video generation failed:', error)
      setError('Failed to generate video')
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        className="hidden"
        width={template?.config.dimensions?.width || 1080}
        height={template?.config.dimensions?.height || 1920}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generate Video
        </h3>
        
        {template && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Template: <span className="font-medium">{template.name}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Duration: {template.config.duration}s
            </p>
            {audioBlob && (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Audio narration included
              </p>
            )}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {isGenerating && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Generating video...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <button
          onClick={generateVideo}
          disabled={isGenerating || !template}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>
      </div>
    </div>
  )
}

// Simplified Canvas-based video generation for browser compatibility
async function generateCanvasVideo(
  template: VideoTemplate,
  content: { title: string; script: string },
  audioBlob: Blob | null | undefined,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const config = template.config
  const { width, height } = config.dimensions || { width: 1080, height: 1920 }
  const duration = config.duration || 10
  const fps = 30
  const totalFrames = fps * duration

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Create audio context for mixing audio if provided
  let audioContext: AudioContext | null = null
  let audioBuffer: AudioBuffer | null = null
  
  if (audioBlob) {
    try {
      audioContext = new AudioContext()
      const arrayBuffer = await audioBlob.arrayBuffer()
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.warn('Failed to process audio:', error)
    }
  }

  // Create video stream from canvas
  const stream = canvas.captureStream(fps)
  
  // Add audio track if available
  if (audioContext && audioBuffer) {
    try {
      const audioDestination = audioContext.createMediaStreamDestination()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioDestination)
      
      // Add audio track to video stream
      const audioTrack = audioDestination.stream.getAudioTracks()[0]
      if (audioTrack) {
        stream.addTrack(audioTrack)
      }
      
      // Start audio playback when recording starts
      source.start()
    } catch (error) {
      console.warn('Failed to add audio track:', error)
    }
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9'
  })

  const chunks: Blob[] = []
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      resolve(blob)
    }

    mediaRecorder.onerror = () => {
      reject(new Error('MediaRecorder error'))
    }

    let frame = 0
    const animate = () => {
      const progress = frame / totalFrames

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw background
      drawBackground(ctx, config.background, width, height)

      // Draw animated text
      drawAnimatedText(ctx, content.title, content.script, config, width, height, progress)

      onProgress(progress)

      frame++
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate)
      } else {
        mediaRecorder.stop()
      }
    }

    mediaRecorder.start()
    animate()
  })
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  background: { type?: string; value?: string } | undefined,
  width: number,
  height: number
) {
  const { type, value } = background || { type: 'color', value: '#000000' }

  switch (type) {
    case 'color':
      ctx.fillStyle = value || '#000000'
      ctx.fillRect(0, 0, width, height)
      break
    
    case 'gradient':
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      break
    
    default:
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
  }
}

function drawAnimatedText(
  ctx: CanvasRenderingContext2D,
  title: string,
  script: string,
  config: { text_styles?: Array<{ font_size?: number; color?: string; font_weight?: number }> },
  width: number,
  height: number,
  progress: number
) {
  const textStyles = config.text_styles || []

  // Title animation (fade in)
  if (title && progress <= 0.3) {
    const style = textStyles[0] || { font_size: 48, color: '#ffffff', font_weight: 800 }
    
    ctx.font = `${style.font_weight || 800} ${style.font_size || 48}px Arial`
    ctx.fillStyle = style.color || '#ffffff'
    ctx.textAlign = 'center'
    ctx.globalAlpha = Math.min(progress * 3, 1)
    
    ctx.fillText(title, width / 2, height * 0.3)
  }

  // Script animation (word by word)
  if (script && progress > 0.2) {
    const style = textStyles[1] || textStyles[0] || { font_size: 24, color: '#ffffff' }
    
    ctx.font = `${style.font_weight || 400} ${style.font_size || 24}px Arial`
    ctx.fillStyle = style.color || '#ffffff'
    ctx.textAlign = 'center'
    ctx.globalAlpha = 1

    const words = script.split(' ')
    const scriptProgress = (progress - 0.2) / 0.8
    const wordsToShow = Math.floor(words.length * scriptProgress)
    const visibleText = words.slice(0, wordsToShow).join(' ')
    
    // Simple word wrapping
    const maxWidth = width * 0.8
    const lines = wrapText(ctx, visibleText, maxWidth)
    const lineHeight = (style.font_size || 24) * 1.2
    const startY = height * 0.6

    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * lineHeight))
    })
  }

  ctx.globalAlpha = 1
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}