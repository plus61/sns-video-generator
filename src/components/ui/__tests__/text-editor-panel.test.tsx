import { render, screen, fireEvent } from '@testing-library/react'
import { TextEditorPanel } from '../TextEditorPanel'
import { TextElement } from '@/lib/video-text-editor'

const mockOnElementAdd = jest.fn()
const mockOnElementUpdate = jest.fn()
const mockOnElementDelete = jest.fn()
const mockOnElementSelect = jest.fn()

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
  }
]

const defaultProps = {
  elements: mockTextElements,
  selectedElementId: null,
  currentTime: 2,
  videoDuration: 10,
  canvasSize: { width: 640, height: 480 },
  onElementAdd: mockOnElementAdd,
  onElementUpdate: mockOnElementUpdate,
  onElementDelete: mockOnElementDelete,
  onElementSelect: mockOnElementSelect
}

describe('TextEditorPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Text Element List', () => {
    it('should render text elements list', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      expect(screen.getByTestId('text-editor-panel')).toBeInTheDocument()
      expect(screen.getByTestId('text-element-text-1')).toBeInTheDocument()
      expect(screen.getByText('サンプルテキスト')).toBeInTheDocument()
    })

    it('should show element visibility toggle', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      const visibilityToggle = screen.getByTestId('visibility-toggle-text-1')
      expect(visibilityToggle).toBeInTheDocument()
      expect(visibilityToggle).toHaveClass('visible')
    })

    it('should show element layer information', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      expect(screen.getByText('レイヤー 1')).toBeInTheDocument()
    })

    it('should indicate active elements at current time', () => {
      render(<TextEditorPanel {...defaultProps} currentTime={2} />)
      
      const element = screen.getByTestId('text-element-text-1')
      expect(element).toHaveClass('active')
    })
  })

  describe('Text Element Selection', () => {
    it('should select element when clicked', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      const element = screen.getByTestId('text-element-text-1')
      fireEvent.click(element)
      
      expect(mockOnElementSelect).toHaveBeenCalledWith('text-1')
    })

    it('should highlight selected element', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      // Click list tab to see the element
      fireEvent.click(screen.getByText('テキスト一覧'))
      
      const element = screen.getByTestId('text-element-text-1')
      expect(element).toHaveClass('selected')
    })

    it('should show element actions when selected', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      // Click list tab to see the element
      fireEvent.click(screen.getByText('テキスト一覧'))
      
      expect(screen.getByTestId('delete-element-text-1')).toBeInTheDocument()
      expect(screen.getByTestId('duplicate-element-text-1')).toBeInTheDocument()
    })
  })

  describe('Text Element Creation', () => {
    it('should show add text button', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      const addButton = screen.getByTestId('add-text-button')
      expect(addButton).toBeInTheDocument()
      expect(addButton).toHaveTextContent('テキストを追加')
    })

    it('should add new text element when button clicked', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      const addButton = screen.getByTestId('add-text-button')
      fireEvent.click(addButton)
      
      expect(mockOnElementAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '新しいテキスト',
          position: expect.any(Object),
          style: expect.any(Object)
        })
      )
    })

    it('should show text presets dropdown', () => {
      render(<TextEditorPanel {...defaultProps} />)
      
      const presetsDropdown = screen.getByTestId('text-presets-dropdown')
      expect(presetsDropdown).toBeInTheDocument()
      
      fireEvent.click(presetsDropdown)
      expect(screen.getByText('タイトル')).toBeInTheDocument()
      expect(screen.getByText('字幕')).toBeInTheDocument()
    })
  })

  describe('Text Properties Panel', () => {
    it('should show properties panel when element selected', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      expect(screen.getByTestId('text-properties-panel')).toBeInTheDocument()
      expect(screen.getByText('テキスト設定')).toBeInTheDocument()
    })

    it('should show text content input', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const textInput = screen.getByTestId('text-content-input')
      expect(textInput).toBeInTheDocument()
      expect(textInput).toHaveValue('サンプルテキスト')
    })

    it('should update text content when input changes', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const textInput = screen.getByTestId('text-content-input')
      fireEvent.change(textInput, { target: { value: '更新されたテキスト' } })
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        content: '更新されたテキスト'
      })
    })

    it('should show font family selector', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const fontSelector = screen.getByTestId('font-family-selector')
      expect(fontSelector).toBeInTheDocument()
      expect(fontSelector).toHaveValue('Arial')
    })

    it('should show font size input', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const fontSizeInput = screen.getByTestId('font-size-input')
      expect(fontSizeInput).toBeInTheDocument()
      expect(fontSizeInput).toHaveValue(24)
    })

    it('should show color picker', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const colorPicker = screen.getByTestId('text-color-picker')
      expect(colorPicker).toBeInTheDocument()
      expect(colorPicker).toHaveValue('#ffffff')
    })
  })

  describe('Position and Size Controls', () => {
    it('should show position inputs', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const xInput = screen.getByTestId('position-x-input')
      const yInput = screen.getByTestId('position-y-input')
      
      expect(xInput).toBeInTheDocument()
      expect(yInput).toBeInTheDocument()
      expect(xInput).toHaveValue(50)
      expect(yInput).toHaveValue(50)
    })

    it('should update position when inputs change', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const xInput = screen.getByTestId('position-x-input')
      fireEvent.change(xInput, { target: { value: '100' } })
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        position: { x: 100, y: 50 }
      })
    })

    it('should show size inputs', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const widthInput = screen.getByTestId('size-width-input')
      const heightInput = screen.getByTestId('size-height-input')
      
      expect(widthInput).toBeInTheDocument()
      expect(heightInput).toBeInTheDocument()
      expect(widthInput).toHaveValue(200)
      expect(heightInput).toHaveValue(40)
    })

    it('should show alignment buttons', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      expect(screen.getByTestId('align-left-button')).toBeInTheDocument()
      expect(screen.getByTestId('align-center-button')).toBeInTheDocument()
      expect(screen.getByTestId('align-right-button')).toBeInTheDocument()
    })
  })

  describe('Timing Controls', () => {
    it('should show timing panel', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      expect(screen.getByTestId('timing-panel')).toBeInTheDocument()
      expect(screen.getByText('表示タイミング')).toBeInTheDocument()
    })

    it('should show start and end time inputs', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const startTimeInput = screen.getByTestId('start-time-input')
      const endTimeInput = screen.getByTestId('end-time-input')
      
      expect(startTimeInput).toBeInTheDocument()
      expect(endTimeInput).toBeInTheDocument()
      expect(startTimeInput).toHaveValue(0)
      expect(endTimeInput).toHaveValue(5)
    })

    it('should update timing when inputs change', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const startTimeInput = screen.getByTestId('start-time-input')
      fireEvent.change(startTimeInput, { target: { value: '1' } })
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        timing: expect.objectContaining({
          startTime: 1
        })
      })
    })

    it('should show fade controls', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const fadeInInput = screen.getByTestId('fade-in-input')
      const fadeOutInput = screen.getByTestId('fade-out-input')
      
      expect(fadeInInput).toBeInTheDocument()
      expect(fadeOutInput).toBeInTheDocument()
    })
  })

  describe('Layer Management', () => {
    it('should show layer controls', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      expect(screen.getByTestId('move-to-front-button')).toBeInTheDocument()
      expect(screen.getByTestId('move-to-back-button')).toBeInTheDocument()
    })

    it('should move element to front when button clicked', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const moveToFrontButton = screen.getByTestId('move-to-front-button')
      fireEvent.click(moveToFrontButton)
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        layer: expect.any(Number)
      })
    })

    it('should move element to back when button clicked', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const moveToBackButton = screen.getByTestId('move-to-back-button')
      fireEvent.click(moveToBackButton)
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        layer: expect.any(Number)
      })
    })
  })

  describe('Animation Controls', () => {
    it('should show animation dropdown', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const animationDropdown = screen.getByTestId('animation-type-dropdown')
      expect(animationDropdown).toBeInTheDocument()
    })

    it('should show animation direction options', () => {
      // Create element with slideIn animation
      const mockElementsWithAnimation: TextElement[] = [{
        ...mockTextElements[0],
        animation: {
          type: 'slideIn',
          direction: 'left',
          duration: 1,
          easing: 'ease-in-out'
        }
      }]
      
      render(<TextEditorPanel {...defaultProps} elements={mockElementsWithAnimation} selectedElementId="text-1" />)
      
      const directionDropdown = screen.getByTestId('animation-direction-dropdown')
      expect(directionDropdown).toBeInTheDocument()
    })

    it('should update animation when settings change', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      const animationDropdown = screen.getByTestId('animation-type-dropdown')
      fireEvent.change(animationDropdown, { target: { value: 'fadeIn' } })
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith('text-1', {
        animation: expect.objectContaining({
          type: 'fadeIn'
        })
      })
    })
  })

  describe('Text Deletion', () => {
    it('should delete element when delete button clicked', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      // Click list tab to see the element
      fireEvent.click(screen.getByText('テキスト一覧'))
      
      const deleteButton = screen.getByTestId('delete-element-text-1')
      fireEvent.click(deleteButton)
      
      expect(screen.getByText('テキストを削除しますか？')).toBeInTheDocument()
    })

    it('should show confirmation dialog for deletion', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      // Click list tab to see the element
      fireEvent.click(screen.getByText('テキスト一覧'))
      
      const deleteButton = screen.getByTestId('delete-element-text-1')
      fireEvent.click(deleteButton)
      
      expect(screen.getByText('テキストを削除しますか？')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should delete selected element with Delete key', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      fireEvent.keyDown(document, { key: 'Delete' })
      
      // Should show confirmation dialog
      expect(screen.getByText('テキストを削除しますか？')).toBeInTheDocument()
    })

    it('should duplicate element with Ctrl+D', () => {
      render(<TextEditorPanel {...defaultProps} selectedElementId="text-1" />)
      
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true })
      
      expect(mockOnElementAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'サンプルテキスト',
          position: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      )
    })
  })
})