export interface AnalysisResult {
  engagement_score?: number
  completeness_score?: number
  sns_score?: number
  viral_score?: number
  reasoning?: string
  suggested_title?: string
  hashtags?: string[]
  platform_recommendations?: string[]
}