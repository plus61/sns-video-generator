import { NextResponse } from 'next/server'

// Generic upload endpoint - routes to appropriate upload handler
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'video'
    
    let targetEndpoint = '/api/upload-video'
    
    switch (type) {
      case 'youtube':
        targetEndpoint = '/api/upload-youtube'
        break
      case 'video':
      default:
        targetEndpoint = '/api/upload-video'
        break
    }
    
    const newUrl = new URL(targetEndpoint, request.url)
    
    return fetch(newUrl.toString(), {
      method: 'POST',
      headers: request.headers,
      body: request.body,
    })
  } catch (error) {
    console.error('Upload routing error:', error)
    return NextResponse.json(
      { error: 'Upload routing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint ready',
    supportedTypes: ['video', 'youtube'],
    endpoints: {
      video: '/api/upload?type=video',
      youtube: '/api/upload?type=youtube'
    }
  })
}