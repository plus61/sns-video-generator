import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { VideoTemplate } from '@/types'

export class VideoGenerator {
  private ffmpeg: FFmpeg | null = null
  private isLoaded = false

  async load() {
    if (this.isLoaded) return

    this.ffmpeg = new FFmpeg()
    
    // Load FFmpeg WASM files
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.2/dist/umd'
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    })

    this.isLoaded = true
  }

  async generateVideo(
    template: VideoTemplate,
    content: {
      title: string
      script: string
    }
  ): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      throw new Error('FFmpeg not loaded')
    }

    try {
      // Generate frames using Canvas
      const frames = await this.generateFrames(template, content)
      
      // Write frames to FFmpeg filesystem
      for (let i = 0; i < frames.length; i++) {
        const filename = `frame${i.toString().padStart(4, '0')}.png`
        await this.ffmpeg.writeFile(filename, await fetchFile(frames[i]))
      }

      // Generate video from frames
      const fps = 30

      const duration = template.config.duration || 10
      await this.ffmpeg.exec([
        '-r', fps.toString(),
        '-i', 'frame%04d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-t', duration.toString(),
        'output.mp4'
      ])

      // Read generated video
      const data = await this.ffmpeg.readFile('output.mp4')
      
      // Clean up
      await this.cleanup()

      return new Blob([data], { type: 'video/mp4' })
    } catch (error) {
      console.error('Video generation error:', error)
      throw error
    }
  }

  private async generateFrames(
    template: VideoTemplate,
    content: { title: string; script: string }
  ): Promise<Blob[]> {
    const config = template.config
    const { width, height } = config.dimensions || { width: 1080, height: 1920 }
    const duration = config.duration || 10
    const fps = 30
    const totalFrames = fps * duration
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    const frames: Blob[] = []

    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / totalFrames

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw background
      await this.drawBackground(ctx, config.background, width, height)

      // Draw text with animations
      await this.drawAnimatedText(
        ctx,
        content.title,
        content.script,
        config,
        width,
        height,
        progress
      )

      // Convert frame to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      })
      
      frames.push(blob)
    }

    return frames
  }

  private async drawBackground(
    ctx: CanvasRenderingContext2D,
    background: { type?: string; value?: string },
    width: number,
    height: number
  ) {
    const { type, value } = background

    switch (type) {
      case 'color':
        ctx.fillStyle = value || '#000000'
        ctx.fillRect(0, 0, width, height)
        break
      
      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        // Parse gradient (simplified)
        if (value && value.includes('linear-gradient')) {
          gradient.addColorStop(0, '#667eea')
          gradient.addColorStop(1, '#764ba2')
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        break
      
      default:
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, width, height)
    }
  }

  private async drawAnimatedText(
    ctx: CanvasRenderingContext2D,
    title: string,
    script: string,
    config: { text_styles?: Array<{ font_weight?: number; font_size?: number; color?: string }>; animation_presets?: Array<{ type?: string }> },
    width: number,
    height: number,
    progress: number
  ) {
    const textStyles = config.text_styles || []
    const animations = config.animation_presets || []

    // Title text
    if (title && textStyles[0]) {
      const style = textStyles[0]
      const animation = animations[0]
      
      this.applyTextStyle(ctx, style)
      
      const x = width / 2
      const y = height * 0.3
      
      // Apply animation
      const animatedY = this.applyAnimation(y, animation, progress)
      const alpha = this.applyFadeAnimation(animation, progress)
      
      ctx.globalAlpha = alpha
      ctx.textAlign = 'center'
      ctx.fillText(title, x, animatedY)
    }

    // Script text (word by word revelation)
    if (script && textStyles[1]) {
      const style = textStyles[1] || textStyles[0]
      this.applyTextStyle(ctx, style)
      
      const words = script.split(' ')
      const wordsToShow = Math.floor(words.length * progress)
      const visibleText = words.slice(0, wordsToShow).join(' ')
      
      ctx.globalAlpha = 1
      ctx.textAlign = 'center'
      
      // Word wrap
      const lines = this.wrapText(ctx, visibleText, width * 0.8)
      const lineHeight = (style.font_size || 24) * 1.2
      const startY = height * 0.6
      
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + (index * lineHeight))
      })
    }

    ctx.globalAlpha = 1
  }

  private applyTextStyle(ctx: CanvasRenderingContext2D, style: { font_weight?: number; font_size?: number; font_family?: string; color?: string; background_color?: string }) {
    ctx.font = `${style.font_weight || 400} ${style.font_size}px ${style.font_family || 'Arial'}`
    ctx.fillStyle = style.color || '#ffffff'
    
    if (style.background_color) {
      // Add text background implementation if needed
    }
  }

  private applyAnimation(originalValue: number, animation: { type?: string; duration?: number; easing?: string }, progress: number): number {
    if (!animation) return originalValue

    const { type } = animation
    const animProgress = Math.min(progress * 2, 1) // Animation happens in first half

    switch (type) {
      case 'slide':
        return originalValue - (50 * (1 - animProgress))
      case 'fade':
        return originalValue
      default:
        return originalValue
    }
  }

  private applyFadeAnimation(animation: { type?: string }, progress: number): number {
    if (!animation || animation.type !== 'fade') return 1
    
    const animProgress = Math.min(progress * 2, 1)
    return animProgress
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

  private async cleanup() {
    if (!this.ffmpeg) return

    try {
      // Remove all files from FFmpeg filesystem
      const files = await this.ffmpeg.listDir('/')
      for (const file of files) {
        if (file.name !== '.' && file.name !== '..') {
          await this.ffmpeg.deleteFile(file.name)
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error)
    }
  }
}

// Singleton instance
let videoGenerator: VideoGenerator | null = null

export async function getVideoGenerator(): Promise<VideoGenerator> {
  if (!videoGenerator) {
    videoGenerator = new VideoGenerator()
    await videoGenerator.load()
  }
  return videoGenerator
}