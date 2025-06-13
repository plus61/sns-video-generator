import { supabase } from './supabase'
import type { VideoProject, VideoTemplate } from '@/types'

export async function createVideoProject(data: {
  user_id: string
  title?: string
  description?: string
  prompt: string
  script?: string
  status?: 'draft' | 'processing' | 'completed' | 'failed'
}): Promise<VideoProject | null> {
  try {
    const { data: project, error } = await supabase
      .from('video_projects')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating video project:', error)
      return null
    }

    return project
  } catch (error) {
    console.error('Error creating video project:', error)
    return null
  }
}

export async function updateVideoProject(
  id: string,
  updates: Partial<VideoProject>
): Promise<VideoProject | null> {
  try {
    const { data: project, error } = await supabase
      .from('video_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating video project:', error)
      return null
    }

    return project
  } catch (error) {
    console.error('Error updating video project:', error)
    return null
  }
}

export async function getVideoProjects(userId: string): Promise<VideoProject[]> {
  try {
    const { data: projects, error } = await supabase
      .from('video_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching video projects:', error)
      return []
    }

    return projects || []
  } catch (error) {
    console.error('Error fetching video projects:', error)
    return []
  }
}

export async function getVideoProject(id: string): Promise<VideoProject | null> {
  try {
    const { data: project, error } = await supabase
      .from('video_projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching video project:', error)
      return null
    }

    return project
  } catch (error) {
    console.error('Error fetching video project:', error)
    return null
  }
}

export async function getVideoTemplates(): Promise<VideoTemplate[]> {
  try {
    const { data: templates, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching video templates:', error)
      return []
    }

    return templates || []
  } catch (error) {
    console.error('Error fetching video templates:', error)
    return []
  }
}

export async function getUserUsage(userId: string) {
  try {
    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user usage:', error)
      return null
    }

    // If no usage record exists, create one
    if (!usage) {
      const { data: newUsage, error: createError } = await supabase
        .from('user_usage')
        .insert([{ user_id: userId }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating user usage:', createError)
        return null
      }

      return newUsage
    }

    return usage
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return null
  }
}

export async function incrementUserUsage(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_usage')
      .update({
        videos_generated: supabase.rpc('increment_videos_generated'),
        last_generation_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error incrementing user usage:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error incrementing user usage:', error)
    return null
  }
}

export async function checkUserCanGenerate(userId: string): Promise<boolean> {
  try {
    const usage = await getUserUsage(userId)
    if (!usage) return false

    // Check if user has reached monthly limit
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { data: monthlyCount, error } = await supabase
      .from('video_projects')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    if (error) {
      console.error('Error checking monthly usage:', error)
      return false
    }

    return (monthlyCount?.length || 0) < usage.monthly_limit
  } catch (error) {
    console.error('Error checking if user can generate:', error)
    return false
  }
}