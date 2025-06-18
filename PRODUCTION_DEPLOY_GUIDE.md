# 🚀 SNS Video Generator - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. ✅ Prerequisites
- [ ] Railway account with Pro subscription
- [ ] Stripe account with live API keys
- [ ] OpenAI API account with GPT-4V access
- [ ] Supabase project configured
- [ ] Domain name (optional)

### 2. ✅ Environment Configuration
- [ ] All environment variables configured
- [ ] Secrets properly secured
- [ ] Database migrations executed
- [ ] Storage buckets created

## 🛠️ Railway Deployment Steps

### Step 1: Project Setup
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project (from project root)
railway init

# 4. Link to existing project (if needed)
railway link [project-id]
```

### Step 2: Environment Variables Configuration
```bash
# Copy environment variables from template
cp .env.production.template .env.production

# Set production environment variables in Railway dashboard
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_APP_URL=https://your-domain.railway.app
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set WEBHOOK_SECRET=$(openssl rand -base64 32)

# Supabase configuration
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://mpviqmngxjcvvakylseg.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI configuration
railway variables set OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE

# OAuth providers (configure these with actual values)
railway variables set GOOGLE_CLIENT_ID=your_google_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
railway variables set GITHUB_ID=your_github_client_id
railway variables set GITHUB_SECRET=your_github_client_secret

# Stripe configuration (IMPORTANT: Use live keys for production)
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
railway variables set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
railway variables set STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET
```

### Step 3: Add Redis Service
```bash
# Add Redis addon in Railway dashboard
# Or via CLI:
railway add redis

# Redis will be automatically configured with REDIS_URL environment variable
```

### Step 4: Deploy Application
```bash
# Deploy to Railway
railway up

# Or with custom Dockerfile
railway up --dockerfile

# Monitor deployment
railway logs
```

## 🗄️ Database Setup

### Step 1: Supabase SQL Execution
Execute the following SQL files in Supabase SQL Editor:

1. **Create Storage Bucket**:
```sql
-- Execute: create-storage-bucket.sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage
-- (Full SQL in create-storage-bucket.sql)
```

2. **Create Missing Tables**:
```sql
-- Execute: create-missing-tables.sql
-- Creates video_segments and user_usage tables
-- (Full SQL in create-missing-tables.sql)
```

3. **Profile Auto-creation Trigger**:
```sql
-- Execute: supabase-fixed-trigger.sql
-- Sets up profile auto-creation and RLS policies
-- (Full SQL in supabase-fixed-trigger.sql)
```

### Step 2: Database Schema Updates
```sql
-- Add billing-related columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

-- Create processing_jobs table
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_uploads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processing_results table
CREATE TABLE IF NOT EXISTS public.processing_results (
  id TEXT PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_uploads(id) ON DELETE CASCADE,
  metadata JSONB,
  thumbnails JSONB,
  chunks JSONB,
  ai_analysis JSONB,
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own processing jobs" ON public.processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own processing results" ON public.processing_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.processing_jobs
      WHERE processing_jobs.id = processing_results.job_id
      AND processing_jobs.user_id = auth.uid()
    )
  );
```

## 💳 Stripe Configuration

### Step 1: Create Products and Prices
```bash
# Login to Stripe Dashboard and create:

# 1. Creator Plan (Monthly)
# Product: "Creator Plan"
# Price: $29.00 USD / month
# Price ID: price_creator_monthly

# 2. Creator Plan (Annual)
# Product: "Creator Plan"  
# Price: $278.40 USD / year (20% discount)
# Price ID: price_creator_annual

# 3. Agency Plan (Monthly)
# Product: "Agency Plan"
# Price: $99.00 USD / month
# Price ID: price_agency_monthly

# 4. Agency Plan (Annual)
# Product: "Agency Plan"
# Price: $950.40 USD / year (20% discount)
# Price ID: price_agency_annual
```

### Step 2: Update Price IDs
Update the following file with actual Stripe Price IDs:
```typescript
// src/lib/stripe-config.ts
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'creator',
    stripePriceId: 'price_1ABC123...', // Replace with actual Price ID
    // ... other config
  }
  // ... update all plans
]
```

### Step 3: Webhook Configuration
```bash
# 1. In Stripe Dashboard, create webhook endpoint:
# URL: https://your-domain.railway.app/api/billing/webhook
# Events: 
#   - customer.subscription.created
#   - customer.subscription.updated  
#   - customer.subscription.deleted
#   - invoice.payment_succeeded
#   - invoice.payment_failed

# 2. Copy webhook signing secret to Railway environment:
railway variables set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## 🔐 Security Configuration

### Step 1: Domain and CORS
```bash
# Set allowed origins
railway variables set ALLOWED_ORIGINS=https://your-domain.com,https://your-domain.railway.app

# Configure custom domain (if using)
# 1. Add CNAME record: your-domain.com -> your-app.railway.app
# 2. In Railway dashboard, add custom domain
# 3. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL
```

### Step 2: Rate Limiting
```bash
# Configure rate limiting
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_WINDOW_MS=900000
```

### Step 3: Monitoring
```bash
# Optional: Add monitoring services
railway variables set SENTRY_DSN=https://your-sentry-dsn-here
```

## 📊 Performance Optimization

### Step 1: Railway Configuration
```json
// railway.json
{
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30
  }
}
```

### Step 2: Queue Configuration
```bash
# Configure queue processing
railway variables set QUEUE_CONCURRENCY=3
railway variables set MAX_PROCESSING_TIME_MS=600000
```

### Step 3: Resource Limits
```bash
# Video processing limits
railway variables set MAX_VIDEO_SIZE_MB=2048
railway variables set TEMP_DIR=/tmp/video-uploads
```

## 🧪 Testing Production Deployment

### Step 1: Health Check
```bash
# Test health endpoint
curl https://your-domain.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-06-17T...",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "openai": "healthy"
  }
}
```

### Step 2: Authentication Test
```bash
# Test OAuth login flows:
# 1. Google OAuth
# 2. GitHub OAuth
# 3. Email login (if configured)
```

### Step 3: Payment Flow Test
```bash
# Test Stripe integration:
# 1. Create checkout session
# 2. Complete test payment
# 3. Verify webhook delivery
# 4. Check subscription activation
```

### Step 4: Video Processing Test
```bash
# Test core functionality:
# 1. Upload test video
# 2. Verify AI analysis
# 3. Check segment extraction
# 4. Test export functionality
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
```bash
# Check build logs
railway logs --build

# Common fixes:
# - Verify all dependencies in package.json
# - Check TypeScript errors
# - Ensure environment variables are set
```

2. **Runtime Errors**:
```bash
# Check runtime logs
railway logs

# Common fixes:
# - Verify database connection
# - Check Redis connection  
# - Validate API keys
```

3. **Memory Issues**:
```bash
# Monitor memory usage
railway metrics

# Solutions:
# - Reduce QUEUE_CONCURRENCY
# - Optimize video processing
# - Consider upgrading Railway plan
```

## 📈 Post-Deployment Monitoring

### Step 1: Set Up Monitoring
```bash
# Railway metrics dashboard
railway metrics

# Application logs
railway logs --follow

# Error tracking (if Sentry configured)
# Check Sentry dashboard for errors
```

### Step 2: Performance Monitoring
```bash
# Key metrics to monitor:
# - Response times
# - Memory usage  
# - Queue processing times
# - Database performance
# - Error rates
```

### Step 3: Business Metrics
```bash
# Track via application:
# - User registrations
# - Video uploads
# - AI analysis completions
# - Subscription conversions
# - Revenue metrics
```

## 🔄 Deployment Pipeline

### Automated Deployment
```bash
# Set up automatic deployments
# 1. Connect GitHub repository to Railway
# 2. Enable automatic deployments on main branch
# 3. Configure deployment notifications
```

### Manual Deployment
```bash
# For manual deployments:
railway up --detach

# Check deployment status
railway status

# Rollback if needed
railway rollback
```

---

## ✅ Production Readiness Checklist

- [ ] All environment variables configured
- [ ] Database migrations executed
- [ ] Stripe products and webhooks configured
- [ ] Domain and SSL configured
- [ ] Monitoring and logging set up
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] Performance optimized
- [ ] Error tracking enabled
- [ ] Backup strategy implemented

**🎯 Production deployment complete! Your SNS Video Generator is ready to change the world! 🌟**