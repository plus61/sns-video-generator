import { VideoSegment } from '@/types'

export type AudioCategory = 'background' | 'sound-effect' | 'transition' | 'ambient'
export type AudioMood = 'energetic' | 'calm' | 'happy' | 'serious' | 'mysterious' | 'neutral'
export type AudioLicense = 'royalty-free' | 'creative-commons' | 'licensed'

export interface AudioTrack {
  id: string
  title: string
  category: AudioCategory
  mood: AudioMood
  duration: number // in seconds
  bpm: number | null
  url: string
  tags: string[]
  license: AudioLicense
  volume: number // 0.0 to 1.0
  artist?: string
  description?: string
}

export interface AudioPreset {
  name: string
  backgroundTrackId: string
  soundEffects: string[]
  volumeSettings: {
    background?: number
    effects?: number
    voice?: number
  }
}

export interface AudioMixConfiguration {
  backgroundTrack: AudioTrack
  startTime: number
  duration: number
  fadeIn: number
  fadeOut: number
  volume: number
  loop: boolean
}

export class AudioLibrary {
  private tracks: Map<string, AudioTrack> = new Map()
  private presets: Map<string, AudioPreset> = new Map()

  /**
   * Load audio tracks into the library
   */
  loadTracks(tracks: AudioTrack[]): void {
    tracks.forEach(track => {
      if (this.validateTrack(track)) {
        this.tracks.set(track.id, track)
      }
    })
  }

  /**
   * Get all tracks
   */
  getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values())
  }

  /**
   * Get track by ID
   */
  getTrackById(id: string): AudioTrack | null {
    return this.tracks.get(id) || null
  }

  /**
   * Get tracks by category
   */
  getTracksByCategory(category: AudioCategory): AudioTrack[] {
    return this.getAllTracks().filter(track => track.category === category)
  }

  /**
   * Get tracks by mood
   */
  getTracksByMood(mood: AudioMood): AudioTrack[] {
    return this.getAllTracks().filter(track => track.mood === mood)
  }

  /**
   * Search tracks by tag
   */
  searchTracksByTag(tag: string): AudioTrack[] {
    return this.getAllTracks().filter(track => 
      track.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    )
  }

  /**
   * Search tracks by title
   */
  searchTracksByTitle(query: string): AudioTrack[] {
    return this.getAllTracks().filter(track =>
      track.title.toLowerCase().includes(query.toLowerCase())
    )
  }

  /**
   * Get tracks by duration range
   */
  getTracksByDuration(minDuration: number, maxDuration: number): AudioTrack[] {
    return this.getAllTracks().filter(track =>
      track.duration >= minDuration && track.duration <= maxDuration
    )
  }

  /**
   * Get tracks by BPM range
   */
  getTracksByBPM(minBPM: number, maxBPM: number): AudioTrack[] {
    return this.getAllTracks().filter(track =>
      track.bpm !== null && track.bpm >= minBPM && track.bpm <= maxBPM
    )
  }

  /**
   * Recommend tracks based on content type
   */
  recommendTracksForContent(contentType: string): AudioTrack[] {
    const moodMapping: Record<string, AudioMood[]> = {
      'education': ['calm', 'serious'],
      'entertainment': ['energetic', 'happy'],
      'fitness': ['energetic'],
      'cooking': ['happy', 'calm'],
      'travel': ['happy', 'energetic'],
      'technology': ['neutral', 'serious'],
      'lifestyle': ['calm', 'happy']
    }

    const recommendedMoods = moodMapping[contentType] || ['neutral']
    return this.getAllTracks().filter(track =>
      track.category === 'background' && recommendedMoods.includes(track.mood)
    )
  }

  /**
   * Recommend tracks for platform optimization
   */
  recommendTracksForPlatform(platform: string): AudioTrack[] {
    const platformLimits: Record<string, number> = {
      'tiktok': 60,
      'instagram': 90,
      'youtube': 300
    }

    const maxDuration = platformLimits[platform] || 300
    return this.getTracksByDuration(0, maxDuration)
  }

  /**
   * Recommend tracks for a specific video segment
   */
  recommendTracksForSegment(segment: VideoSegment): AudioTrack[] {
    const duration = segment.end_time - segment.start_time
    const contentRecommendations = this.recommendTracksForContent(segment.content_type || 'general')
    
    return contentRecommendations.filter(track => 
      track.duration >= duration || track.category === 'background'
    ).slice(0, 3) // Return top 3 recommendations
  }

  /**
   * Calculate optimal volume for mixing audio
   */
  calculateOptimalVolume(originalVolume: number, backgroundVolume: number): number {
    // Ensure background doesn't overpower original audio
    const ratio = originalVolume / (originalVolume + backgroundVolume)
    return Math.max(0.2, Math.min(0.8, backgroundVolume * ratio))
  }

  /**
   * Generate audio mix configuration
   */
  generateMixConfiguration(
    mainTrack: AudioTrack,
    backgroundTrack: AudioTrack,
    duration: number
  ): AudioMixConfiguration {
    return {
      backgroundTrack,
      startTime: 0,
      duration,
      fadeIn: 2, // 2 second fade in
      fadeOut: 2, // 2 second fade out
      volume: this.calculateOptimalVolume(mainTrack.volume, backgroundTrack.volume),
      loop: backgroundTrack.duration < duration
    }
  }

  /**
   * Save audio preset
   */
  savePreset(id: string, preset: AudioPreset): void {
    this.presets.set(id, preset)
  }

  /**
   * Get audio preset
   */
  getPreset(id: string): AudioPreset | null {
    return this.presets.get(id) || null
  }

  /**
   * Get all presets
   */
  getAllPresets(): Record<string, AudioPreset> {
    const presets: Record<string, AudioPreset> = {}
    this.presets.forEach((preset, id) => {
      presets[id] = preset
    })
    return presets
  }

  /**
   * Validate audio track format
   */
  validateTrack(track: AudioTrack): boolean {
    const validCategories: AudioCategory[] = ['background', 'sound-effect', 'transition', 'ambient']
    const validMoods: AudioMood[] = ['energetic', 'calm', 'happy', 'serious', 'mysterious', 'neutral']
    const validLicenses: AudioLicense[] = ['royalty-free', 'creative-commons', 'licensed']

    return (
      typeof track.id === 'string' &&
      track.id.length > 0 &&
      typeof track.title === 'string' &&
      track.title.length > 0 &&
      validCategories.includes(track.category) &&
      validMoods.includes(track.mood) &&
      typeof track.duration === 'number' &&
      track.duration > 0 &&
      typeof track.url === 'string' &&
      track.url.length > 0 &&
      Array.isArray(track.tags) &&
      validLicenses.includes(track.license) &&
      typeof track.volume === 'number' &&
      track.volume >= 0 &&
      track.volume <= 1
    )
  }

  /**
   * Initialize with default audio library
   */
  static createWithDefaults(): AudioLibrary {
    const library = new AudioLibrary()
    library.loadTracks(defaultAudioTracks)
    return library
  }
}

// Default audio tracks for the library
const defaultAudioTracks: AudioTrack[] = [
  {
    id: 'bg-corporate-1',
    title: 'コーポレート BGM',
    category: 'background',
    mood: 'serious',
    duration: 180,
    bpm: 100,
    url: '/audio/background/corporate-1.mp3',
    tags: ['ビジネス', 'プロフェッショナル', 'コーポレート'],
    license: 'royalty-free',
    volume: 0.6,
    description: 'ビジネス動画に最適なコーポレートBGM'
  },
  {
    id: 'bg-upbeat-pop-1',
    title: 'アップビート ポップ',
    category: 'background',
    mood: 'energetic',
    duration: 150,
    bpm: 128,
    url: '/audio/background/upbeat-pop-1.mp3',
    tags: ['ポップ', 'エネルギッシュ', 'モチベーション'],
    license: 'royalty-free',
    volume: 0.7,
    description: 'エネルギッシュなポップミュージック'
  },
  {
    id: 'bg-ambient-1',
    title: 'アンビエント',
    category: 'background',
    mood: 'calm',
    duration: 240,
    bpm: 70,
    url: '/audio/background/ambient-1.mp3',
    tags: ['リラックス', 'アンビエント', 'ヒーリング'],
    license: 'royalty-free',
    volume: 0.5,
    description: 'リラックスできるアンビエントミュージック'
  },
  {
    id: 'sfx-transition-whoosh',
    title: 'トランジション ウーッシュ',
    category: 'transition',
    mood: 'neutral',
    duration: 1.5,
    bpm: null,
    url: '/audio/effects/transition-whoosh.mp3',
    tags: ['トランジション', '効果音', 'スウィッシュ'],
    license: 'royalty-free',
    volume: 0.8,
    description: 'シーン切り替えに使えるウーッシュ音'
  },
  {
    id: 'sfx-notification-ding',
    title: '通知音 ディング',
    category: 'sound-effect',
    mood: 'neutral',
    duration: 0.8,
    bpm: null,
    url: '/audio/effects/notification-ding.mp3',
    tags: ['通知', '効果音', 'アラート'],
    license: 'royalty-free',
    volume: 0.9,
    description: '通知やアラートに使える効果音'
  }
]