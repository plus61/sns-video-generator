# Railway Production Dockerfile - Fixed Version
FROM node:18-slim AS base

# Install system dependencies with specific versions for stability
RUN apt-get update && apt-get install -y \
    ffmpeg=7:4.4.* \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Dependencies stage - optimized for Railway
FROM base AS deps
COPY package.json package-lock.json* ./
# Use exact npm version and clean install
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# Build stage - completely rewritten for Railway compatibility
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Set Railway-specific build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV CI=true
ENV SKIP_ENV_VALIDATION=true

# Railway compatibility flags
ENV DISABLE_CANVAS=false
ENV DISABLE_BULLMQ=false
ENV USE_MOCK_DOWNLOADER=false

# Dummy environment variables for build (Railway will override at runtime)
ENV NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
ENV SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key
ENV OPENAI_API_KEY=dummy-openai-api-key
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=dummy-nextauth-secret

# Cache busting and build
RUN echo "Cache bust: $(date)" > /tmp/cachebust.txt && \
    npm run build

# Verify build output - CRITICAL FOR RAILWAY
RUN echo "🔍 Build verification:" && \
    ls -la .next/ && \
    echo "🔍 Standalone directory:" && \
    ls -la .next/standalone/ && \
    echo "🔍 Server file check:" && \
    ls -la .next/standalone/server.js || echo "❌ server.js missing"

# Production runtime stage
FROM node:18-slim AS runner
WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg=7:4.4.* \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application - CORRECTED STRUCTURE
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy additional required files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/start-railway.js ./

# Verify server.js exists after copy
RUN echo "🔍 Final verification:" && \
    ls -la ./ && \
    echo "🔍 Server file:" && \
    ls -la ./server.js || echo "❌ server.js missing in final image"

# Create necessary directories
RUN mkdir -p /tmp/video-uploads /tmp/video-analysis && \
    chown -R nextjs:nodejs /tmp/video-uploads /tmp/video-analysis && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Railway environment setup
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=${PORT:-3000}

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Expose port
EXPOSE $PORT

# Start with fixed Railway script
CMD ["node", "start-railway.js"]