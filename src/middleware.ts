import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow debug and test endpoints
        if (pathname.startsWith('/api/debug-') || pathname.startsWith('/api/test-') || pathname.startsWith('/debug-')) {
          return true
        }
        
        // Allow auth pages
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow public pages and API auth endpoints
        if (pathname === '/' || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Allow public API endpoints (exclude protected ones)
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/video-') && !pathname.startsWith('/api/user-')) {
          return true
        }
        
        // Protected routes require authentication
        const protectedRoutes = ['/dashboard', '/studio', '/upload', '/analyze', '/api/video-', '/api/user-']
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
        
        if (isProtectedRoute) {
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