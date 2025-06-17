import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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
    
    // Test database connection only (remove hardcoded credentials)
    console.log('Testing Supabase connection...')
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError && !connectionError.message.includes('JWT')) {
      console.error('Supabase connection error:', connectionError)
      return NextResponse.json({
        error: 'Supabase connection test failed',
        connectionError: {
          message: connectionError.message,
          details: connectionError.details
        }
      }, { status: 400 })
    }
    
    console.log('Supabase connection successful')
    
    return NextResponse.json({
      success: true,
      supabase: {
        connected: true,
        connectionTest: 'OK'
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