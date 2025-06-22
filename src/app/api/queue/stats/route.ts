import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../../utils/supabase/server"

import { videoProcessingQueue } from '../../../../lib/queues/video-processing-queue'

interface QueueStatsResponse {
  success: boolean
  stats: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: number
    total: number
  }
  performance: {
    averageProcessingTime: number
    throughputPerHour: number
    successRate: number
  }
  resources: {
    concurrency: number
    memoryUsage: number
    activeWorkers: number
  }
  recentJobs: Array<{
    id: string
    name: string
    status: string
    progress: number
    priority: number
    createdAt: string
    processedOn?: string
    finishedOn?: string
    duration?: number
  }>
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<QueueStatsResponse>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
          total: 0
        },
        performance: {
          averageProcessingTime: 0,
          throughputPerHour: 0,
          successRate: 0
        },
        resources: {
          concurrency: 0,
          memoryUsage: 0,
          activeWorkers: 0
        },
        recentJobs: [],
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get basic queue stats
    const jobCounts = await videoProcessingQueue.getJobCounts()
    
    // Get recent jobs for analysis
    const waitingJobs = await videoProcessingQueue.getWaiting(0, 50)
    const activeJobs = await videoProcessingQueue.getActive(0, 50)
    const completedJobs = await videoProcessingQueue.getCompleted(0, 100)
    const failedJobs = await videoProcessingQueue.getFailed(0, 50)

    // Calculate performance metrics
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Filter jobs from last hour for throughput calculation
    const recentCompletedJobs = completedJobs.filter(job => 
      job.finishedOn && job.finishedOn > oneHourAgo
    )
    
    const recentFailedJobs = failedJobs.filter(job => 
      job.finishedOn && job.finishedOn > oneHourAgo
    )

    // Calculate average processing time
    const jobsWithDuration = completedJobs
      .filter(job => job.processedOn && job.finishedOn)
      .slice(0, 50) // Last 50 completed jobs
    
    const averageProcessingTime = jobsWithDuration.length > 0
      ? jobsWithDuration.reduce((sum, job) => {
          return sum + (job.finishedOn! - job.processedOn!)
        }, 0) / jobsWithDuration.length
      : 0

    // Calculate success rate
    const totalRecentJobs = recentCompletedJobs.length + recentFailedJobs.length
    const successRate = totalRecentJobs > 0 
      ? (recentCompletedJobs.length / totalRecentJobs) * 100 
      : 100

    // Get memory usage
    const memoryUsage = process.memoryUsage()
    
    // Prepare recent jobs data
    const allRecentJobs = [
      ...activeJobs.map(job => ({
        id: job.id!,
        name: job.name,
        status: 'active',
        progress: job.progress || 0,
        priority: job.opts.priority || 5,
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        duration: job.processedOn ? now - job.processedOn : undefined
      })),
      ...waitingJobs.slice(0, 10).map(job => ({
        id: job.id!,
        name: job.name,
        status: 'waiting',
        progress: 0,
        priority: job.opts.priority || 5,
        createdAt: new Date(job.timestamp).toISOString()
      })),
      ...completedJobs.slice(0, 10).map(job => ({
        id: job.id!,
        name: job.name,
        status: 'completed',
        progress: 100,
        priority: job.opts.priority || 5,
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        duration: job.processedOn && job.finishedOn ? job.finishedOn - job.processedOn : undefined
      })),
      ...failedJobs.slice(0, 5).map(job => ({
        id: job.id!,
        name: job.name,
        status: 'failed',
        progress: job.progress || 0,
        priority: job.opts.priority || 5,
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const response: QueueStatsResponse = {
      success: true,
      stats: {
        waiting: jobCounts.waiting || 0,
        active: jobCounts.active || 0,
        completed: jobCounts.completed || 0,
        failed: jobCounts.failed || 0,
        delayed: jobCounts.delayed || 0,
        paused: jobCounts.paused || 0,
        total: Object.values(jobCounts).reduce((sum, count) => sum + (count || 0), 0)
      },
      performance: {
        averageProcessingTime: Math.round(averageProcessingTime),
        throughputPerHour: recentCompletedJobs.length,
        successRate: Math.round(successRate * 100) / 100
      },
      resources: {
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        activeWorkers: activeJobs.length
      },
      recentJobs: allRecentJobs.slice(0, 20)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Queue stats error:', error)
    return NextResponse.json({
      success: false,
      stats: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
        total: 0
      },
      performance: {
        averageProcessingTime: 0,
        throughputPerHour: 0,
        successRate: 0
      },
      resources: {
        concurrency: 0,
        memoryUsage: 0,
        activeWorkers: 0
      },
      recentJobs: [],
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Queue management endpoints
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    switch (action) {
      case 'pause':
        await videoProcessingQueue.pause()
        return NextResponse.json({ success: true, message: 'Queue paused' })
      
      case 'resume':
        await videoProcessingQueue.resume()
        return NextResponse.json({ success: true, message: 'Queue resumed' })
      
      case 'clean':
        // Clean completed and failed jobs older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        await videoProcessingQueue.clean(oneHourAgo, 'completed')
        await videoProcessingQueue.clean(oneHourAgo, 'failed')
        return NextResponse.json({ success: true, message: 'Queue cleaned' })
      
      case 'retry-failed':
        const failedJobs = await videoProcessingQueue.getFailed()
        let retriedCount = 0
        
        for (const job of failedJobs) {
          if (job.attemptsMade < 3) { // Max 3 attempts
            await job.retry()
            retriedCount++
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Retried ${retriedCount} failed jobs` 
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Queue management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}