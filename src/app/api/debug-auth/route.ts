import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth'
import { debugAuthSession, debugAuthConfig } from '@/lib/auth-debug'

export async function GET(request: NextRequest) {
  // Only allow in development or with debug flag
  const isDev = process.env.NODE_ENV === 'development'
  const debugMode = request.nextUrl.searchParams.get('debug') === 'true'
  
  if (!isDev && !debugMode) {
    return NextResponse.json({ error: 'Debug endpoint not available' }, { status: 403 })
  }

  try {
    console.log('=== AUTH DEBUG API CALLED ===')
    
    // Debug environment
    debugAuthConfig()
    
    // Test session retrieval
    const session = await debugAuthSession()
    
    // Check cookies
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('next-auth') || cookie.name.includes('__Secure-next-auth')
    )
    
    console.log('Auth cookies found:', authCookies.length)
    authCookies.forEach(cookie => {
      console.log(`Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`)
    })
    
    // Check headers
    const authHeaders = {
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer'),
      'cookie': request.headers.get('cookie')?.substring(0, 200) + '...'
    }
    
    console.log('Request headers:', authHeaders)
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      session: session ? {
        exists: true,
        userId: session.user?.id,
        userEmail: session.user?.email,
        expires: session.expires
      } : {
        exists: false
      },
      cookies: {
        total: cookies.length,
        authCookies: authCookies.length,
        cookieNames: authCookies.map(c => c.name)
      },
      request: {
        method: request.method,
        url: request.url,
        hasAuthHeaders: !!request.headers.get('authorization')
      }
    }
    
    console.log('Debug info compiled:', debugInfo)
    
    return NextResponse.json(debugInfo)
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}