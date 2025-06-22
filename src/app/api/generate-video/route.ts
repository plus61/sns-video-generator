import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../utils/supabase/server"

import { generateVideoScript, generateVideoTitle } from '../../../lib/openai'
import { createVideoProject, checkUserCanGenerate, incrementUserUsage } from '../../../lib/database'

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

    const { prompt, title } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check if user can generate more videos (monthly limit)
    const canGenerate = await checkUserCanGenerate(user.id)
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Monthly video generation limit reached' },
        { status: 429 }
      )
    }

    // Generate video script using OpenAI
    const script = await generateVideoScript(prompt)
    
    if (!script) {
      return NextResponse.json(
        { error: 'Failed to generate video script' },
        { status: 500 }
      )
    }

    // Generate title if not provided
    let finalTitle = title
    if (!title) {
      finalTitle = await generateVideoTitle(script)
    }

    // Save to database
    const videoProject = await createVideoProject({
      user_id: user.id,
      title: finalTitle,
      prompt,
      script,
      status: 'completed'
    })

    if (!videoProject) {
      return NextResponse.json(
        { error: 'Failed to save video project' },
        { status: 500 }
      )
    }

    // Increment user usage counter
    await incrementUserUsage(user.id)

    return NextResponse.json({
      id: videoProject.id,
      script,
      title: finalTitle,
      status: videoProject.status,
      created_at: videoProject.created_at,
      message: 'Video content generated successfully'
    })
  } catch (error) {
    console.error('Error in generate-video API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}