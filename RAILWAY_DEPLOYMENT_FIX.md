# Railway Deployment Fix Guide

## Problem Summary
Railway deployment fails with "Module not found: Can't resolve '@/utils/supabase/client'" errors due to TypeScript path aliases not being resolved correctly in Next.js standalone builds.

## Root Cause
Next.js standalone builds don't properly handle TypeScript path aliases (`@/*`) during the build process. This is a known limitation when using `output: 'standalone'`.

## Solutions Implemented

### Solution 1: Custom Server with Module Resolution (Recommended)
**Files created/modified:**
- `server.js` - Custom Next.js server with path alias resolution
- `Dockerfile.custom-server` - Simplified Dockerfile using custom server
- `railway.json` - Updated to use custom server Dockerfile
- `package.json` - Added `start:railway` script

**How it works:**
1. The custom server intercepts module resolution requests
2. Rewrites `@/` imports to proper file paths
3. Maintains full Next.js functionality while fixing path aliases

### Solution 2: Enhanced Next.js Configuration
**Files created/modified:**
- `next.config.mjs` - Enhanced webpack config with explicit alias resolution
- `tsconfig.json` - Changed `moduleResolution` from "bundler" to "node"

**How it works:**
1. Webpack aliases are explicitly defined for production builds
2. Module resolution is set to Node.js compatible mode
3. Transpile packages that may have issues

### Solution 3: Module Resolution Wrapper (in main Dockerfile)
**Files modified:**
- `Dockerfile` - Added inline module resolution wrapper

**How it works:**
1. Creates a wrapper script that intercepts require() calls
2. Copies src directory to standalone output
3. Redirects `@/` imports to correct paths

## Deployment Steps

### Option A: Using Custom Server (Recommended)
1. Ensure `railway.json` points to `Dockerfile.custom-server`
2. Push changes to GitHub
3. Railway will automatically build using the custom server

### Option B: Using Standalone Build with Wrapper
1. Update `railway.json` to use `Dockerfile` instead
2. Push changes to GitHub
3. Railway will build with the module resolution wrapper

### Option C: Manual Override in Railway
1. Go to Railway dashboard
2. Settings > Build > Dockerfile Path
3. Set to `Dockerfile.custom-server`
4. Redeploy

## Environment Variables
Ensure these are set in Railway:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
NEXTAUTH_URL=https://your-railway-app.up.railway.app
NEXTAUTH_SECRET=your_secret
```

## Verification Steps
1. Check Railway build logs for successful completion
2. Verify no "Module not found" errors
3. Test the deployed app at your Railway URL
4. Check `/api/health` endpoint returns 200 OK

## Troubleshooting

### If build still fails:
1. Clear Railway build cache:
   - Settings > Build > Clear Build Cache
2. Check all environment variables are set
3. Verify no syntax errors in modified files

### If runtime errors occur:
1. Check Railway logs for specific error messages
2. Ensure all required files are copied in Dockerfile
3. Verify path aliases match actual file structure

## Alternative Quick Fix
If all else fails, you can temporarily replace all `@/` imports with relative imports:
```bash
# Example: Replace @/utils/supabase/client with ../../../utils/supabase/client
# This is not recommended for long-term use
```

## Long-term Solution
Consider migrating away from path aliases for production builds or waiting for Next.js to improve standalone build support for TypeScript path aliases.

## Files Changed Summary
- `/server.js` - NEW: Custom server with module resolution
- `/Dockerfile.custom-server` - NEW: Simplified Dockerfile
- `/Dockerfile` - MODIFIED: Added module resolution wrapper
- `/next.config.mjs` - NEW: Replaced next.config.ts with enhanced config
- `/tsconfig.json` - MODIFIED: Changed moduleResolution to "node"
- `/railway.json` - MODIFIED: Updated to use custom server
- `/package.json` - MODIFIED: Added start:railway script
- `/scripts/railway-build.sh` - NEW: Custom build script (optional)

## Recommended Approach
Use the **Custom Server solution** (Dockerfile.custom-server) as it:
1. Provides the most reliable path alias resolution
2. Maintains full Next.js functionality
3. Simplifies the build process
4. Works consistently across different environments