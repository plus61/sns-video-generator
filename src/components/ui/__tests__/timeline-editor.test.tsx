import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimelineEditor } from '../TimelineEditor'
import { VideoSegment } from '@/types'

const mockSegments: VideoSegment[] = [
  {
    id: '1',
    video_upload_id: 'video-1',
    start_time: 10,
    end_time: 30,
    title: 'Segment 1',
    description: 'First segment',
    content_type: 'education',
    engagement_score: 8,
    transcript_segment: 'First segment transcript',
    visual_cues: {},
    audio_features: { confidence: 0.9 },
    platform_optimizations: {},
    status: 'extracted',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    video_upload_id: 'video-1',
    start_time: 45,
    end_time: 70,
    title: 'Segment 2',
    description: 'Second segment',
    content_type: 'entertainment',
    engagement_score: 7,
    transcript_segment: 'Second segment transcript',
    visual_cues: {},
    audio_features: { confidence: 0.8 },
    platform_optimizations: {},
    status: 'extracted',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

describe('TimelineEditor', () => {
  const defaultProps = {
    segments: mockSegments,
    videoDuration: 120,
    onSegmentUpdate: jest.fn(),
    onSegmentDelete: jest.fn(),
    onSegmentCreate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Timeline Display', () => {
    it('should render timeline with correct duration', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      expect(screen.getByTestId('timeline-container')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-ruler')).toBeInTheDocument()
    })

    it('should display all segments on timeline', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      expect(screen.getByTestId('segment-1')).toBeInTheDocument()
      expect(screen.getByTestId('segment-2')).toBeInTheDocument()
    })

    it('should show segment labels and durations', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      expect(screen.getByText('Segment 1')).toBeInTheDocument()
      expect(screen.getByText('Segment 2')).toBeInTheDocument()
      expect(screen.getAllByText('20s')).toHaveLength(2) // Timeline marker and segment duration
      expect(screen.getByText('25s')).toBeInTheDocument() // Segment 2 duration
    })
  })

  describe('Segment Manipulation', () => {
    it('should allow dragging segments to new positions', async () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment = screen.getByTestId('segment-1')
      
      fireEvent.mouseDown(segment, { clientX: 100 })
      fireEvent.mouseMove(segment, { clientX: 150 })
      fireEvent.mouseUp(segment)

      await waitFor(() => {
        expect(defaultProps.onSegmentUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            start_time: expect.any(Number),
            end_time: expect.any(Number)
          })
        )
      })
    })

    it('should allow resizing segments by dragging edges', async () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segmentEdge = screen.getByTestId('segment-1-end-handle')
      
      fireEvent.mouseDown(segmentEdge, { clientX: 200 })
      fireEvent.mouseMove(segmentEdge, { clientX: 250 })
      fireEvent.mouseUp(segmentEdge)

      await waitFor(() => {
        expect(defaultProps.onSegmentUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            end_time: expect.any(Number)
          })
        )
      })
    })

    it('should delete segment when delete button is clicked', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const deleteButton = screen.getByTestId('delete-segment-1')
      fireEvent.click(deleteButton)

      expect(defaultProps.onSegmentDelete).toHaveBeenCalledWith('1')
    })

    it('should split segment at specified time', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment = screen.getByTestId('segment-1')
      fireEvent.contextMenu(segment)
      
      const splitOption = screen.getByText('Split at 20s')
      fireEvent.click(splitOption)

      expect(defaultProps.onSegmentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: 20,
          end_time: 30
        })
      )
      expect(defaultProps.onSegmentUpdate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          end_time: 20
        })
      )
    })
  })

  describe('Timeline Controls', () => {
    it('should zoom in when zoom in button is clicked', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const zoomInButton = screen.getByTestId('zoom-in-button')
      fireEvent.click(zoomInButton)

      const timeline = screen.getByTestId('timeline-container')
      expect(timeline).toHaveClass('zoomed-in')
    })

    it('should zoom out when zoom out button is clicked', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const zoomOutButton = screen.getByTestId('zoom-out-button')
      fireEvent.click(zoomOutButton)

      const timeline = screen.getByTestId('timeline-container')
      expect(timeline).toHaveClass('zoomed-out')
    })

    it('should snap segments to grid when snap is enabled', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const snapButton = screen.getByTestId('snap-to-grid-button')
      fireEvent.click(snapButton)

      expect(snapButton).toHaveClass('active')
    })
  })

  describe('Playhead and Preview', () => {
    it('should display playhead at correct position', () => {
      render(<TimelineEditor {...defaultProps} currentTime={45} />)
      
      const playhead = screen.getByTestId('timeline-playhead')
      expect(playhead).toBeInTheDocument()
      expect(playhead).toHaveStyle('left: 180px') // 45/120 * 480px
    })

    it('should update current time when timeline is clicked', () => {
      const onTimeUpdate = jest.fn()
      render(<TimelineEditor {...defaultProps} onTimeUpdate={onTimeUpdate} />)
      
      const timeline = screen.getByTestId('timeline-ruler')
      fireEvent.click(timeline, { clientX: 240 }) // Assuming 480px width, clicking at 50%

      expect(onTimeUpdate).toHaveBeenCalledWith(60) // 50% of 120s
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should delete selected segment when Delete key is pressed', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment = screen.getByTestId('segment-1')
      fireEvent.click(segment) // Select segment
      fireEvent.keyDown(document, { key: 'Delete' })

      expect(defaultProps.onSegmentDelete).toHaveBeenCalledWith('1')
    })

    it('should copy and paste segments with Ctrl+C and Ctrl+V', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment = screen.getByTestId('segment-1')
      fireEvent.click(segment) // Select segment
      fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
      fireEvent.keyDown(document, { key: 'v', ctrlKey: true })

      expect(defaultProps.onSegmentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Segment 1 (Copy)',
          start_time: expect.any(Number),
          end_time: expect.any(Number)
        })
      )
    })
  })

  describe('Multi-segment Operations', () => {
    it('should select multiple segments with Ctrl+click', () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment1 = screen.getByTestId('segment-1')
      const segment2 = screen.getByTestId('segment-2')
      
      fireEvent.click(segment1)
      fireEvent.click(segment2, { ctrlKey: true })

      expect(segment1).toHaveClass('selected')
      expect(segment2).toHaveClass('selected')
    })

    it('should move multiple selected segments together', async () => {
      render(<TimelineEditor {...defaultProps} />)
      
      const segment1 = screen.getByTestId('segment-1')
      const segment2 = screen.getByTestId('segment-2')
      
      fireEvent.click(segment1)
      fireEvent.click(segment2, { ctrlKey: true })

      fireEvent.mouseDown(segment1, { clientX: 100 })
      fireEvent.mouseMove(segment1, { clientX: 150 })
      fireEvent.mouseUp(segment1)

      await waitFor(() => {
        expect(defaultProps.onSegmentUpdate).toHaveBeenCalledTimes(2)
      })
    })
  })
})