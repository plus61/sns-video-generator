'use client'

import { useState, useEffect } from 'react'
import { ttsService, type TTSOptions } from '@/lib/tts'

interface TTSControlsProps {
  text: string
  onAudioGenerated?: (audioBlob: Blob) => void
  className?: string
}

export function TTSControls({ text, onAudioGenerated, className = '' }: TTSControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [settings, setSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1
  })
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null)

  useEffect(() => {
    const checkSupport = async () => {
      const supported = ttsService.isTextToSpeechSupported()
      setIsSupported(supported)
      
      if (supported) {
        const availableVoices = await ttsService.getAvailableVoices()
        setVoices(availableVoices)
        
        // Set default voice (prefer English voices)
        const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'))
        if (englishVoices.length > 0) {
          setSelectedVoice(englishVoices[0])
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0])
        }
      }
    }
    
    checkSupport()
  }, [])

  const generateAudio = async () => {
    if (!text.trim() || !selectedVoice) return
    
    setIsGenerating(true)
    
    try {
      const options: TTSOptions = {
        text: text.trim(),
        voice: selectedVoice,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume
      }
      
      const audioBlob = await ttsService.synthesizeToFile(options)
      
      if (audioBlob) {
        setGeneratedAudio(audioBlob)
        onAudioGenerated?.(audioBlob)
      } else {
        alert('Failed to generate audio. Please try again.')
      }
    } catch (error) {
      console.error('Audio generation failed:', error)
      alert('Audio generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const playPreview = () => {
    if (!selectedVoice || !text.trim()) return
    
    // Stop any existing speech
    ttsService.stop()
    
    // Create preview utterance
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.voice = selectedVoice
    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume
    
    speechSynthesis.speak(utterance)
  }

  const stopPreview = () => {
    ttsService.stop()
  }

  const downloadAudio = () => {
    if (!generatedAudio) return
    
    const url = URL.createObjectURL(generatedAudio)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-audio.webm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isSupported) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Text-to-Speech is not supported in your browser
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🎤 Text-to-Speech Controls
      </h3>
      
      {/* Voice Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice
          </label>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value)
              setSelectedVoice(voice || null)
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a voice...</option>
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Speed: {settings.rate.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={(e) => setSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pitch: {settings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => setSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Volume: {settings.volume.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.volume}
              onChange={(e) => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* Preview Controls */}
        <div className="flex space-x-3">
          <button
            onClick={playPreview}
            disabled={!selectedVoice || !text.trim()}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Preview
          </button>
          
          <button
            onClick={stopPreview}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
            Stop
          </button>
        </div>

        {/* Generate Audio */}
        <div className="border-t dark:border-gray-700 pt-4">
          <button
            onClick={generateAudio}
            disabled={!selectedVoice || !text.trim() || isGenerating}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Audio...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Generate Audio
              </>
            )}
          </button>
        </div>

        {/* Generated Audio Preview */}
        {generatedAudio && (
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Generated Audio
              </h4>
              <button
                onClick={downloadAudio}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Download
              </button>
            </div>
            
            <audio
              src={URL.createObjectURL(generatedAudio)}
              controls
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}