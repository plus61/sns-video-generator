'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'

export function useAuth({ 
  required = false, 
  redirectTo = '/signin' 
} = {}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
      } else if (required) {
        router.push(redirectTo)
      }
      
      setIsLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        if (required) {
          router.push(redirectTo)
        }
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [required, redirectTo, router])

  return { user, isAuthenticated, isLoading }
}