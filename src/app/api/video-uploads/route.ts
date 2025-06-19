import { NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"

import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: uploads, error } = await supabaseAdmin
      .from('video_uploads')
      .select(`
        *,
        video_segments(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploads
    })

  } catch (error) {
    console.error('Get video uploads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}