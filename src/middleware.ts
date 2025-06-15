import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Debug logging for authentication issues
    if (process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true') {
      console.log('Middleware check:', {
        pathname,
        hasToken: !!req.nextauth.token,
        tokenId: req.nextauth.token?.id,
        tokenEmail: req.nextauth.token?.email
      })
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Debug logging
        if (process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true') {
          console.log('Authorization check:', {
            pathname,
            hasToken: !!token,
            tokenId: token?.id,
            tokenEmail: token?.email
          })
        }
        
        // Allow access to debug endpoints
        if (pathname.startsWith('/api/debug-') || pathname.startsWith('/api/test-')) {
          return true
        }
        
        // Allow access to auth pages when not authenticated
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to public pages
        if (pathname === '/' || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Allow access to public API endpoints
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/video-') && !pathname.startsWith('/api/user-')) {
          return true
        }
        
        // Require authentication for protected routes
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/studio') ||
          pathname.startsWith('/upload') ||
          pathname.startsWith('/analyze') ||
          pathname.startsWith('/api/video-') ||
          pathname.startsWith('/api/user-')
        ) {
          const authorized = !!token
          if (!authorized) {
            console.log('Unauthorized access attempt to:', pathname)
          }
          return authorized
        }
        
        // Default: allow access
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}