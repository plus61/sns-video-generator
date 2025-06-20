#!/bin/bash

echo "🚀 Starting Railway build with path alias fixes..."

# Export build environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Create temporary environment file for build
echo "📝 Creating temporary env file for build..."
cat > .env.production.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy-anon-key}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-dummy-service-role-key}
OPENAI_API_KEY=${OPENAI_API_KEY:-dummy-openai-api-key}
NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-dummy-nextauth-secret}
EOF

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Check if build was successful
if [ ! -d ".next/standalone" ]; then
    echo "❌ Build failed: standalone directory not created"
    exit 1
fi

# Fix path aliases in the standalone build
echo "🔧 Fixing path aliases in standalone build..."

# Create a custom server wrapper that handles module resolution
cat > .next/standalone/server-wrapper.js << 'EOF'
const Module = require('module');
const path = require('path');
const originalResolveFilename = Module._resolveFilename;

// Override module resolution to handle @ imports
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    const modulePath = request.replace('@/', '');
    const resolved = path.join(__dirname, 'src', modulePath);
    return originalResolveFilename(resolved, parent, isMain);
  }
  return originalResolveFilename(request, parent, isMain);
};

// Start the actual server
require('./server.js');
EOF

# Create a symlink to src directory in standalone
echo "🔗 Creating src symlink in standalone directory..."
ln -sf ../../src .next/standalone/src

# Copy additional required files
echo "📦 Copying additional files..."
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# Update start script to use the wrapper
echo "📝 Updating start script..."
cat > start-railway-production.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Railway production server...');

const serverPath = path.join(__dirname, '.next/standalone/server-wrapper.js');
const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000,
    HOSTNAME: '0.0.0.0'
  }
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
EOF

chmod +x start-railway-production.js

# Clean up temporary env file
rm -f .env.production.local

echo "✅ Railway build completed successfully!"
echo "📋 Build artifacts:"
ls -la .next/standalone/