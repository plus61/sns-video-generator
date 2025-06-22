export interface TTSOptions {
  voice?: string
  speed?: number
  pitch?: number
}

export const tts = {}

export const ttsService = {
  generateSpeech: async (text: string, voice: string) => {
    // Placeholder implementation
    return new ArrayBuffer(0)
  },
  getVoices: () => {
    return [
      { id: 'alloy', name: 'Alloy' },
      { id: 'echo', name: 'Echo' },
      { id: 'fable', name: 'Fable' },
      { id: 'onyx', name: 'Onyx' },
      { id: 'nova', name: 'Nova' },
      { id: 'shimmer', name: 'Shimmer' }
    ]
  }
}
