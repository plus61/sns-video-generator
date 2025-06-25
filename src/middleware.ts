import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Allow health checks and other public API routes to bypass authentication
  if (
    request.nextUrl.pathname.startsWith('/api/health') ||
    request.nextUrl.pathname.startsWith('/api/debug') ||
    request.nextUrl.pathname.startsWith('/api/test-basic') ||
    request.nextUrl.pathname.startsWith('/api/test-supabase') ||
    request.nextUrl.pathname.startsWith('/api/queue/stats') ||
    request.nextUrl.pathname.startsWith('/test') ||
    request.nextUrl.pathname.startsWith('/api/split-video') ||
    request.nextUrl.pathname.startsWith('/api/upload-youtube') ||
    request.nextUrl.pathname.startsWith('/api/analyze-simple') ||
    request.nextUrl.pathname.startsWith('/api/process-simple') ||
    request.nextUrl.pathname.startsWith('/api/split-simple') ||
    request.nextUrl.pathname.startsWith('/api/split-fixed') ||
    request.nextUrl.pathname.startsWith('/api/test-ffmpeg') ||
    request.nextUrl.pathname.startsWith('/api/upload-youtube-simple') ||
    request.nextUrl.pathname.startsWith('/api/process-full-simple') ||
    request.nextUrl.pathname.startsWith('/api/preview-segment') ||
    request.nextUrl.pathname.startsWith('/api/download-segments') ||
    request.nextUrl.pathname.startsWith('/simple')
  ) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}