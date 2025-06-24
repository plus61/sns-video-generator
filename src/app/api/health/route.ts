import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { videoProcessingQueue } from '../../../lib/queues/video-processing-queue-vercel'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
    redis: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
    queue: {
      status: 'up' | 'down'
      waiting: number
      active: number
      failed: number
      completed: number
      responseTime: number
      error?: string
    }
    storage: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
    disk: {
      used: number
      total: number
      percentage: number
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now()
  
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: { status: 'down', responseTime: 0 },
      redis: { status: 'down', responseTime: 0 },
      queue: { status: 'down', responseTime: 0, waiting: 0, active: 0, failed: 0, completed: 0 },
      storage: { status: 'down', responseTime: 0 },
      memory: { used: 0, total: 0, percentage: 0 },
      disk: { used: 0, total: 0, percentage: 0 }
    }
  }

  // Check Database (Supabase)
  try {
    const dbStart = Date.now()
    const { data, error } = await supabaseAdmin
      .from('video_uploads')
      .select('count')
      .limit(1)
    
    healthCheck.checks.database = {
      status: error ? 'down' : 'up',
      responseTime: Date.now() - dbStart,
      error: error?.message
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Check Redis & Queue
  try {
    const redisStart = Date.now()
    const queueStatus = await videoProcessingQueue.getJobCounts()
    
    healthCheck.checks.redis = {
      status: 'up',
      responseTime: Date.now() - redisStart
    }
    
    healthCheck.checks.queue = {
      status: 'up',
      responseTime: Date.now() - redisStart,
      waiting: queueStatus.waiting || 0,
      active: queueStatus.active || 0,
      failed: queueStatus.failed || 0,
      completed: queueStatus.completed || 0
    }
  } catch (error) {
    const redisError = error instanceof Error ? error.message : 'Unknown Redis error'
    healthCheck.checks.redis = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: redisError
    }
    healthCheck.checks.queue = {
      status: 'down',
      responseTime: Date.now() - startTime,
      waiting: 0,
      active: 0,
      failed: 0,
      completed: 0,
      error: redisError
    }
  }

  // Check Storage (Supabase Storage)
  try {
    const storageStart = Date.now()
    // Simple storage check - list buckets
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
    
    healthCheck.checks.storage = {
      status: error ? 'down' : 'up',
      responseTime: Date.now() - storageStart,
      error: error?.message
    }
  } catch (error) {
    healthCheck.checks.storage = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown storage error'
    }
  }

  // Check Memory Usage
  try {
    const memUsage = process.memoryUsage()
    const totalMemory = parseInt(process.env.RAILWAY_MEMORY_LIMIT || '2147483648') // 2GB default
    
    healthCheck.checks.memory = {
      used: memUsage.heapUsed,
      total: totalMemory,
      percentage: Math.round((memUsage.heapUsed / totalMemory) * 100)
    }
  } catch (error) {
    healthCheck.checks.memory = {
      used: 0,
      total: 0,
      percentage: 0
    }
  }

  // Check Disk Usage (estimate based on temp directory)
  try {
    const fs = require('fs')
    const path = '/tmp/video-processing'
    
    let diskUsed = 0
    if (fs.existsSync(path)) {
      const files = fs.readdirSync(path)
      for (const file of files) {
        try {
          const stat = fs.statSync(`${path}/${file}`)
          diskUsed += stat.size
        } catch {} // Ignore individual file errors
      }
    }
    
    const totalDisk = 10 * 1024 * 1024 * 1024 // 10GB as configured in railway.toml
    
    healthCheck.checks.disk = {
      used: diskUsed,
      total: totalDisk,
      percentage: Math.round((diskUsed / totalDisk) * 100)
    }
  } catch (error) {
    healthCheck.checks.disk = {
      used: 0,
      total: 0,
      percentage: 0
    }
  }

  // Determine overall health status
  const failedChecks = Object.values(healthCheck.checks).filter(check => 
    'status' in check && check.status === 'down'
  ).length

  if (failedChecks === 0) {
    healthCheck.status = 'healthy'
  } else if (failedChecks <= 2) {
    healthCheck.status = 'degraded'
  } else {
    healthCheck.status = 'unhealthy'
  }

  // Check resource usage thresholds
  if (healthCheck.checks.memory.percentage > 90 || healthCheck.checks.disk.percentage > 85) {
    healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : 'unhealthy'
  }

  // Return appropriate HTTP status
  let httpStatus = 200
  if (healthCheck.status === 'degraded') {
    httpStatus = 206 // Partial Content
  } else if (healthCheck.status === 'unhealthy') {
    httpStatus = 503 // Service Unavailable
  }

  console.log(`Health check completed: ${healthCheck.status} (${failedChecks} failed checks)`)

  return NextResponse.json(healthCheck, { status: httpStatus })
}

// Simple liveness probe
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 })
}