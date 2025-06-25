import { NextRequest, NextResponse } from 'next/server'
import youtubedl from 'youtube-dl-exec'
import { promises as fs } from 'fs'
import path from 'path'
import { splitVideoIntoSegments } from '@/lib/simple-video-splitter'

export async function GET(request: NextRequest) {
  const tempDir = path.join(process.cwd(), 'temp', 'test')
  await fs.mkdir(tempDir, { recursive: true })
  
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
  const tempFilePath = path.join(tempDir, 'test-video.mp4')
  
  try {
    console.log('Starting real test...')
    console.log('USE_MOCK:', process.env.USE_MOCK)
    console.log('DISABLE_BULLMQ:', process.env.DISABLE_BULLMQ)
    
    // Step 1: Download
    console.log('\n1. Testing download with youtube-dl-exec...')
    await youtubedl(testUrl, {
      output: tempFilePath,
      format: 'worst[ext=mp4]/worst',
      quiet: false,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    })
    
    const downloadStats = await fs.stat(tempFilePath)
    console.log(`✅ Downloaded: ${downloadStats.size} bytes`)
    
    // Step 2: Split
    console.log('\n2. Testing video splitting...')
    const splitResult = await splitVideoIntoSegments(tempFilePath)
    console.log(`✅ Split result:`, splitResult)
    
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true })
    
    return NextResponse.json({
      success: true,
      downloadSize: downloadStats.size,
      segments: splitResult.segments?.length || 0,
      message: 'Real functionality test successful!'
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    
    // Clean up on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {}
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}