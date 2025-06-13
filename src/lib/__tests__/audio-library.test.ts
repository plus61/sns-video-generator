import { AudioLibrary, AudioTrack, AudioCategory } from '../audio-library'

const mockAudioTracks: AudioTrack[] = [
  {
    id: 'bg-upbeat-1',
    title: 'アップビート BGM',
    category: 'background',
    mood: 'energetic',
    duration: 120,
    bpm: 128,
    url: '/audio/background/upbeat-1.mp3',
    tags: ['エネルギッシュ', 'ポップ', 'モチベーション'],
    license: 'royalty-free',
    volume: 0.7
  },
  {
    id: 'sfx-swoosh-1',
    title: 'スウィッシュ音',
    category: 'sound-effect',
    mood: 'neutral',
    duration: 2,
    bpm: null,
    url: '/audio/sound-effects/swoosh-1.mp3',
    tags: ['トランジション', '効果音'],
    license: 'royalty-free',
    volume: 0.8
  },
  {
    id: 'bg-calm-1',
    title: 'リラックス BGM',
    category: 'background',
    mood: 'calm',
    duration: 180,
    bpm: 80,
    url: '/audio/background/calm-1.mp3',
    tags: ['リラックス', 'アンビエント', 'ヒーリング'],
    license: 'royalty-free',
    volume: 0.6
  }
]

describe('AudioLibrary', () => {
  let audioLibrary: AudioLibrary

  beforeEach(() => {
    audioLibrary = new AudioLibrary()
    audioLibrary.loadTracks(mockAudioTracks)
  })

  describe('Track Loading and Management', () => {
    it('should load audio tracks correctly', () => {
      expect(audioLibrary.getAllTracks()).toHaveLength(3)
      expect(audioLibrary.getTrackById('bg-upbeat-1')).toEqual(mockAudioTracks[0])
    })

    it('should return null for non-existent track', () => {
      expect(audioLibrary.getTrackById('non-existent')).toBeNull()
    })

    it('should get tracks by category', () => {
      const backgroundTracks = audioLibrary.getTracksByCategory('background')
      expect(backgroundTracks).toHaveLength(2)
      expect(backgroundTracks.every(track => track.category === 'background')).toBe(true)
    })

    it('should get tracks by mood', () => {
      const energeticTracks = audioLibrary.getTracksByMood('energetic')
      expect(energeticTracks).toHaveLength(1)
      expect(energeticTracks[0].id).toBe('bg-upbeat-1')
    })
  })

  describe('Track Filtering and Search', () => {
    it('should filter tracks by tags', () => {
      const relaxTracks = audioLibrary.searchTracksByTag('リラックス')
      expect(relaxTracks).toHaveLength(1)
      expect(relaxTracks[0].id).toBe('bg-calm-1')
    })

    it('should search tracks by title', () => {
      const results = audioLibrary.searchTracksByTitle('BGM')
      expect(results).toHaveLength(2)
    })

    it('should filter tracks by duration range', () => {
      const shortTracks = audioLibrary.getTracksByDuration(0, 10)
      expect(shortTracks).toHaveLength(1)
      expect(shortTracks[0].id).toBe('sfx-swoosh-1')
    })

    it('should filter tracks by BPM range', () => {
      const midTempTracks = audioLibrary.getTracksByBPM(70, 90)
      expect(midTempTracks).toHaveLength(1)
      expect(midTempTracks[0].id).toBe('bg-calm-1')
    })
  })

  describe('Track Recommendations', () => {
    it('should recommend tracks by content type', () => {
      const recommendations = audioLibrary.recommendTracksForContent('education')
      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].mood).toBe('calm')
    })

    it('should recommend tracks by platform optimization', () => {
      const tiktokTracks = audioLibrary.recommendTracksForPlatform('tiktok')
      expect(tiktokTracks.every(track => track.duration <= 60)).toBe(true)
    })

    it('should recommend tracks by video segment', () => {
      const mockSegment = {
        id: '1',
        video_upload_id: 'video-1',
        start_time: 10,
        end_time: 40,
        title: 'エクササイズ動画',
        content_type: 'fitness',
        engagement_score: 8
      }
      
      const recommendations = audioLibrary.recommendTracksForSegment(mockSegment)
      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].mood).toBe('energetic')
    })
  })

  describe('Audio Processing', () => {
    it('should calculate optimal volume for mixing', () => {
      const originalVolume = 0.8
      const backgroundVolume = 0.6
      const optimalVolume = audioLibrary.calculateOptimalVolume(originalVolume, backgroundVolume)
      
      expect(optimalVolume).toBeGreaterThan(0)
      expect(optimalVolume).toBeLessThan(1)
    })

    it('should generate audio mix configuration', () => {
      const segment = mockAudioTracks[0]
      const backgroundTrack = mockAudioTracks[2]
      
      const mixConfig = audioLibrary.generateMixConfiguration(segment, backgroundTrack, 30)
      
      expect(mixConfig).toHaveProperty('backgroundTrack')
      expect(mixConfig).toHaveProperty('startTime')
      expect(mixConfig).toHaveProperty('duration')
      expect(mixConfig).toHaveProperty('fadeIn')
      expect(mixConfig).toHaveProperty('fadeOut')
      expect(mixConfig.duration).toBe(30)
    })
  })

  describe('Preset Management', () => {
    it('should create and retrieve audio presets', () => {
      const preset = {
        name: 'エネルギッシュプリセット',
        backgroundTrackId: 'bg-upbeat-1',
        soundEffects: ['sfx-swoosh-1'],
        volumeSettings: {
          background: 0.6,
          effects: 0.8,
          voice: 1.0
        }
      }
      
      audioLibrary.savePreset('energetic-preset', preset)
      const retrieved = audioLibrary.getPreset('energetic-preset')
      
      expect(retrieved).toEqual(preset)
    })

    it('should list all available presets', () => {
      const preset1 = { name: 'Preset 1', backgroundTrackId: 'bg-upbeat-1', soundEffects: [], volumeSettings: {} }
      const preset2 = { name: 'Preset 2', backgroundTrackId: 'bg-calm-1', soundEffects: [], volumeSettings: {} }
      
      audioLibrary.savePreset('preset1', preset1)
      audioLibrary.savePreset('preset2', preset2)
      
      const presets = audioLibrary.getAllPresets()
      expect(Object.keys(presets)).toHaveLength(2)
    })
  })

  describe('Track Validation', () => {
    it('should validate audio track format', () => {
      const validTrack = mockAudioTracks[0]
      expect(audioLibrary.validateTrack(validTrack)).toBe(true)
    })

    it('should reject invalid audio track', () => {
      const invalidTrack = {
        id: 'invalid',
        title: '',
        category: 'invalid-category' as AudioCategory,
        duration: -1
      }
      
      expect(audioLibrary.validateTrack(invalidTrack as AudioTrack)).toBe(false)
    })
  })
})