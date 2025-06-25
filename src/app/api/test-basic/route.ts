import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Basic test endpoint is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      status: 'ok',
      message: 'POST received',
      data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to parse JSON',
      error: (error as Error).message
    }, { status: 400 })
  }
}