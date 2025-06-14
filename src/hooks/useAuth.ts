'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  redirectIfFound?: boolean
}

export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const {
    required = false,
    redirectTo = '/auth/signin',
    redirectIfFound = false
  } = options

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // If auth is required and there's no session, redirect to login
    if (required && !session) {
      router.push(redirectTo)
      return
    }

    // If session exists and redirectIfFound is true, redirect
    if (redirectIfFound && session) {
      router.push(redirectTo)
      return
    }
  }, [session, status, required, redirectTo, redirectIfFound, router])

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user: session?.user || null
  }
}

export function useRequireAuth(redirectTo = '/auth/signin') {
  return useAuth({ required: true, redirectTo })
}

export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  return useAuth({ redirectIfFound: true, redirectTo })
}