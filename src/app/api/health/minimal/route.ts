import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Health check endpoint called')
  return new NextResponse('OK', { status: 200 })
}