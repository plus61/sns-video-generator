#!/bin/bash

# Vercel build script with environment detection

echo "🚀 Starting Vercel-optimized build..."

# Detect if we're building on Vercel
if [ "$VERCEL" = "1" ]; then
  echo "📦 Detected Vercel environment"
  
  # Use Vercel-specific configurations
  if [ -f "next.config.vercel.js" ]; then
    echo "✅ Using Vercel-specific Next.js config"
    cp next.config.vercel.js next.config.js
    rm -f next.config.ts
  fi
  
  if [ -f "package.vercel.json" ]; then
    echo "✅ Using Vercel-specific package.json"
    cp package.vercel.json package.json
  fi
  
  if [ -f ".env.vercel" ]; then
    echo "✅ Using Vercel-specific environment variables"
    cp .env.vercel .env.production
  fi
  
  # Set environment flags for conditional imports
  export DISABLE_CANVAS=true
  export DISABLE_BULLMQ=true
  export DISABLE_FFMPEG_NATIVE=true
  export NEXT_PUBLIC_IS_VERCEL=true
  
  echo "🔧 Environment flags set for Vercel build"
fi

# Run the build
echo "🏗️ Running Next.js build..."
npm run build

echo "✅ Build completed successfully!"