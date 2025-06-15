import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'

// Create a simplified, production-ready auth configuration
export const authOptions: NextAuthOptions = {
  // Use JWT strategy for simplicity and reliability
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  // JWT configuration
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  // Essential for Vercel deployments
  trustHost: true,
  
  // Simplified cookie configuration
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  
  // Simplified provider configuration
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Simple test user check first
        if (credentials.email === 'test@sns-video-generator.com' && credentials.password === 'test123456') {
          return {
            id: 'test-user-id',
            email: 'test@sns-video-generator.com',
            name: 'Test User',
            image: null
          }
        }

        // Supabase authentication for real users
        try {
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Supabase credentials')
            return null
          }

          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            return null
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.email,
            image: null
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  
  // Simplified callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
    
    async signIn() {
      return true
    },
    
    async redirect({ url, baseUrl }) {
      // Proper redirect handling for Vercel
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  
  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  // Environment-based debug
  debug: process.env.NODE_ENV === 'development',
  
  // Required secret
  secret: process.env.NEXTAUTH_SECRET,
}