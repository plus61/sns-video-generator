export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface TextStyle {
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor?: string
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  textAlign: 'left' | 'center' | 'right'
  textDecoration: 'none' | 'underline' | 'line-through'
  lineHeight?: number
  letterSpacing?: number
  textShadow?: string
  strokeColor?: string
  strokeWidth?: number
}

export interface TextTiming {
  startTime: number
  endTime: number
  fadeIn: number
  fadeOut: number
}

export interface TextAnimation {
  type: 'none' | 'fadeIn' | 'slideIn' | 'scaleIn' | 'typewriter' | 'bounce'
  direction?: 'left' | 'right' | 'top' | 'bottom'
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  delay?: number
}

export interface TextElement {
  id: string
  content: string
  position: Position
  size: Size
  style: TextStyle
  timing: TextTiming
  animation?: TextAnimation
  layer: number
  visible: boolean
  locked?: boolean
}

export interface TextStylePreset {
  name: string
  style: Partial<TextStyle>
}

export interface RenderInstruction {
  element: TextElement
  opacity: number
  transform: string
  lines: string[]
}

export interface CanvasBounds {
  width: number
  height: number
}

export class VideoTextEditor {
  private elements: Map<string, TextElement> = new Map()
  private snapToGrid: boolean = false
  private gridSize: number = 10
  private canvasBounds: CanvasBounds = { width: 1920, height: 1080 }
  private availableFonts: string[] = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Impact',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Noto Sans JP',
    'Hiragino Sans',
    'Yu Gothic',
    'Meiryo'
  ]

  /**
   * Load text elements into the editor
   */
  loadElements(elements: TextElement[]): void {
    this.elements.clear()
    elements.forEach(element => {
      this.elements.set(element.id, { ...element })
    })
  }

  /**
   * Get all text elements
   */
  getAllElements(): TextElement[] {
    return Array.from(this.elements.values())
  }

  /**
   * Get element by ID
   */
  getElementById(id: string): TextElement | null {
    return this.elements.get(id) || null
  }

  /**
   * Add new text element
   */
  addElement(elementData: Partial<TextElement>): TextElement {
    const id = elementData.id || `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const defaultElement: TextElement = {
      id,
      content: elementData.content || 'New Text',
      position: elementData.position || { x: 50, y: 50 },
      size: elementData.size || { width: 200, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textAlign: 'center',
        textDecoration: 'none',
        ...elementData.style
      },
      timing: {
        startTime: 0,
        endTime: 5,
        fadeIn: 0.5,
        fadeOut: 0.5,
        ...elementData.timing
      },
      layer: elementData.layer || this.getNextLayer(),
      visible: elementData.visible !== false,
      locked: elementData.locked || false,
      animation: elementData.animation
    }

    this.elements.set(id, defaultElement)
    return defaultElement
  }

  /**
   * Update existing text element
   */
  updateElement(id: string, updates: Partial<TextElement>): TextElement | null {
    const element = this.elements.get(id)
    if (!element) return null

    const updatedElement = {
      ...element,
      ...updates,
      style: { ...element.style, ...updates.style },
      timing: { ...element.timing, ...updates.timing }
    }

    this.elements.set(id, updatedElement)
    return updatedElement
  }

  /**
   * Delete text element
   */
  deleteElement(id: string): boolean {
    return this.elements.delete(id)
  }

  /**
   * Update element position
   */
  updatePosition(id: string, position: Position): boolean {
    const element = this.elements.get(id)
    if (!element || element.locked) return false

    const newPosition = { ...position }

    // Apply snap to grid
    if (this.snapToGrid) {
      newPosition.x = Math.round(newPosition.x / this.gridSize) * this.gridSize
      newPosition.y = Math.round(newPosition.y / this.gridSize) * this.gridSize
    }

    // Enforce canvas boundaries
    newPosition.x = Math.max(0, Math.min(newPosition.x, this.canvasBounds.width - element.size.width))
    newPosition.y = Math.max(0, Math.min(newPosition.y, this.canvasBounds.height - element.size.height))

    element.position = newPosition
    return true
  }

  /**
   * Update element size
   */
  updateSize(id: string, size: Size): boolean {
    const element = this.elements.get(id)
    if (!element || element.locked) return false

    // Enforce minimum and maximum sizes
    const newSize = {
      width: Math.max(20, Math.min(size.width, this.canvasBounds.width)),
      height: Math.max(10, Math.min(size.height, this.canvasBounds.height))
    }

    element.size = newSize

    // Adjust position if element goes out of bounds
    this.updatePosition(id, element.position)
    return true
  }

  /**
   * Update element style
   */
  updateStyle(id: string, styleUpdates: Partial<TextStyle>): boolean {
    const element = this.elements.get(id)
    if (!element) return false

    element.style = { ...element.style, ...styleUpdates }
    return true
  }

  /**
   * Apply style preset to element
   */
  applyStylePreset(id: string, preset: TextStylePreset): boolean {
    return this.updateStyle(id, preset.style)
  }

  /**
   * Update element timing
   */
  updateTiming(id: string, timing: Partial<TextTiming>): boolean {
    const element = this.elements.get(id)
    if (!element) return false

    element.timing = { ...element.timing, ...timing }
    return true
  }

  /**
   * Update element animation
   */
  updateAnimation(id: string, animation: TextAnimation): boolean {
    const element = this.elements.get(id)
    if (!element) return false

    element.animation = animation
    return true
  }

  /**
   * Get elements visible at specific time
   */
  getElementsAtTime(time: number): TextElement[] {
    return this.getAllElements().filter(element => 
      element.visible && 
      time >= element.timing.startTime && 
      time <= element.timing.endTime
    )
  }

  /**
   * Move element to front (highest layer)
   */
  moveToFront(id: string): boolean {
    const element = this.elements.get(id)
    if (!element) return false

    const maxLayer = Math.max(...this.getAllElements().map(e => e.layer))
    element.layer = maxLayer + 1
    return true
  }

  /**
   * Move element to back (lowest layer)
   */
  moveToBack(id: string): boolean {
    const element = this.elements.get(id)
    if (!element) return false

    const minLayer = Math.min(...this.getAllElements().map(e => e.layer))
    element.layer = minLayer - 1
    return true
  }

  /**
   * Get elements sorted by layer
   */
  getElementsSortedByLayer(): TextElement[] {
    return this.getAllElements().sort((a, b) => a.layer - b.layer)
  }

  /**
   * Set snap to grid
   */
  setSnapToGrid(enabled: boolean, gridSize?: number): void {
    this.snapToGrid = enabled
    if (gridSize !== undefined) {
      this.gridSize = gridSize
    }
  }

  /**
   * Set canvas bounds
   */
  setCanvasBounds(bounds: CanvasBounds): void {
    this.canvasBounds = bounds
  }

  /**
   * Get available fonts
   */
  getAvailableFonts(): string[] {
    return [...this.availableFonts]
  }

  /**
   * Wrap text to fit within specified width
   */
  wrapText(text: string, maxWidth: number, font: string): string[] {
    // This is a simplified implementation
    // In a real implementation, you would use Canvas.measureText()
    const words = text.split(' ')
    const lines: string[] = []
    
    if (words.length === 0) return ['']
    
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      // Estimate character width (simplified) - use smaller multiplier for more wrapping
      const fontSizeMatch = font.match(/\d+/)
      const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[0]) : 16
      // For Japanese text, use larger multiplier since characters are wider
      const charWidth = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) ? fontSize * 0.8 : fontSize * 0.6
      const estimatedWidth = testLine.length * charWidth
      
      if (estimatedWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    return lines
  }

  /**
   * Calculate text dimensions
   */
  calculateTextDimensions(text: string, font: string): Size {
    // Simplified calculation - in real implementation use Canvas.measureText()
    const fontSize = parseInt(font)
    const lines = text.split('\n')
    const maxLineLength = Math.max(...lines.map(line => line.length))
    
    return {
      width: maxLineLength * fontSize * 0.6,
      height: lines.length * fontSize * 1.2
    }
  }

  /**
   * Calculate opacity based on timing and fade settings
   */
  calculateOpacity(id: string, currentTime: number): number {
    const element = this.elements.get(id)
    if (!element || !element.visible) return 0

    const { startTime, endTime, fadeIn, fadeOut } = element.timing

    if (currentTime < startTime || currentTime > endTime) return 0

    // Fade in
    if (currentTime < startTime + fadeIn) {
      return (currentTime - startTime) / fadeIn
    }

    // Fade out
    if (currentTime > endTime - fadeOut) {
      return (endTime - currentTime) / fadeOut
    }

    return 1
  }

  /**
   * Generate render instructions for canvas
   */
  generateRenderInstructions(currentTime: number): RenderInstruction[] {
    const visibleElements = this.getElementsAtTime(currentTime)
    const sortedElements = visibleElements.sort((a, b) => a.layer - b.layer)

    return sortedElements.map(element => {
      const opacity = this.calculateOpacity(element.id, currentTime)
      const lines = element.content.split('\n')
      
      let transform = ''
      if (element.animation) {
        transform = this.generateAnimationTransform(element, currentTime)
      }

      return {
        element,
        opacity,
        transform,
        lines
      }
    })
  }

  /**
   * Export elements to JSON
   */
  exportToJSON(): string {
    const exportData = {
      version: '1.0',
      elements: this.getAllElements(),
      canvasBounds: this.canvasBounds,
      settings: {
        snapToGrid: this.snapToGrid,
        gridSize: this.gridSize
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import elements from JSON
   */
  importFromJSON(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      
      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Invalid data format: missing elements array')
      }

      this.loadElements(data.elements)
      
      if (data.canvasBounds) {
        this.canvasBounds = data.canvasBounds
      }
      
      if (data.settings) {
        this.snapToGrid = data.settings.snapToGrid || false
        this.gridSize = data.settings.gridSize || 10
      }
    } catch (error) {
      throw new Error(`Failed to import JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get next available layer number
   */
  private getNextLayer(): number {
    const layers = this.getAllElements().map(e => e.layer)
    return layers.length === 0 ? 1 : Math.max(...layers) + 1
  }

  /**
   * Generate animation transform CSS
   */
  private generateAnimationTransform(element: TextElement, currentTime: number): string {
    if (!element.animation || element.animation.type === 'none') return ''

    const { startTime } = element.timing
    const { type, direction, duration } = element.animation
    const animationProgress = Math.min((currentTime - startTime) / duration, 1)

    let transform = ''

    switch (type) {
      case 'slideIn':
        if (direction === 'left') {
          const translateX = (1 - animationProgress) * -100
          transform = `translateX(${translateX}%)`
        } else if (direction === 'right') {
          const translateX = (1 - animationProgress) * 100
          transform = `translateX(${translateX}%)`
        } else if (direction === 'top') {
          const translateY = (1 - animationProgress) * -100
          transform = `translateY(${translateY}%)`
        } else if (direction === 'bottom') {
          const translateY = (1 - animationProgress) * 100
          transform = `translateY(${translateY}%)`
        }
        break

      case 'scaleIn':
        const scale = animationProgress
        transform = `scale(${scale})`
        break

      case 'bounce':
        if (animationProgress < 1) {
          const bounceValue = Math.sin(animationProgress * Math.PI * 4) * (1 - animationProgress)
          transform = `translateY(${bounceValue * -20}px)`
        }
        break
    }

    return transform
  }
}