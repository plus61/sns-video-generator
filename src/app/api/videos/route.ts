import { NextResponse } from 'next/server'

// Alias endpoint for /api/video-uploads for better REST API compliance
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const newUrl = new URL('/api/video-uploads', request.url)
  
  // Forward all query parameters
  searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value)
  })
  
  return fetch(newUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  })
}

export async function POST(request: Request) {
  const newUrl = new URL('/api/video-uploads', request.url)
  
  return fetch(newUrl.toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  })
}