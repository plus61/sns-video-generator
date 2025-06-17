import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('=== Simple Auth Test ===')
    
    // Check if session exists
    const session = await getServerSession(authOptions)
    
    const result = {
      hasSession: !!session,
      sessionData: session ? {
        userId: session.user?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        expires: session.expires
      } : null,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET
      }
    }
    
    console.log('Auth test result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      error: 'Auth test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}