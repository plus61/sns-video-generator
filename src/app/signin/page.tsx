'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /auth/signin for consistent routing
    router.replace('/auth/signin')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}