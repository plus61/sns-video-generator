import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SUPABASE CONNECTION TEST ===')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlStart: supabaseUrl?.substring(0, 30),
      keyStart: supabaseKey?.substring(0, 20)
    })
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }, { status: 500 })
    }
    
    // Test connection
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Test authentication with test user
    console.log('Testing Supabase auth...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@sns-video-generator.com',
      password: 'test123456'
    })
    
    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json({
        error: 'Supabase auth test failed',
        authError: {
          message: authError.message,
          status: authError.status,
          details: authError.details
        }
      }, { status: 400 })
    }
    
    console.log('Supabase auth successful:', authData.user?.id)
    
    // Test profile fetch
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      console.log('Profile fetch result:', {
        hasProfile: !!profileData,
        profileError: profileError?.message
      })
    }
    
    return NextResponse.json({
      success: true,
      supabase: {
        connected: true,
        authTest: {
          success: true,
          userId: authData.user?.id,
          email: authData.user?.email
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      error: 'Supabase test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}