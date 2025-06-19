import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    console.log('=== Simple Supabase Auth Test ===')
    
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const result = {
      hasUser: !!user,
      userData: user ? {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        emailConfirmed: user.email_confirmed_at,
        lastSignIn: user.last_sign_in_at
      } : null,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      error: error?.message
    }
    
    console.log('Supabase auth test result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supabase auth test error:', error)
    return NextResponse.json({
      error: 'Supabase auth test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}