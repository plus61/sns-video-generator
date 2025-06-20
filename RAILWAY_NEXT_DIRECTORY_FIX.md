# Railway Deployment Fix: .next Directory Not Found

## Problem Summary
Railway deployment fails with ".next directory not found" error despite successful builds. The issue stems from configuration mismatches between Dockerfiles and Next.js settings.

## Root Causes
1. The main `Dockerfile` expects standalone build output but `next.config.mjs` doesn't have `output: 'standalone'`
2. Multiple Next.js config files causing confusion
3. Potential working directory or path issues in Docker container

## Solutions Implemented

### 1. Updated Dockerfile.simple (Primary Fix)
- Added `libc6-compat` for Alpine Linux compatibility
- Enhanced build verification with detailed logging
- Changed CMD to use explicit path: `node_modules/.bin/next start`
- Added comprehensive error checking

### 2. Created Dockerfile.railway-debug
- Extensive debugging output at each stage
- Startup script that verifies .next directory presence
- Environment variable logging
- Find commands to locate .next if missing

### 3. Created Dockerfile.railway-robust
- Multi-stage build for optimization
- Explicit .next directory verification at each stage
- Non-root user for security
- Fail-fast approach if .next is missing

## Deployment Steps

### Option 1: Use Updated Dockerfile.simple (Recommended)
```bash
# Railway deployment with updated Dockerfile.simple
git add Dockerfile.simple
git commit -m "Fix: Update Dockerfile.simple with .next directory handling"
git push
```

### Option 2: Use Debug Dockerfile for Troubleshooting
```toml
# Update railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile.railway-debug"
```

### Option 3: Use Robust Multi-stage Dockerfile
```toml
# Update railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile.railway-robust"
```

## Verification Steps

1. **Local Docker Test**
   ```bash
   # Test the build locally
   docker build -f Dockerfile.simple -t sns-video-test .
   docker run -p 3000:3000 sns-video-test
   ```

2. **Check Build Logs on Railway**
   - Look for "Build verification" section
   - Verify .next directory is found
   - Check for any error messages

3. **Monitor Container Startup**
   - Watch for startup logs
   - Verify PORT environment variable is set
   - Check health endpoint responds

## Alternative Fixes

### Enable Standalone Build
If you prefer to use the main Dockerfile, update `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'standalone',
  // ... rest of config
};
```

### Use Custom Start Script
Create a `start-production.js`:

```javascript
const { spawn } = require('child_process');
const path = require('path');

// Verify .next exists
const fs = require('fs');
if (!fs.existsSync('.next')) {
  console.error('ERROR: .next directory not found!');
  process.exit(1);
}

// Start Next.js
const next = spawn('node', [
  path.join(__dirname, 'node_modules/.bin/next'),
  'start'
], {
  stdio: 'inherit',
  env: { ...process.env }
});

next.on('exit', (code) => {
  process.exit(code);
});
```

## Monitoring After Deployment

1. **Health Check**: `/api/health/simple`
2. **Memory Usage**: Monitor for any memory issues
3. **Build Time**: Track if builds are taking too long
4. **Startup Time**: Ensure container starts within timeout

## Emergency Rollback

If issues persist:
1. Revert to previous working Dockerfile
2. Use `Dockerfile.minimal` temporarily (runs in dev mode)
3. Contact Railway support with debug logs

## Prevention

1. **Consistent Configuration**
   - Use only one Next.js config file
   - Document which Dockerfile is for which environment
   - Keep build process simple and predictable

2. **Testing Protocol**
   - Always test Docker builds locally before deploying
   - Use Railway preview deployments for testing
   - Maintain a staging environment

3. **Documentation**
   - Document all environment variables required
   - Keep deployment guides updated
   - Log all configuration changes

## Success Criteria

Deployment is successful when:
- Build completes without errors
- Container starts and stays running
- Health check endpoint responds with 200
- Application serves pages correctly
- No .next directory errors in logs