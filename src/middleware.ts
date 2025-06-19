import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // CORS headers for Railway API server
    const response = NextResponse.next()
    
    // Allow requests from Vercel frontend
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'https://sns-video-generator.vercel.app',
      'https://sns-video-generator-yuichiroooosuger.vercel.app',
      'http://localhost:3000',
      'https://localhost:3000'
    ]
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    return response
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