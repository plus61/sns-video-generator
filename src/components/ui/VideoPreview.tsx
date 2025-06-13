'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { VideoTemplate } from '@/types'

interface VideoPreviewProps {
  template: VideoTemplate | null
  content: {
    title: string
    script: string
  }
  className?: string
}

export function VideoPreview({ template, content, className = '' }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const animationRef = useRef<number | null>(null)

  const duration = template?.config.duration || 10

  const drawFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current
    if (!canvas || !template) return

    const ctx = canvas.getContext('2d')!
    const config = template.config
    const { width, height } = config.dimensions || { width: 1080, height: 1920 }

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    drawBackground(ctx, config.background, width, height)

    // Draw animated text
    drawAnimatedText(ctx, content.title, content.script, config, width, height, progress)
  }, [template, content])

  useEffect(() => {
    if (template && content.title && canvasRef.current) {
      drawFrame(currentTime / duration)
    }
  }, [template, content, currentTime, duration, drawFrame])

  const play = () => {
    if (isPlaying) return

    setIsPlaying(true)
    const startTime = Date.now() - (currentTime * 1000)

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      
      if (elapsed >= duration) {
        setCurrentTime(duration)
        setIsPlaying(false)
        return
      }

      setCurrentTime(elapsed)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const pause = () => {
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const reset = () => {
    pause()
    setCurrentTime(0)
  }

  const seek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!template) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Select a template to preview</p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Canvas Container */}
      <div className="relative bg-black flex items-center justify-center" style={{ aspectRatio: '9/16' }}>
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{
            width: 'auto',
            height: '100%',
            maxWidth: '100%'
          }}
        />
        
        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={isPlaying ? pause : play}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-4 transition-all duration-200"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[3rem]">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[3rem]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={reset}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title="Reset"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => seek(currentTime + 1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title="Forward 1s"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.75 7L21 12l-7.25 5v-3.5c-3.31 0-6.69.94-9.75 2.5 1.06-5.06 4.06-8.5 9.75-9.5V7z" />
            </svg>
          </button>
        </div>

        {/* Template Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {template.name} • {template.config.dimensions?.width}×{template.config.dimensions?.height}
        </div>
      </div>
    </div>
  )
}

// Helper functions (same as VideoGenerator)
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