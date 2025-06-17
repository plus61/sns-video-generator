import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test database connection and user existence
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(session.user.id)
    
    if (userError) {
      return NextResponse.json({
        error: 'Failed to fetch user from auth.users',
        details: userError.message
      }, { status: 400 })
    }

    // Test video_uploads table access
    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)

    if (videoError) {
      return NextResponse.json({
        error: 'Failed to query video_uploads table',
        details: videoError.message,
        hint: videoError.hint
      }, { status: 400 })
    }

    // Test table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('video_uploads')
      .select('*')
      .limit(0)

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at
      },
      video_uploads_accessible: !videoError,
      existing_videos: videoData?.length || 0,
      table_structure: tableError ? 'Error accessing table' : 'Table accessible'
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}