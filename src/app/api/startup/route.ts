import { NextResponse } from 'next/server'

// Server startup confirmation
console.log('🚀 Server API routes loaded successfully!')
console.log(`📍 Environment: ${process.env.NODE_ENV}`)
console.log(`🌐 Server started at: ${new Date().toISOString()}`)

export async function GET() {
  const status = {
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
  
  console.log('Startup endpoint called:', status)
  
  return NextResponse.json(status)
}