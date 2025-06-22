import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../utils/supabase/server"

import { getVideoProject, updateVideoProject, getVideoTemplates } from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get project details
    const project = await getVideoProject(projectId)
    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update project status to processing
    await updateVideoProject(projectId, { status: 'processing' })

    // Get all templates to find default if none specified
    const templates = await getVideoTemplates()
    const template = templates[0] // Use first template as default

    if (!template) {
      return NextResponse.json(
        { error: 'No video template available' },
        { status: 500 }
      )
    }

    // Note: Actual video generation would happen in a background job
    // For demo purposes, we'll simulate the process
    setTimeout(async () => {
      try {
        // Simulate video generation delay
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // In production, this would:
        // 1. Generate actual video file using the VideoGenerator
        // 2. Upload to cloud storage (Supabase Storage, AWS S3, etc.)
        // 3. Update project with video URL
        
        const mockVideoUrl = `https://example.com/videos/${projectId}.mp4`
        
        await updateVideoProject(projectId, {
          status: 'completed',
          video_url: mockVideoUrl,
          duration: template.config.duration || 10
        })
      } catch (error) {
        console.error('Background video generation failed:', error)
        await updateVideoProject(projectId, { status: 'failed' })
      }
    }, 0)

    return NextResponse.json({
      message: 'Video generation started',
      projectId,
      status: 'processing'
    })
  } catch (error) {
    console.error('Error starting video generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}