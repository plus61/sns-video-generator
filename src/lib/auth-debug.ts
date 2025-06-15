import { NextAuthOptions } from 'next-auth'
import { getServerSession } from "next-auth/next"
import { authOptions } from './auth'

export async function debugAuthSession(req?: any, res?: any) {
  console.log('=== DEBUG AUTH SESSION ===')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Server session result:', {
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null,
      expires: session?.expires
    })
    
    return session
  } catch (error) {
    console.error('Server session error:', error)
    return null
  }
}

export function debugAuthConfig() {
  console.log('=== DEBUG AUTH CONFIG ===')
  console.log('Environment variables:')
  console.log({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[MISSING]',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '[SET]' : '[MISSING]',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[MISSING]',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  })
  
  console.log('Auth options summary:', {
    sessionStrategy: 'jwt',
    hasCredentialsProvider: true,
    hasOAuthProviders: !!(process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_ID),
    cookieDomain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
  })
}