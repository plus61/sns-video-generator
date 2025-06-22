'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AudioLibrary, AudioTrack, AudioCategory, AudioMood } from '../../lib/audio-library'
import { VideoSegment } from '@/types'

interface AudioLibraryPanelProps {
  onTrackSelect: (trackId: string) => void
  onPresetApply: (presetId: string) => void
  selectedTrackId?: string | null
  contentType?: string
  targetPlatform?: string
  currentSegment?: VideoSegment
  showWaveform?: boolean
  enableDragDrop?: boolean
}

interface PlaybackState {
  trackId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

export function AudioLibraryPanel({
  onTrackSelect,
  onPresetApply,
  selectedTrackId = null,
  contentType,
  targetPlatform,
  currentSegment,
  showWaveform = false,
  enableDragDrop = false
}: AudioLibraryPanelProps) {
  const [audioLibrary] = useState(() => AudioLibrary.createWithDefaults())
  const [activeTab, setActiveTab] = useState<'tracks' | 'presets'>('tracks')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AudioCategory | 'all'>('all')
  const [selectedMood, setSelectedMood] = useState<AudioMood | 'all'>('all')
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all')
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    trackId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })
  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>({})
  const [showCreatePreset, setShowCreatePreset] = useState(false)
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null)

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  // Initialize track volumes
  useEffect(() => {
    const tracks = audioLibrary.getAllTracks()
    const volumes: Record<string, number> = {}
    tracks.forEach(track => {
      volumes[track.id] = track.volume * 100
    })
    setTrackVolumes(volumes)
  }, [audioLibrary])

  // Filter tracks based on current filters
  const getFilteredTracks = useCallback(() => {
    let tracks = audioLibrary.getAllTracks()

    // Search filter
    if (searchQuery) {
      tracks = tracks.filter(track =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      tracks = tracks.filter(track => track.category === selectedCategory)
    }

    // Mood filter
    if (selectedMood !== 'all') {
      tracks = tracks.filter(track => track.mood === selectedMood)
    }

    // Duration filter
    if (durationFilter !== 'all') {
      const durationRanges = {
        short: [0, 30],
        medium: [30, 120],
        long: [120, Infinity]
      }
      const [min, max] = durationRanges[durationFilter]
      tracks = tracks.filter(track => track.duration >= min && track.duration < max)
    }

    return tracks
  }, [audioLibrary, searchQuery, selectedCategory, selectedMood, durationFilter])

  // Get recommendations based on content
  const getRecommendations = useCallback(() => {
    if (currentSegment) {
      return audioLibrary.recommendTracksForSegment(currentSegment)
    }
    if (contentType) {
      return audioLibrary.recommendTracksForContent(contentType)
    }
    if (targetPlatform) {
      return audioLibrary.recommendTracksForPlatform(targetPlatform)
    }
    return []
  }, [audioLibrary, currentSegment, contentType, targetPlatform])

  // Handle track playback
  const togglePlayback = useCallback((trackId: string) => {
    const track = audioLibrary.getTrackById(trackId)
    if (!track) return

    if (playbackState.trackId === trackId && playbackState.isPlaying) {
      // Pause current track
      if (audioRefs.current[trackId]) {
        audioRefs.current[trackId].pause()
      }
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    } else {
      // Stop other tracks and play this one
      Object.values(audioRefs.current).forEach(audio => audio.pause())
      
      if (!audioRefs.current[trackId]) {
        audioRefs.current[trackId] = new Audio(track.url)
      }
      
      const playPromise = audioRefs.current[trackId].play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handle play failure in test environment
          console.log('Audio play failed (expected in test environment)')
        })
      }
      setPlaybackState({
        trackId,
        isPlaying: true,
        currentTime: 0,
        duration: track.duration
      })
    }
  }, [audioLibrary, playbackState])

  // Handle volume changes
  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    setTrackVolumes(prev => ({ ...prev, [trackId]: volume }))
    if (audioRefs.current[trackId]) {
      audioRefs.current[trackId].volume = volume / 100
    }
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, track: AudioTrack) => {
    if (!enableDragDrop) return
    
    setDraggedTrack(track.id)
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'audio-track',
      track
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [enableDragDrop])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedTrack(null)
  }, [])

  // Render track item
  const renderTrack = (track: AudioTrack) => (
    <div
      key={track.id}
      data-testid={`track-${track.id}`}
      className={`
        p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:bg-gray-50
        ${selectedTrackId === track.id ? 'bg-blue-50 border-blue-300 selected' : ''}
        ${draggedTrack === track.id ? 'opacity-50 dragging' : ''}
      `}
      onClick={() => onTrackSelect(track.id)}
      draggable={enableDragDrop}
      onDragStart={(e) => handleDragStart(e, track)}
      onDragEnd={handleDragEnd}
      title={track.description}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{track.title}</h4>
        <button
          data-testid={`play-button-${track.id}`}
          onClick={(e) => {
            e.stopPropagation()
            togglePlayback(track.id)
          }}
          className="text-lg hover:bg-gray-200 rounded p-1"
        >
          {playbackState.trackId === track.id && playbackState.isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        <span>{Math.round(track.duration)}秒</span>
        {track.bpm && <span className="ml-2">{track.bpm} BPM</span>}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {track.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <span className="text-xs">🔊</span>
        <input
          data-testid={`volume-slider-${track.id}`}
          type="range"
          min="0"
          max="100"
          value={trackVolumes[track.id] || track.volume * 100}
          onChange={(e) => {
            e.stopPropagation()
            handleVolumeChange(track.id, parseInt(e.target.value))
          }}
          className="flex-1 h-1"
        />
      </div>

      {/* Waveform visualization (placeholder) */}
      {showWaveform && (
        <div
          data-testid={`audio-waveform-${track.id}`}
          className="mt-2 h-8 bg-gray-100 rounded"
        >
          {/* Waveform would be rendered here */}
        </div>
      )}

      {/* Progress bar during playback */}
      {playbackState.trackId === track.id && playbackState.isPlaying && (
        <div
          data-testid={`progress-bar-${track.id}`}
          className="mt-2 h-1 bg-blue-500 rounded"
          style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
        />
      )}
    </div>
  )

  const filteredTracks = getFilteredTracks()
  const recommendations = getRecommendations()

  return (
    <div data-testid="audio-library-panel" className="audio-library-panel bg-white border border-gray-300 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded ${activeTab === 'tracks' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            楽曲ライブラリ
          </button>
          <button
            data-testid="presets-tab"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded ${activeTab === 'presets' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            プリセット
          </button>
        </div>

        {activeTab === 'tracks' && (
          <>
            {/* Search */}
            <input
              data-testid="track-search-input"
              type="text"
              placeholder="楽曲を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-3"
            />

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as AudioMood | 'all')}
                data-testid="mood-filter"
                className="p-2 border border-gray-300 rounded text-sm"
              >
                <option value="all">すべてのムード</option>
                <option value="energetic">エネルギッシュ</option>
                <option value="calm">落ち着いた</option>
                <option value="happy">ハッピー</option>
                <option value="serious">真面目</option>
                <option value="mysterious">神秘的</option>
                <option value="neutral">ニュートラル</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AudioCategory | 'all')}
                className="p-2 border border-gray-300 rounded text-sm"
              >
                <option value="all">すべてのカテゴリ</option>
                <option value="background">背景音楽</option>
                <option value="sound-effect">効果音</option>
                <option value="transition">トランジション</option>
                <option value="ambient">アンビエント</option>
              </select>

              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as typeof durationFilter)}
                data-testid="duration-filter"
                className="p-2 border border-gray-300 rounded text-sm"
              >
                <option value="all">すべての長さ</option>
                <option value="short">短い (30秒未満)</option>
                <option value="medium">中程度 (30秒-2分)</option>
                <option value="long">長い (2分以上)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'tracks' ? (
          <>
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div data-testid="recommendations-section" className="mb-6">
                <h3 className="font-semibold mb-3">
                  {currentSegment ? 'このセグメントにおすすめ' :
                   contentType ? `${contentType}コンテンツにおすすめ` :
                   targetPlatform ? `${targetPlatform}向け楽曲` : 'おすすめ楽曲'}
                </h3>
                <div className="space-y-2">
                  {recommendations.map(renderTrack)}
                </div>
              </div>
            )}

            {/* Category Sections */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">背景音楽</h3>
                <div className="space-y-2">
                  {filteredTracks.filter(track => track.category === 'background').map(renderTrack)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">効果音</h3>
                <div className="space-y-2">
                  {filteredTracks.filter(track => track.category === 'sound-effect').map(renderTrack)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">トランジション</h3>
                <div className="space-y-2">
                  {filteredTracks.filter(track => track.category === 'transition').map(renderTrack)}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Presets Tab */
          <div data-testid="preset-list">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">プリセット</h3>
              <button
                data-testid="create-preset-button"
                onClick={() => setShowCreatePreset(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                新規作成
              </button>
            </div>

            {/* Default presets */}
            <div className="space-y-2">
              <button
                data-testid="apply-preset-energetic"
                onClick={() => onPresetApply('energetic')}
                className="w-full p-3 border border-gray-200 rounded text-left hover:bg-gray-50"
              >
                <div className="font-medium">エネルギッシュプリセット</div>
                <div className="text-sm text-gray-500">アップビートBGM + トランジション効果</div>
              </button>

              <button
                onClick={() => onPresetApply('professional')}
                className="w-full p-3 border border-gray-200 rounded text-left hover:bg-gray-50"
              >
                <div className="font-medium">プロフェッショナルプリセット</div>
                <div className="text-sm text-gray-500">コーポレートBGM + 控えめ効果音</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Preset Dialog */}
      {showCreatePreset && (
        <div data-testid="create-preset-dialog" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-semibold mb-4">新しいプリセットを作成</h3>
            <input
              type="text"
              placeholder="プリセット名"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreatePreset(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded"
              >
                キャンセル
              </button>
              <button
                onClick={() => setShowCreatePreset(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}