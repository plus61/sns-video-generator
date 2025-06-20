#!/bin/bash

# Railway Build Debug Script
# This script helps diagnose Railway build failures

echo "=== Railway Build Debug Script ==="
echo "Running from: $(pwd)"
echo ""

# Check Node version
echo "1. Node.js Version:"
node --version
npm --version
echo ""

# Check if package.json exists
echo "2. Checking package.json:"
if [ -f "package.json" ]; then
    echo "✓ package.json found"
    echo "Build script: $(grep '"build"' package.json)"
else
    echo "✗ package.json NOT FOUND!"
fi
echo ""

# Check node_modules
echo "3. Checking node_modules:"
if [ -d "node_modules" ]; then
    echo "✓ node_modules exists"
    echo "Total packages: $(ls node_modules | wc -l)"
else
    echo "✗ node_modules NOT FOUND - Running npm install..."
    npm ci
fi
echo ""

# Check for .next directory before build
echo "4. Pre-build .next check:"
if [ -d ".next" ]; then
    echo "⚠ .next directory already exists (from previous build?)"
    rm -rf .next
    echo "Cleaned existing .next directory"
else
    echo "✓ No existing .next directory"
fi
echo ""

# Check environment variables
echo "5. Environment Variables:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "NEXT_TELEMETRY_DISABLED: ${NEXT_TELEMETRY_DISABLED:-not set}"
echo "PORT: ${PORT:-not set}"
echo ""

# Try to build
echo "6. Attempting build..."
echo "Running: npm run build"
npm run build

# Check build result
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build SUCCESSFUL!"
    echo ""
    echo "7. Post-build verification:"
    
    if [ -d ".next" ]; then
        echo "✓ .next directory created"
        echo "Contents:"
        ls -la .next/
        
        if [ -f ".next/BUILD_ID" ]; then
            echo ""
            echo "Build ID: $(cat .next/BUILD_ID)"
        fi
        
        # Check standalone directory if using standalone mode
        if [ -d ".next/standalone" ]; then
            echo ""
            echo "✓ Standalone build detected"
            echo "Standalone contents:"
            ls -la .next/standalone/ | head -10
        fi
    else
        echo "✗ .next directory NOT FOUND after build!"
    fi
else
    echo ""
    echo "✗ Build FAILED!"
    echo ""
    echo "7. Debugging build failure:"
    
    # Check for common issues
    echo "Checking for missing dependencies..."
    npm ls 2>&1 | grep "UNMET" | head -10
    
    echo ""
    echo "Checking TypeScript errors..."
    npx tsc --noEmit 2>&1 | head -20
    
    echo ""
    echo "Last 50 lines of npm debug log (if exists):"
    if [ -f "npm-debug.log" ]; then
        tail -50 npm-debug.log
    fi
fi

echo ""
echo "=== Debug complete ==="