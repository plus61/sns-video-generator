import { VideoTextEditor, TextElement, TextAnimation } from '../video-text-editor'

const mockTextElements: TextElement[] = [
  {
    id: 'text-1',
    content: 'サンプルテキスト',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 40 },
    style: {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      fontWeight: 'normal',
      textAlign: 'center',
      textDecoration: 'none'
    },
    timing: {
      startTime: 0,
      endTime: 5,
      fadeIn: 0.5,
      fadeOut: 0.5
    },
    layer: 1,
    visible: true
  },
  {
    id: 'text-2',
    content: '字幕テキスト',
    position: { x: 0, y: 400 },
    size: { width: 640, height: 60 },
    style: {
      fontSize: 32,
      fontFamily: 'Noto Sans JP',
      color: '#ffff00',
      backgroundColor: 'transparent',
      fontWeight: 'bold',
      textAlign: 'center',
      textDecoration: 'none'
    },
    timing: {
      startTime: 2,
      endTime: 8,
      fadeIn: 0.3,
      fadeOut: 0.3
    },
    layer: 2,
    visible: true
  }
]

describe('VideoTextEditor', () => {
  let textEditor: VideoTextEditor

  beforeEach(() => {
    textEditor = new VideoTextEditor()
    textEditor.loadElements(mockTextElements)
  })

  describe('Text Element Management', () => {
    it('should load text elements correctly', () => {
      expect(textEditor.getAllElements()).toHaveLength(2)
      expect(textEditor.getElementById('text-1')).toEqual(mockTextElements[0])
    })

    it('should add new text element', () => {
      const newElement: Partial<TextElement> = {
        content: '新しいテキスト',
        position: { x: 100, y: 100 },
        style: {
          fontSize: 20,
          color: '#000000'
        }
      }

      const addedElement = textEditor.addElement(newElement)
      expect(addedElement.id).toBeDefined()
      expect(addedElement.content).toBe('新しいテキスト')
      expect(textEditor.getAllElements()).toHaveLength(3)
    })

    it('should update existing text element', () => {
      const updates = {
        content: '更新されたテキスト',
        position: { x: 75, y: 75 }
      }

      const updated = textEditor.updateElement('text-1', updates)
      expect(updated?.content).toBe('更新されたテキスト')
      expect(updated?.position).toEqual({ x: 75, y: 75 })
    })

    it('should delete text element', () => {
      textEditor.deleteElement('text-1')
      expect(textEditor.getAllElements()).toHaveLength(1)
      expect(textEditor.getElementById('text-1')).toBeNull()
    })

    it('should return null for non-existent element', () => {
      expect(textEditor.getElementById('non-existent')).toBeNull()
    })
  })

  describe('Position and Size Management', () => {
    it('should update element position', () => {
      textEditor.updatePosition('text-1', { x: 200, y: 150 })
      const element = textEditor.getElementById('text-1')
      expect(element?.position).toEqual({ x: 200, y: 150 })
    })

    it('should update element size', () => {
      textEditor.updateSize('text-1', { width: 300, height: 80 })
      const element = textEditor.getElementById('text-1')
      expect(element?.size).toEqual({ width: 300, height: 80 })
    })

    it('should snap to grid when enabled', () => {
      textEditor.setSnapToGrid(true, 10)
      textEditor.updatePosition('text-1', { x: 23, y: 37 })
      const element = textEditor.getElementById('text-1')
      expect(element?.position).toEqual({ x: 20, y: 40 })
    })

    it('should enforce canvas boundaries', () => {
      textEditor.setCanvasBounds({ width: 640, height: 480 })
      textEditor.updatePosition('text-1', { x: 700, y: 500 })
      const element = textEditor.getElementById('text-1')
      expect(element?.position.x).toBeLessThanOrEqual(640 - (element?.size.width || 0))
      expect(element?.position.y).toBeLessThanOrEqual(480 - (element?.size.height || 0))
    })
  })

  describe('Style Management', () => {
    it('should update text style properties', () => {
      const newStyle = {
        fontSize: 36,
        color: '#ff0000',
        fontWeight: 'bold' as const
      }

      textEditor.updateStyle('text-1', newStyle)
      const element = textEditor.getElementById('text-1')
      expect(element?.style.fontSize).toBe(36)
      expect(element?.style.color).toBe('#ff0000')
      expect(element?.style.fontWeight).toBe('bold')
    })

    it('should apply text presets', () => {
      const preset = {
        name: 'タイトルスタイル',
        style: {
          fontSize: 48,
          fontFamily: 'Impact',
          color: '#ffffff',
          textAlign: 'center' as const,
          fontWeight: 'bold' as const
        }
      }

      textEditor.applyStylePreset('text-1', preset)
      const element = textEditor.getElementById('text-1')
      expect(element?.style.fontSize).toBe(48)
      expect(element?.style.fontFamily).toBe('Impact')
    })

    it('should get available font families', () => {
      const fonts = textEditor.getAvailableFonts()
      expect(fonts).toContain('Arial')
      expect(fonts).toContain('Noto Sans JP')
      expect(fonts.length).toBeGreaterThan(0)
    })
  })

  describe('Timing and Animation', () => {
    it('should update timing properties', () => {
      const timing = {
        startTime: 1,
        endTime: 6,
        fadeIn: 1.0,
        fadeOut: 1.0
      }

      textEditor.updateTiming('text-1', timing)
      const element = textEditor.getElementById('text-1')
      expect(element?.timing).toEqual(timing)
    })

    it('should get elements visible at specific time', () => {
      const visibleElements = textEditor.getElementsAtTime(3)
      expect(visibleElements).toHaveLength(2)
      expect(visibleElements.map(e => e.id)).toContain('text-1')
      expect(visibleElements.map(e => e.id)).toContain('text-2')
    })

    it('should get elements not visible at specific time', () => {
      const visibleElements = textEditor.getElementsAtTime(10)
      expect(visibleElements).toHaveLength(0)
    })

    it('should handle animation properties', () => {
      const animation: TextAnimation = {
        type: 'slideIn',
        direction: 'left',
        duration: 1.0,
        easing: 'ease-in-out'
      }

      textEditor.updateAnimation('text-1', animation)
      const element = textEditor.getElementById('text-1')
      expect(element?.animation).toEqual(animation)
    })
  })

  describe('Layer Management', () => {
    it('should move element to front', () => {
      textEditor.moveToFront('text-1')
      const element = textEditor.getElementById('text-1')
      const maxLayer = Math.max(...textEditor.getAllElements().map(e => e.layer))
      expect(element?.layer).toBe(maxLayer)
    })

    it('should move element to back', () => {
      textEditor.moveToBack('text-2')
      const element = textEditor.getElementById('text-2')
      const minLayer = Math.min(...textEditor.getAllElements().map(e => e.layer))
      expect(element?.layer).toBe(minLayer)
    })

    it('should get elements sorted by layer', () => {
      const sortedElements = textEditor.getElementsSortedByLayer()
      expect(sortedElements[0].layer).toBeLessThanOrEqual(sortedElements[1].layer)
    })
  })

  describe('Text Formatting', () => {
    it('should wrap text to fit width', () => {
      const shortText = 'Short text'
      const wrappedLines = textEditor.wrapText(shortText, 200, '16px Arial')
      
      expect(wrappedLines.length).toBeGreaterThanOrEqual(1)
      expect(wrappedLines.every(line => line.length > 0)).toBe(true)
    })

    it('should calculate text dimensions', () => {
      const dimensions = textEditor.calculateTextDimensions('サンプル', '24px Arial')
      expect(dimensions.width).toBeGreaterThan(0)
      expect(dimensions.height).toBeGreaterThan(0)
    })

    it('should handle multi-line text', () => {
      const multilineText = '1行目\n2行目\n3行目'
      textEditor.updateElement('text-1', { content: multilineText })
      
      const element = textEditor.getElementById('text-1')
      expect(element?.content).toBe(multilineText)
    })
  })

  describe('Export and Import', () => {
    it('should export elements to JSON', () => {
      const exported = textEditor.exportToJSON()
      const parsed = JSON.parse(exported)
      
      expect(parsed.elements).toHaveLength(2)
      expect(parsed.version).toBeDefined()
      expect(parsed.elements[0].id).toBe('text-1')
    })

    it('should import elements from JSON', () => {
      const exportData = textEditor.exportToJSON()
      
      const newEditor = new VideoTextEditor()
      newEditor.importFromJSON(exportData)
      
      expect(newEditor.getAllElements()).toHaveLength(2)
      expect(newEditor.getElementById('text-1')).toBeTruthy()
    })

    it('should validate import data format', () => {
      const invalidData = '{"invalid": "data"}'
      expect(() => textEditor.importFromJSON(invalidData)).toThrow()
    })
  })

  describe('Canvas Rendering', () => {
    it('should generate render instructions', () => {
      const instructions = textEditor.generateRenderInstructions(3)
      
      expect(instructions).toHaveLength(2) // Both elements visible at time 3
      expect(instructions[0]).toHaveProperty('element')
      expect(instructions[0]).toHaveProperty('opacity')
      expect(instructions[0]).toHaveProperty('transform')
    })

    it('should calculate opacity based on timing', () => {
      const opacity = textEditor.calculateOpacity('text-1', 0.25) // During fade-in
      expect(opacity).toBeGreaterThan(0)
      expect(opacity).toBeLessThan(1)
    })

    it('should handle elements outside canvas bounds', () => {
      textEditor.setCanvasBounds({ width: 640, height: 480 })
      textEditor.updatePosition('text-1', { x: 700, y: 100 })
      
      const instructions = textEditor.generateRenderInstructions(3)
      const outOfBoundsElement = instructions.find(i => i.element.id === 'text-1')
      expect(outOfBoundsElement?.element.position.x).toBeLessThan(640)
    })
  })
})