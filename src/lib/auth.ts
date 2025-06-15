import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import { errorReporter } from './error-reporting'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      },
    },
  },
  debug: process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata })
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true') {
        console.log('NextAuth Debug:', { code, metadata })
      }
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth: Missing email or password')
          return null
        }

        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('NextAuth: Missing Supabase environment variables')
          return null
        }

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: { autoRefreshToken: false, persistSession: false }
          }
        )

        try {
          console.log('NextAuth: Attempting Supabase auth for:', credentials.email)
          
          // Sign in with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) {
            const authError = new Error(`Supabase auth failed: ${error.message}`)
            errorReporter.reportAuthError(authError, 'credentials', credentials.email)
            return null
          }

          if (!data.user) {
            console.error('NextAuth: No user data returned from Supabase')
            return null
          }

          console.log('NextAuth: Supabase auth successful for user:', data.user.id)

          // Get user profile with error handling
          let profile = null
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()
            
            if (profileError) {
              console.warn('NextAuth: Profile fetch failed:', profileError.message)
            } else {
              profile = profileData
            }
          } catch (profileErr) {
            console.warn('NextAuth: Profile fetch error:', profileErr)
          }

          const user = {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.full_name || data.user.email,
            image: profile?.avatar_url || null,
          }

          console.log('NextAuth: Returning user object:', { id: user.id, email: user.email })
          return user
        } catch (error) {
          const authError = error instanceof Error ? error : new Error(String(error))
          errorReporter.reportAuthError(authError, 'credentials', credentials.email)
          return null
        }
      }
    }),
    // OAuth providers - only if environment variables are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - store user data in JWT
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        
        // For OAuth providers, create/update profile in Supabase
        if (account && (account.provider === 'google' || account.provider === 'github')) {
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )
            
            // Create or update user profile
            await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                email: user.email,
                full_name: user.name,
                avatar_url: user.image,
                subscription_tier: 'free',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })
          } catch (error) {
            const profileError = error instanceof Error ? error : new Error(String(error))
            errorReporter.reportError(profileError, {
              category: 'profile_creation',
              provider: account?.provider,
              userId: user.id
            })
            // Don't fail auth if profile creation fails
          }
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Pass JWT data to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for JWT strategy
      return true
    },
    
    async redirect({ url, baseUrl }) {
      // Handle redirects properly
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}