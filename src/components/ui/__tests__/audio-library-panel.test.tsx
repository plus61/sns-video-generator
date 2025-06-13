import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AudioLibraryPanel } from '../AudioLibraryPanel'

const mockOnTrackSelect = jest.fn()
const mockOnPresetApply = jest.fn()

const defaultProps = {
  onTrackSelect: mockOnTrackSelect,
  onPresetApply: mockOnPresetApply,
  selectedTrackId: null
}

// Mock HTMLAudioElement
global.HTMLAudioElement = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  volume: 0.5,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}))

describe('AudioLibraryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Track Display', () => {
    it('should render audio library with categories', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      expect(screen.getByTestId('audio-library-panel')).toBeInTheDocument()
      expect(screen.getByText('楽曲ライブラリ')).toBeInTheDocument()
    })

    it('should display tracks in each category', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      // Check for default tracks by test ID
      expect(screen.getByTestId('track-bg-corporate-1')).toBeInTheDocument()
      expect(screen.getByTestId('track-bg-upbeat-pop-1')).toBeInTheDocument()
      expect(screen.getByTestId('track-bg-ambient-1')).toBeInTheDocument()
    })

    it('should show track details on hover', async () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const trackElement = screen.getByTestId('track-bg-corporate-1')
      expect(trackElement).toHaveAttribute('title', 'ビジネス動画に最適なコーポレートBGM')
      expect(screen.getByText('180秒')).toBeInTheDocument()
      expect(screen.getByText('100 BPM')).toBeInTheDocument()
    })
  })

  describe('Track Selection and Playback', () => {
    it('should select track when clicked', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const trackElement = screen.getByTestId('track-bg-corporate-1')
      fireEvent.click(trackElement)
      
      expect(mockOnTrackSelect).toHaveBeenCalledWith('bg-corporate-1')
    })

    it('should highlight selected track', () => {
      render(<AudioLibraryPanel {...defaultProps} selectedTrackId="bg-corporate-1" />)
      
      const trackElement = screen.getByTestId('track-bg-corporate-1')
      expect(trackElement).toHaveClass('selected')
    })

    it('should show play/pause button for each track', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const playButton = screen.getByTestId('play-button-bg-corporate-1')
      expect(playButton).toBeInTheDocument()
      
      fireEvent.click(playButton)
      expect(playButton).toHaveTextContent('⏸️')
    })

    it('should show volume control for each track', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const volumeSlider = screen.getByTestId('volume-slider-bg-corporate-1')
      expect(volumeSlider).toBeInTheDocument()
      expect(volumeSlider).toHaveValue('60') // Default 0.6 * 100
    })
  })

  describe('Search and Filtering', () => {
    it('should filter tracks by search query', async () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const searchInput = screen.getByTestId('track-search-input')
      fireEvent.change(searchInput, { target: { value: 'BGM' } })
      
      await waitFor(() => {
        expect(screen.getByText('コーポレート BGM')).toBeInTheDocument()
        expect(screen.queryByText('通知音 ディング')).not.toBeInTheDocument()
      })
    })

    it('should filter tracks by mood', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const moodFilter = screen.getByTestId('mood-filter')
      fireEvent.change(moodFilter, { target: { value: 'energetic' } })
      
      expect(screen.getByText('アップビート ポップ')).toBeInTheDocument()
      expect(screen.queryByText('コーポレート BGM')).not.toBeInTheDocument()
    })

    it('should filter tracks by duration', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const durationFilter = screen.getByTestId('duration-filter')
      fireEvent.change(durationFilter, { target: { value: 'short' } }) // < 30 seconds
      
      expect(screen.getByText('通知音 ディング')).toBeInTheDocument()
      expect(screen.queryByText('コーポレート BGM')).not.toBeInTheDocument()
    })
  })

  describe('Preset Management', () => {
    it('should display available presets', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const presetsTab = screen.getByTestId('presets-tab')
      fireEvent.click(presetsTab)
      
      expect(screen.getAllByText('プリセット')).toHaveLength(2) // Tab and header
      expect(screen.getByTestId('preset-list')).toBeInTheDocument()
    })

    it('should apply preset when selected', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const presetsTab = screen.getByTestId('presets-tab')
      fireEvent.click(presetsTab)
      
      const presetButton = screen.getByTestId('apply-preset-energetic')
      fireEvent.click(presetButton)
      
      expect(mockOnPresetApply).toHaveBeenCalledWith('energetic')
    })

    it('should show create preset dialog', () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const presetsTab = screen.getByTestId('presets-tab')
      fireEvent.click(presetsTab)
      
      const createPresetButton = screen.getByTestId('create-preset-button')
      fireEvent.click(createPresetButton)
      
      expect(screen.getByTestId('create-preset-dialog')).toBeInTheDocument()
      expect(screen.getByText('新しいプリセットを作成')).toBeInTheDocument()
    })
  })

  describe('Track Recommendations', () => {
    it('should show content-based recommendations', () => {
      render(<AudioLibraryPanel {...defaultProps} contentType="education" />)
      
      const recommendationsSection = screen.getByTestId('recommendations-section')
      expect(recommendationsSection).toBeInTheDocument()
      expect(screen.getByText('educationコンテンツにおすすめ')).toBeInTheDocument()
    })

    it('should show platform-specific recommendations', () => {
      render(<AudioLibraryPanel {...defaultProps} targetPlatform="tiktok" />)
      
      expect(screen.getByText('tiktok向け楽曲')).toBeInTheDocument()
      // Should only show tracks <= 60 seconds for TikTok
    })

    it('should update recommendations based on segment', () => {
      const mockSegment = {
        id: '1',
        video_upload_id: 'video-1',
        start_time: 0,
        end_time: 30,
        content_type: 'fitness',
        engagement_score: 8
      }
      
      render(<AudioLibraryPanel {...defaultProps} currentSegment={mockSegment} />)
      
      expect(screen.getByText('このセグメントにおすすめ')).toBeInTheDocument()
    })
  })

  describe('Audio Preview', () => {
    it('should show waveform visualization', () => {
      render(<AudioLibraryPanel {...defaultProps} showWaveform={true} />)
      
      const waveform = screen.getByTestId('audio-waveform-bg-corporate-1')
      expect(waveform).toBeInTheDocument()
    })

    it('should show track progress during playback', async () => {
      render(<AudioLibraryPanel {...defaultProps} />)
      
      const playButton = screen.getByTestId('play-button-bg-corporate-1')
      fireEvent.click(playButton)
      
      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar-bg-corporate-1')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('should handle track drag start', () => {
      render(<AudioLibraryPanel {...defaultProps} enableDragDrop={true} />)
      
      const trackElement = screen.getByTestId('track-bg-corporate-1')
      
      fireEvent.dragStart(trackElement, {
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: 'copy'
        }
      })
      
      expect(trackElement).toHaveClass('dragging')
    })

    it('should provide drag data for timeline integration', () => {
      render(<AudioLibraryPanel {...defaultProps} enableDragDrop={true} />)
      
      const trackElement = screen.getByTestId('track-bg-corporate-1')
      const mockSetData = jest.fn()
      
      fireEvent.dragStart(trackElement, {
        dataTransfer: { setData: mockSetData }
      })
      
      expect(mockSetData).toHaveBeenCalledWith(
        'application/json',
        expect.stringContaining('bg-corporate-1')
      )
    })
  })
})