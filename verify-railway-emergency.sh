#!/bin/bash

# Railway Emergency Build Verification Script
# This script validates all Railway deployment requirements

echo "🚨 RAILWAY EMERGENCY BUILD VERIFICATION"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error counter
ERRORS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 missing${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1 directory exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 directory missing${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "🔍 CRITICAL FILE VERIFICATION"
echo "-----------------------------"

# Check essential files
check_file "package.json"
check_file "next.config.ts"
check_file "Dockerfile" 
check_file "start-railway.js"

echo ""
echo "🔍 DOCKERFILE VALIDATION"
echo "-----------------------"

if [ -f "Dockerfile" ]; then
    # Check for standalone output
    if grep -q "output.*standalone" Dockerfile; then
        echo -e "${GREEN}✅ Standalone output configured${NC}"
    else
        echo -e "${RED}❌ Standalone output missing in Dockerfile${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for proper COPY commands
    if grep -q "COPY --from=builder /app/.next/standalone" Dockerfile; then
        echo -e "${GREEN}✅ Standalone copy command found${NC}"
    else
        echo -e "${RED}❌ Standalone copy command missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for Railway start command
    if grep -q "start-railway.js" Dockerfile; then
        echo -e "${GREEN}✅ Railway start script configured${NC}"
    else
        echo -e "${RED}❌ Railway start script not configured${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🔍 NEXT.JS CONFIGURATION"
echo "-----------------------"

if [ -f "next.config.ts" ]; then
    # Check for standalone output
    if grep -q "output.*standalone" next.config.ts; then
        echo -e "${GREEN}✅ Next.js standalone output configured${NC}"
    else
        echo -e "${RED}❌ Next.js standalone output missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🔍 PACKAGE.JSON VALIDATION"
echo "-------------------------"

if [ -f "package.json" ]; then
    # Check for required scripts
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✅ Build script exists${NC}"
    else
        echo -e "${RED}❌ Build script missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"start"' package.json; then
        echo -e "${GREEN}✅ Start script exists${NC}"
    else
        echo -e "${RED}❌ Start script missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🔧 EMERGENCY BUILD TEST"
echo "---------------------"

echo "🔄 Testing critical build components..."

# Test Next.js build locally
echo "📦 Testing Next.js build..."
if npm run build 2>&1 | tail -10; then
    echo -e "${GREEN}✅ Next.js build succeeded${NC}"
    
    # Check if standalone output was generated
    if [ -d ".next/standalone" ]; then
        echo -e "${GREEN}✅ Standalone output directory created${NC}"
        
        if [ -f ".next/standalone/server.js" ]; then
            echo -e "${GREEN}✅ server.js generated in standalone${NC}"
        else
            echo -e "${RED}❌ server.js missing in standalone${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}❌ Standalone output directory missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Next.js build failed${NC}"
    ERRORS=$((ERRORS + 1))
    echo "🔍 Build error details:"
    npm run build 2>&1 | tail -20
fi

echo ""
echo "📋 EMERGENCY VERIFICATION SUMMARY"
echo "================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 EMERGENCY VERIFICATION PASSED!${NC}"
    echo -e "${GREEN}✅ Railway deployment should work now${NC}"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Commit these fixes: git add . && git commit -m 'Emergency Railway fix'"
    echo "2. Push to Railway: git push"
    echo "3. Monitor Railway deployment logs"
    exit 0
else
    echo -e "${RED}🚨 $ERRORS CRITICAL ERROR(S) FOUND!${NC}"
    echo ""
    echo "🔧 EMERGENCY FIXES NEEDED:"
    echo "1. Fix Next.js standalone build"
    echo "2. Verify Dockerfile configuration" 
    echo "3. Check start-railway.js script"
    echo "4. Re-run this script until all checks pass"
    exit 1
fi