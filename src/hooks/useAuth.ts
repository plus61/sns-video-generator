'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  redirectIfFound?: boolean
}

export function useAuth(options: UseAuthOptions = {}) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const {
    required = false,
    redirectTo = '/signin',
    redirectIfFound = false
  } = options

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (loading) return // Still loading

    // If auth is required and there's no user, redirect to login
    if (required && !user) {
      router.push(redirectTo)
      return
    }

    // If user exists and redirectIfFound is true, redirect
    if (redirectIfFound && user) {
      router.push(redirectTo)
      return
    }
  }, [user, loading, required, redirectTo, redirectIfFound, router])

  return {
    user,
    isAuthenticated: !!user,
    isLoading: loading
  }
}

export function useRequireAuth(redirectTo = '/signin') {
  return useAuth({ required: true, redirectTo })
}

export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  return useAuth({ redirectIfFound: true, redirectTo })
}