import { createClient } from '@/utils/supabase/server'
import type { VideoProject, VideoUpload } from '@/types'

interface UserUsage {
  videos_generated: number
  monthly_limit: number
  remaining: number
  last_generation_at: string | null
  reset_date: string
}

export interface DashboardServerData {
  projects: VideoProject[]
  videoUploads: VideoUpload[]
  usage: UserUsage | null
}

// React 19 Server Component with async data fetching
export async function DashboardData(): Promise<DashboardServerData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      projects: [],
      videoUploads: [],
      usage: null
    }
  }

  try {
    // Parallel data fetching for optimal performance
    const [projectsResult, uploadsResult, usageResult] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/video-projects`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      }).then(res => res.ok ? res.json() : { projects: [] }),

      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/video-uploads`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      }).then(res => res.ok ? res.json() : { uploads: [] }),

      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user-usage`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      }).then(res => res.ok ? res.json() : { usage: null })
    ])

    return {
      projects: projectsResult.projects || [],
      videoUploads: uploadsResult.uploads || [],
      usage: usageResult.usage || null
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return {
      projects: [],
      videoUploads: [],
      usage: null
    }
  }
}