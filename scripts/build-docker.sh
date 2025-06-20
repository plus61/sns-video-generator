#!/bin/bash

# Docker build script for Railway deployment with proper cache handling

echo "🚀 Starting Docker build for Railway deployment..."

# Clean up any previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Ensure package-lock.json is up to date
echo "📦 Syncing package-lock.json..."
npm install --package-lock-only

# Build the Docker image with proper cache busting
echo "🔨 Building Docker image..."
docker build \
  --no-cache \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --tag sns-video-generator:latest \
  --file Dockerfile \
  .

# Test the build
echo "✅ Build completed successfully!"
echo "🧪 To test locally, run: docker run -p 3000:3000 sns-video-generator:latest"