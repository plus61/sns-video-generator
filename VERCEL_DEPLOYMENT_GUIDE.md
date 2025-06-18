# Vercel Deployment Guide for SNS Video Generator

## Overview

This guide explains how to deploy the SNS Video Generator on Vercel while handling binary dependencies and platform limitations.

## Architecture

### Dual Deployment Strategy

1. **Vercel (Frontend + Light API)**
   - Next.js frontend
   - Authentication
   - Database operations
   - AI text processing (OpenAI)
   - Light API endpoints

2. **Railway (Heavy Processing Backend)**
   - Video processing (FFmpeg)
   - Thumbnail generation (Canvas)
   - Queue processing (BullMQ)
   - Long-running tasks

## Vercel Setup

### 1. Environment Variables

Set these in Vercel Dashboard:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-32-chars-min

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Railway Backend (important!)
RAILWAY_PROCESSING_URL=https://your-railway-app.up.railway.app
RAILWAY_API_KEY=your-railway-api-key
```

### 2. Build Configuration

The project includes Vercel-specific configurations:

- `vercel.json` - Deployment settings
- `vercel-build.sh` - Custom build script
- `next.config.vercel.ts` - Vercel-optimized Next.js config
- `package.vercel.json` - Dependencies without binaries

### 3. Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `sns-video-generator`
   - Build Command: `bash vercel-build.sh` (auto-detected from vercel.json)

3. **Configure Environment Variables**
   - Add all variables from section 1
   - Ensure `RAILWAY_PROCESSING_URL` points to your Railway backend

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## Railway Backend Setup

### 1. Deploy Processing Service

Create `railway.json` in your project:

```json
{
  "build": {
    "builder": "dockerfile",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "on-failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### 2. Environment Variables for Railway

```env
# Same Supabase config
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Redis for BullMQ
REDIS_URL=redis://default:password@host:6379

# Processing settings
MAX_VIDEO_SIZE=2147483648  # 2GB
PROCESSING_TIMEOUT=600000   # 10 minutes
TEMP_DIR=/tmp/video-processing
```

### 3. Processing Endpoints

Your Railway instance should expose these endpoints:

- `POST /api/process-job` - Receive processing jobs from Vercel
- `GET /api/job-status/:id` - Check job status
- `POST /api/webhooks/job-complete` - Notify Vercel of completion

## Code Modifications

### 1. Use Compatibility Layer

Replace direct imports with the compatibility layer:

```typescript
// Before
import { getVideoProcessor } from '@/lib/video-processor'

// After
import { getVideoProcessor } from '@/lib/compatibility-layer'
```

### 2. Handle Platform Limitations

```typescript
import { isVercel, canvasEnabled } from '@/lib/compatibility-layer'

// In your API route
export async function POST(request: Request) {
  if (isVercel) {
    // Offload to Railway
    return await offloadToRailway(request)
  } else {
    // Process locally
    return await processLocally(request)
  }
}
```

### 3. Update Video Processing Flow

```typescript
// In Vercel environment
async function processVideo(videoId: string) {
  // 1. Create job in database
  const job = await createProcessingJob(videoId)
  
  // 2. Trigger Railway processing
  await fetch(`${process.env.RAILWAY_PROCESSING_URL}/api/process-job`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RAILWAY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jobId: job.id, videoId })
  })
  
  // 3. Return job ID for status polling
  return { jobId: job.id, status: 'processing' }
}
```

## Troubleshooting

### Build Failures

1. **"Cannot find module 'canvas'"**
   - Ensure `DISABLE_CANVAS=true` is set
   - Check that compatibility layer is used

2. **"Redis connection failed"**
   - Ensure `DISABLE_BULLMQ=true` is set
   - Use Supabase queue implementation

3. **"Function timeout"**
   - Reduce processing in Vercel
   - Offload to Railway backend

### Runtime Issues

1. **Video upload fails**
   - Check file size limits (100MB on Vercel)
   - Ensure Supabase storage is configured

2. **Processing never completes**
   - Verify Railway backend is running
   - Check webhook configuration
   - Monitor Railway logs

3. **Thumbnails not generating**
   - This is expected on Vercel
   - Ensure Railway backend handles it

## Performance Optimization

### 1. Use Edge Functions

For lightweight operations:

```typescript
export const runtime = 'edge' // in route.ts
```

### 2. Implement Caching

```typescript
// Cache AI responses
const cacheKey = `ai-analysis-${videoId}`
const cached = await redis.get(cacheKey)
if (cached) return cached
```

### 3. Progressive Enhancement

```typescript
// Start with basic features
const features = {
  upload: true,
  aiAnalysis: true,
  thumbnails: isRailway,
  advancedEditing: isRailway
}
```

## Monitoring

### Vercel Analytics

- Monitor function execution time
- Track error rates
- Identify bottlenecks

### Custom Metrics

```typescript
// Track processing jobs
await supabase.from('analytics').insert({
  event: 'video_processing_started',
  platform: isVercel ? 'vercel' : 'railway',
  timestamp: new Date()
})
```

## Migration Path

When ready to move everything to Railway:

1. Update environment variables
2. Remove Vercel-specific configs
3. Use original `package.json`
4. Deploy with full feature set

## Cost Optimization

### Vercel (Free/Pro)
- Frontend hosting: ~$0-20/month
- Function executions: Limited by plan
- Bandwidth: 100GB free

### Railway (Pro)
- Processing backend: ~$5-20/month
- Redis: ~$5/month
- Storage: Based on usage

### Total Estimated Cost
- Development: ~$10-25/month
- Production (1000 users): ~$50-100/month