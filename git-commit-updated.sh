#!/bin/bash
# Updated Git Commit Script for Railway Deployment
# Date: 2025-06-25
# Includes all changes from TASK-20240625-RAILWAY-001 and Railway API repair

echo "Starting Railway deployment commit process..."

# Navigate to repository root
cd /Users/yuichiroooosuger/sns-video-generator || exit 1

# Check current status
echo "Current git status:"
git status

# Add all changes
echo -e "\nAdding all changes..."
git add -A

# Create commit with comprehensive message
echo -e "\nCreating commit..."
git commit -m "fix: Complete Railway deployment configuration

- Add output: 'standalone' to next.config.mjs
- Create nixpacks.toml for Railway build
- Update railway.toml to use Dockerfile.simple
- Fix previous '.next directory not found' issue
- Add yt-dlp to Dockerfile.simple for YouTube download support
- Configure CORS headers for Vercel frontend integration
- Create railway-api.config.js for API server settings
- Document all API endpoints in api-endpoints-normalized.md
- Prepare for Vercel + Railway separated architecture

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main branch
echo -e "\nPushing to origin main..."
git push origin main

echo -e "\n✅ Git operations completed successfully!"
echo "Please check Railway dashboard for automatic deployment progress."