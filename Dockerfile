# Production Dockerfile for SNS Video Generator
FROM node:18-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libpangomm-1.4-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
# Set build-time environment variables for Railway compatibility
ENV NEXT_TELEMETRY_DISABLED=1
ENV USE_MOCK_DOWNLOADER=true
ENV NODE_ENV=production
ENV DISABLE_CANVAS=true
ENV DISABLE_BULLMQ=false
# Use Railway-specific config for build
RUN if [ -f next.config.railway.js ]; then cp next.config.railway.js next.config.js; fi && npm run build

# Production stage
FROM node:18-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libpangocairo-1.0-0 \
    libfreetype6 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules

# Copy necessary config files for runtime
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Create temp directories for video processing
RUN mkdir -p /tmp/video-uploads /tmp/video-analysis && \
    chown -R nextjs:nodejs /tmp/video-uploads /tmp/video-analysis

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["node", "server.js"]