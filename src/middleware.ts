import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages when not authenticated
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to public pages
        if (pathname === '/' || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Allow access to public API endpoints
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/video-')) {
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
          return !!token
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