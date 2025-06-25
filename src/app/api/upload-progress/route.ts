import { NextRequest, NextResponse } from 'next/server'
import { ProgressManager } from '../../../lib/progress-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID required' },
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial progress if available
      const currentProgress = await ProgressManager.getProgress(videoId)
      if (currentProgress) {
        send(currentProgress)
      }

      // Subscribe to real-time updates
      const unsubscribe = ProgressManager.subscribeToVideo(videoId, (event) => {
        send(event)
        
        // Close stream on completion or error
        if (event.type === 'complete' || event.type === 'error') {
          unsubscribe()
          controller.close()
        }
      })

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(':ping\n\n'))
      }, 30000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        unsubscribe()
        controller.close()
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}