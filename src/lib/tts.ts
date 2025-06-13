'use client'

export interface TTSOptions {
  text: string
  voice?: SpeechSynthesisVoice
  rate?: number
  pitch?: number
  volume?: number
}

export interface TTSAudioData {
  audioBuffer: AudioBuffer
  duration: number
  blob: Blob
}

export class TextToSpeechService {
  private audioContext: AudioContext | null = null
  private isSupported: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'speechSynthesis' in window && 'AudioContext' in window
      if (this.isSupported) {
        this.audioContext = new AudioContext()
      }
    }
  }

  async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isSupported) return []

    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve(voices)
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = () => {
          resolve(speechSynthesis.getVoices())
        }
      }
    })
  }

  async synthesizeToAudioBuffer(options: TTSOptions): Promise<TTSAudioData | null> {
    if (!this.isSupported || !this.audioContext) {
      console.warn('TTS not supported in this browser')
      return null
    }

    try {
      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(options.text)
      
      if (options.voice) utterance.voice = options.voice
      if (options.rate) utterance.rate = options.rate
      if (options.pitch) utterance.pitch = options.pitch
      if (options.volume) utterance.volume = options.volume

      // Use MediaRecorder to capture audio
      const stream = await this.createAudioStream(utterance)
      const audioData = await this.recordAudioStream(stream)
      
      return audioData
    } catch (error) {
      console.error('TTS synthesis failed:', error)
      return null
    }
  }

  private async createAudioStream(utterance: SpeechSynthesisUtterance): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      // Create audio context and destination
      const audioContext = this.audioContext!
      const destination = audioContext.createMediaStreamDestination()
      
      // Create oscillator for TTS audio capture
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(destination)
      
      // Start synthesis
      utterance.onstart = () => {
        oscillator.start()
        resolve(destination.stream)
      }
      
      utterance.onerror = (error) => {
        reject(error)
      }
      
      speechSynthesis.speak(utterance)
    })
  }

  private async recordAudioStream(stream: MediaStream): Promise<TTSAudioData> {
    return new Promise((resolve, reject) => {
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          const arrayBuffer = await audioBlob.arrayBuffer()
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
          
          resolve({
            audioBuffer,
            duration: audioBuffer.duration,
            blob: audioBlob
          })
        } catch (error) {
          reject(error)
        }
      }
      
      mediaRecorder.onerror = reject
      
      mediaRecorder.start()
      
      // Stop recording after a reasonable time
      setTimeout(() => {
        mediaRecorder.stop()
      }, 30000) // 30 seconds max
    })
  }

  // Alternative approach using Web Audio API for better control
  async synthesizeToFile(options: TTSOptions): Promise<Blob | null> {
    if (!this.isSupported) return null

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(options.text)
      
      if (options.voice) utterance.voice = options.voice
      if (options.rate) utterance.rate = options.rate || 1
      if (options.pitch) utterance.pitch = options.pitch || 1
      if (options.volume) utterance.volume = options.volume || 1

      // Create audio context for recording
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(destination.stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        resolve(audioBlob)
      }
      
      utterance.onstart = () => {
        mediaRecorder.start()
      }
      
      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop()
        }, 100)
      }
      
      utterance.onerror = () => {
        resolve(null)
      }
      
      speechSynthesis.speak(utterance)
    })
  }

  // Get preferred voices by language
  async getPreferredVoices(language: string = 'en'): Promise<SpeechSynthesisVoice[]> {
    const voices = await this.getAvailableVoices()
    return voices.filter(voice => voice.lang.startsWith(language))
  }

  // Check if TTS is supported
  isTextToSpeechSupported(): boolean {
    return this.isSupported
  }

  // Stop any ongoing synthesis
  stop(): void {
    if (this.isSupported) {
      speechSynthesis.cancel()
    }
  }
}

// Create singleton instance
export const ttsService = new TextToSpeechService()