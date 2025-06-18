# Production Dockerfile for SNS Video Generator
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

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
RUN cp next.config.railway.js next.config.js && npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype \
    curl \
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