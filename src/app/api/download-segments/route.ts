import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import archiver from 'archiver'
import { PassThrough } from 'stream'
import type { DownloadSegmentsRequest, DownloadSegmentsErrorResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const { segments }: DownloadSegmentsRequest = await request.json()
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      const errorResponse: DownloadSegmentsErrorResponse = { error: 'No segments provided' }
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
    // Create a pass-through stream to handle the archive data
    const passThrough = new PassThrough()
    const chunks: Uint8Array[] = []
    
    // Collect chunks as they come
    passThrough.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    // Create ZIP archive with streaming
    const archive = archiver('zip', {
      zlib: { level: 5 } // Balance between speed and compression
    })
    
    // Pipe archive to pass-through stream
    archive.pipe(passThrough)
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      passThrough.destroy(err)
    })
    
    // Add each segment to the archive
    let addedFiles = 0
    for (const segment of segments) {
      if (!segment.path || !segment.name) {
        console.warn('Invalid segment data:', segment)
        continue
      }
      
      const normalizedPath = path.normalize(segment.path)
      const tempDir = path.join(process.cwd(), 'temp')
      
      // Security check - ensure file is in temp directory
      if (!normalizedPath.startsWith(tempDir)) {
        console.warn(`Security: Attempted to access file outside temp directory: ${normalizedPath}`)
        continue
      }
      
      try {
        // Check if file exists
        await fs.access(normalizedPath)
        
        // Add file to archive using stream to handle large files efficiently
        const fileStream = await fs.readFile(normalizedPath)
        const fileName = segment.name.endsWith('.mp4') ? segment.name : `${segment.name}.mp4`
        
        archive.append(fileStream, { name: fileName })
        addedFiles++
      } catch (error) {
        console.error(`Failed to add segment ${segment.name}:`, error)
      }
    }
    
    // Check if any files were added
    if (addedFiles === 0) {
      const errorResponse: DownloadSegmentsErrorResponse = { 
        error: 'No valid segments found to download' 
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }
    
    // Finalize the archive
    await archive.finalize()
    
    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      passThrough.on('end', resolve)
      passThrough.on('error', reject)
    })
    
    // Convert chunks to buffer
    const zipBuffer = Buffer.concat(chunks)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `video-segments-${timestamp}.zip`
    
    // Return the ZIP file with proper headers
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Download segments error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const errorResponse: DownloadSegmentsErrorResponse = { 
      error: 'Failed to create download',
      details: errorMessage
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}