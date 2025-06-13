import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SocialMediaPostPanel } from '../SocialMediaPostPanel'
import { socialMediaIntegration } from '../../../lib/social-media-integration'

// Mock the social media integration
jest.mock('../../../lib/social-media-integration', () => ({
  socialMediaIntegration: {
    getSupportedPlatforms: jest.fn(() => ['youtube', 'tiktok', 'instagram', 'twitter']),
    isAuthenticated: jest.fn(() => false),
    validateVideoForPlatform: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
    postToYouTube: jest.fn(),
    postToTikTok: jest.fn(),
    postToInstagram: jest.fn(),
    setCredentials: jest.fn(),
    clearCredentials: jest.fn()
  },
  PLATFORM_CONFIGS: {
    youtube: {
      name: 'YouTube',
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      apiVersion: 'v3',
      supportedFormats: ['mp4', 'mov'],
      maxFileSize: 256000,
      maxDuration: 43200,
      aspectRatios: ['16:9'],
      requiresAuth: true
    },
    tiktok: {
      name: 'TikTok',
      baseUrl: 'https://open-api.tiktok.com',
      apiVersion: 'v1.3',
      supportedFormats: ['mp4'],
      maxFileSize: 4096,
      maxDuration: 180,
      aspectRatios: ['9:16'],
      requiresAuth: true
    },
    instagram: {
      name: 'Instagram',
      baseUrl: 'https://graph.facebook.com',
      apiVersion: 'v18.0',
      supportedFormats: ['mp4'],
      maxFileSize: 4096,
      maxDuration: 3600,
      aspectRatios: ['1:1'],
      requiresAuth: true
    },
    twitter: {
      name: 'Twitter/X',
      baseUrl: 'https://upload.twitter.com/1.1',
      apiVersion: 'v1.1',
      supportedFormats: ['mp4'],
      maxFileSize: 512,
      maxDuration: 140,
      aspectRatios: ['16:9'],
      requiresAuth: true
    }
  }
}))

const mockVideoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' })
const mockOnPostComplete = jest.fn()

const defaultProps = {
  videoFile: mockVideoFile,
  videoDuration: 60,
  onPostComplete: mockOnPostComplete
}

describe('SocialMediaPostPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Platform Display', () => {
    it('should render all supported platforms', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      expect(screen.getByTestId('social-media-post-panel')).toBeInTheDocument()
      expect(screen.getByTestId('platform-card-youtube')).toBeInTheDocument()
      expect(screen.getByTestId('platform-card-tiktok')).toBeInTheDocument()
      expect(screen.getByTestId('platform-card-instagram')).toBeInTheDocument()
      expect(screen.getByTestId('platform-card-twitter')).toBeInTheDocument()
    })

    it('should show platform configuration details', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      // YouTube platform card should show config details
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      expect(youtubeCard).toHaveTextContent('YouTube')
      expect(youtubeCard).toHaveTextContent('最大ファイルサイズ')
      expect(youtubeCard).toHaveTextContent('最大時間')
      expect(youtubeCard).toHaveTextContent('対応形式')
    })

    it('should indicate authentication status', () => {
      // Mock some platforms as authenticated
      ;(socialMediaIntegration.isAuthenticated as jest.Mock)
        .mockImplementation((platform: string) => platform === 'youtube')

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      const tiktokCard = screen.getByTestId('platform-card-tiktok')
      
      expect(youtubeCard).toHaveTextContent('認証済み')
      expect(tiktokCard).toHaveTextContent('認証する')
    })
  })

  describe('Platform Selection', () => {
    beforeEach(() => {
      // Mock all platforms as authenticated for selection tests
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(true)
    })

    it('should allow platform selection', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      fireEvent.click(youtubeCard)
      
      expect(youtubeCard).toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('should show post content form when platforms selected', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      fireEvent.click(youtubeCard)
      
      expect(screen.getByTestId('post-title-input')).toBeInTheDocument()
      expect(screen.getByTestId('post-description-input')).toBeInTheDocument()
      expect(screen.getByTestId('new-tag-input')).toBeInTheDocument()
      expect(screen.getByTestId('visibility-select')).toBeInTheDocument()
    })

    it('should prevent selection of unauthenticated platforms', () => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(false)
      
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      fireEvent.click(youtubeCard)
      
      // Should not be selected due to lack of authentication
      expect(youtubeCard).not.toHaveClass('border-blue-500')
    })
  })

  describe('Post Content Form', () => {
    beforeEach(() => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(true)
    })

    it('should update post title', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      // Select a platform first
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const titleInput = screen.getByTestId('post-title-input')
      fireEvent.change(titleInput, { target: { value: 'My Test Video' } })
      
      expect(titleInput).toHaveValue('My Test Video')
    })

    it('should update post description', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const descriptionInput = screen.getByTestId('post-description-input')
      fireEvent.change(descriptionInput, { target: { value: 'This is a test video description' } })
      
      expect(descriptionInput).toHaveValue('This is a test video description')
    })

    it('should add and remove tags', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const tagInput = screen.getByTestId('new-tag-input')
      const addTagButton = screen.getByTestId('add-tag-button')
      
      // Add a tag
      fireEvent.change(tagInput, { target: { value: 'testtag' } })
      fireEvent.click(addTagButton)
      
      expect(screen.getByText('#testtag')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
      
      // Remove the tag
      const removeButton = screen.getByText('×')
      fireEvent.click(removeButton)
      
      expect(screen.queryByText('#testtag')).not.toBeInTheDocument()
    })

    it('should add tag on Enter key', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const tagInput = screen.getByTestId('new-tag-input')
      fireEvent.change(tagInput, { target: { value: 'entertag' } })
      fireEvent.keyDown(tagInput, { key: 'Enter' })
      
      expect(screen.getByText('#entertag')).toBeInTheDocument()
    })

    it('should update visibility setting', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const visibilitySelect = screen.getByTestId('visibility-select')
      fireEvent.change(visibilitySelect, { target: { value: 'private' } })
      
      expect(visibilitySelect).toHaveValue('private')
    })
  })

  describe('Video Validation', () => {
    beforeEach(() => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(true)
    })

    it('should show validation errors', () => {
      ;(socialMediaIntegration.validateVideoForPlatform as jest.Mock)
        .mockReturnValue({
          valid: false,
          errors: ['File size exceeds limit'],
          warnings: []
        })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      expect(screen.getByText('❌')).toBeInTheDocument()
      expect(screen.getByText('File size exceeds limit')).toBeInTheDocument()
    })

    it('should show validation warnings', () => {
      ;(socialMediaIntegration.validateVideoForPlatform as jest.Mock)
        .mockReturnValue({
          valid: true,
          errors: [],
          warnings: ['Video may have reduced visibility']
        })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('Video may have reduced visibility')).toBeInTheDocument()
    })
  })

  describe('Post Submission', () => {
    beforeEach(() => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(true)
      ;(socialMediaIntegration.validateVideoForPlatform as jest.Mock)
        .mockReturnValue({ valid: true, errors: [], warnings: [] })
    })

    it('should show post button when platforms selected', () => {
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const postButton = screen.getByTestId('post-to-all-button')
      expect(postButton).toBeInTheDocument()
      expect(postButton).toHaveTextContent('選択したプラットフォームに投稿 (1)')
    })

    it('should post to selected platforms', async () => {
      ;(socialMediaIntegration.postToYouTube as jest.Mock)
        .mockResolvedValue({ success: true, postId: 'yt-123', url: 'https://youtube.com/watch?v=yt-123' })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const postButton = screen.getByTestId('post-to-all-button')
      fireEvent.click(postButton)
      
      expect(postButton).toHaveTextContent('投稿中...')
      
      await waitFor(() => {
        expect(socialMediaIntegration.postToYouTube).toHaveBeenCalled()
        expect(mockOnPostComplete).toHaveBeenCalled()
      })
    })

    it('should handle posting errors', async () => {
      ;(socialMediaIntegration.postToYouTube as jest.Mock)
        .mockResolvedValue({ success: false, error: 'Upload failed' })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      fireEvent.click(screen.getByTestId('post-to-all-button'))
      
      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })

    it('should disable post button for invalid videos', () => {
      ;(socialMediaIntegration.validateVideoForPlatform as jest.Mock)
        .mockReturnValue({ valid: false, errors: ['Invalid file'], warnings: [] })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      
      const postButton = screen.getByTestId('post-to-all-button')
      expect(postButton).toBeDisabled()
    })
  })

  describe('Authentication Modal', () => {
    it('should open authentication modal', () => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(false)
      
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      const authButton = youtubeCard.querySelector('button')!
      fireEvent.click(authButton)
      
      expect(screen.getByText('YouTube 認証設定')).toBeInTheDocument()
      expect(screen.getByText('YouTubeのAPIクレデンシャルを入力してください。')).toBeInTheDocument()
    })

    it('should save credentials and close modal', () => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(false)
      
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      // Open auth modal
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      const authButton = youtubeCard.querySelector('button')!
      fireEvent.click(authButton)
      
      // Fill in credentials
      const accessTokenInput = screen.getByPlaceholderText('アクセストークンを入力...')
      fireEvent.change(accessTokenInput, { target: { value: 'test-token' } })
      
      // Save credentials
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      expect(socialMediaIntegration.setCredentials).toHaveBeenCalledWith(
        'youtube',
        { accessToken: 'test-token' }
      )
    })

    it('should close modal on cancel', () => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(false)
      
      render(<SocialMediaPostPanel {...defaultProps} />)
      
      const youtubeCard = screen.getByTestId('platform-card-youtube')
      const authButton = youtubeCard.querySelector('button')!
      fireEvent.click(authButton)
      fireEvent.click(screen.getByText('キャンセル'))
      
      expect(screen.queryByText('YouTube 認証設定')).not.toBeInTheDocument()
    })
  })

  describe('Post Results Display', () => {
    beforeEach(() => {
      ;(socialMediaIntegration.isAuthenticated as jest.Mock).mockReturnValue(true)
      ;(socialMediaIntegration.validateVideoForPlatform as jest.Mock)
        .mockReturnValue({ valid: true, errors: [], warnings: [] })
    })

    it('should show successful post results', async () => {
      ;(socialMediaIntegration.postToYouTube as jest.Mock)
        .mockResolvedValue({ 
          success: true, 
          postId: 'yt-123', 
          url: 'https://youtube.com/watch?v=yt-123' 
        })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      fireEvent.click(screen.getByTestId('post-to-all-button'))
      
      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument()
        expect(screen.getByText('投稿完了')).toBeInTheDocument()
        expect(screen.getByText('表示')).toBeInTheDocument()
      })
    })

    it('should show failed post results', async () => {
      ;(socialMediaIntegration.postToYouTube as jest.Mock)
        .mockResolvedValue({ success: false, error: 'Authentication failed' })

      render(<SocialMediaPostPanel {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('platform-card-youtube'))
      fireEvent.click(screen.getByTestId('post-to-all-button'))
      
      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
        expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      })
    })
  })
})