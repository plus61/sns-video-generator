export interface VisualCueData {
  cues: Array<{
    timestamp: number
    type: string
    description: string
    confidence: number
    engagement_value: number
  }>
  frame_analyses: Array<{
    timestamp: number
    objects: Array<{ name: string; confidence: number }>
    scene_description: string
    engagement_indicators: string[]
    emotion_detected?: string
    visual_quality: number
  }>
  visual_engagement_score: number
  enhanced_analysis: {
    scene_changes: number
    face_time: number
    emotion_variety: number
    visual_quality_avg: number
  }
}