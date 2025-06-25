/**
 * Environment variable validator
 * Ensures all required env vars are present
 */

export interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // NextAuth
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  
  // Optional
  OPENAI_API_KEY?: string
  NODE_ENV?: string
}

export class EnvValidator {
  static validate(): EnvConfig {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ]
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing)
      
      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
      }
      
      // In development, warn but continue with dummy values
      console.warn('⚠️  Using dummy values for missing env vars (development only)')
      missing.forEach(key => {
        if (key.includes('SUPABASE_URL')) {
          process.env[key] = 'https://dummy.supabase.co'
        } else if (key.includes('SUPABASE')) {
          process.env[key] = 'dummy-key-for-dev'
        } else if (key === 'NEXTAUTH_URL') {
          process.env[key] = 'http://localhost:3000'
        } else if (key === 'NEXTAUTH_SECRET') {
          process.env[key] = 'dummy-secret-for-dev'
        }
      })
    }
    
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
  }
  
  static logConfig() {
    console.log('🔧 Environment Configuration:')
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'development')
    console.log('  Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('  Supabase Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    console.log('  NextAuth URL:', process.env.NEXTAUTH_URL || 'Not set')
    console.log('  OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Set' : '⚠️  Not set')
  }
}