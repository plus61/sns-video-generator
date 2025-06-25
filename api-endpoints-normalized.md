# API Endpoints - Normalized for Railway Deployment

## 🔧 Health Check Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/simple` - Simple health check
- `GET /api/health/simple-health` - Railway health check endpoint
- `GET /api/health/minimal` - Minimal health check

## 📹 Video Processing Endpoints
- `POST /api/upload-youtube` - Upload video from YouTube URL
- `POST /api/process-simple` - Process YouTube video (simple version)
- `POST /api/process-full-simple` - Full video processing pipeline
- `POST /api/split-simple` - Split video into segments
- `POST /api/split-fixed` - Fixed video splitting
- `POST /api/split-video` - Legacy video splitting

## 🤖 AI Analysis Endpoints
- `POST /api/analyze-simple` - Simple AI analysis
- `POST /api/analyze-video` - Video content analysis
- `POST /api/analyze-video-ai` - AI-powered video analysis

## 📥 Download Endpoints
- `POST /api/download-video` - Download processed video
- `GET /api/download-segments` - Download video segments
- `GET /api/download-segment` - Download single segment
- `GET /api/preview-segment` - Preview video segment

## 🧪 Test Endpoints
- `GET /api/test-basic` - Basic functionality test
- `GET /api/test-supabase` - Supabase connection test
- `GET /api/test-db` - Database connection test
- `GET /api/test-ffmpeg` - FFmpeg functionality test
- `GET /api/test-real` - Real-world scenario test
- `GET /api/test-download` - Download functionality test
- `GET /api/test-auth-simple` - Simple auth test

## 🗂️ Data Management Endpoints
- `GET /api/video-uploads` - List video uploads
- `POST /api/upload` - Generic file upload
- `POST /api/upload-file` - File upload handler
- `GET /api/upload-progress` - Upload progress tracking
- `GET /api/videos` - List all videos
- `GET /api/video-projects` - List video projects
- `GET /api/video-templates` - List video templates

## 🛠️ Utility Endpoints
- `GET /api/debug` - Debug information
- `GET /api/startup` - Startup checks
- `GET /api/queue/stats` - Queue statistics

## 🔐 Authentication Endpoints (Handled by NextAuth)
- Authentication is handled by NextAuth middleware
- API routes bypass auth via middleware configuration

## CORS Configuration
All API endpoints are configured with CORS headers to support:
- Origin: `https://sns-video-generator.vercel.app` (or configured via FRONTEND_URL)
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Credentials: true

## Environment Variables Required
```bash
# Frontend URL for CORS
FRONTEND_URL=https://sns-video-generator.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_URL=https://your-api.railway.app
NEXTAUTH_SECRET=your_nextauth_secret
```

## Notes for Railway Deployment
1. All endpoints are accessible via `https://your-api.railway.app/api/*`
2. Health check endpoint for Railway: `/api/health/simple-health`
3. CORS is configured to accept requests from Vercel frontend
4. Authentication bypass is configured in middleware.ts for all API routes