import { NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"

import { getVideoProjects } from '@/lib/database'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projects = await getVideoProjects(user.id)

    return NextResponse.json({
      projects,
      total: projects.length
    })
  } catch (error) {
    console.error('Error fetching video projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}