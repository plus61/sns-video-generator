#!/bin/bash
# Production start script for Railway deployment

echo "🚀 Starting production server..."
echo "📂 Current directory: $(pwd)"
echo "📋 Directory contents:"
ls -la

# Check if we're in the right directory
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Found standalone server at .next/standalone/server.js"
    cd .next/standalone
    echo "📂 Changed to standalone directory"
    ls -la
    echo "🔧 Starting server with PORT=${PORT:-3000}"
    node server.js
elif [ -f "server.js" ]; then
    echo "✅ Found server.js in current directory"
    echo "🔧 Starting server with PORT=${PORT:-3000}"
    node server.js
elif [ -f ".next/server/app/index.js" ]; then
    echo "⚠️ No standalone build found, using regular Next.js start"
    npm start
else
    echo "❌ ERROR: No server files found!"
    echo "📂 Searching for .next directory:"
    find . -name ".next" -type d
    echo "📂 Searching for server.js:"
    find . -name "server.js" -type f
    exit 1
fi