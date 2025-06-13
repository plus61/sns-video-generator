export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface VideoProject {
  id: string
  user_id: string
  title: string
  description?: string
  script?: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration?: number
  created_at: string
  updated_at: string
}

export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail_url: string
  config: VideoTemplateConfig
  created_at: string
}

export interface VideoTemplateConfig {
  duration: number
  dimensions: {
    width: number
    height: number
  }
  background: {
    type: 'color' | 'gradient' | 'image' | 'video'
    value: string
  }
  text_styles: TextStyle[]
  animation_presets: AnimationPreset[]
}

export interface TextStyle {
  id: string
  name: string
  font_family: string
  font_size: number
  font_weight: number
  color: string
  background_color?: string
  padding?: number
  border_radius?: number
}

export interface AnimationPreset {
  id: string
  name: string
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'rotate'
  duration: number
  easing: string
  delay?: number
}

export interface VideoGenerationRequest {
  template_id: string
  content: {
    title: string
    script: string
    background_music?: string
    voice_over?: boolean
  }
  customizations?: {
    colors?: string[]
    fonts?: string[]
    animations?: string[]
  }
}

export interface VideoUpload {
  id: string
  user_id: string
  original_filename?: string
  file_size?: number
  file_type?: string
  duration?: number
  storage_path?: string
  public_url?: string
  youtube_url?: string
  youtube_video_id?: string
  upload_source: 'file' | 'youtube'
  status: 'uploaded' | 'pending_download' | 'processing' | 'ready_for_analysis' | 'analyzing' | 'completed' | 'error'
  error_message?: string
  transcript?: string
  analysis_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VideoSegment {
  id: string
  video_upload_id: string
  start_time: number
  end_time: number
  title?: string
  description?: string
  content_type?: string
  engagement_score: number
  transcript_segment?: string
  visual_cues?: Record<string, unknown>
  audio_features?: Record<string, unknown>
  export_url?: string
  platform_optimizations?: Record<string, unknown>
  status: 'extracted' | 'edited' | 'exported' | 'published'
  created_at: string
  updated_at: string
}