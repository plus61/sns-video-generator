# Railway Production Dockerfile - Path Alias Fix
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
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev --no-audit --no-fund

# Build stage
FROM base AS builder
COPY package*.json ./
# Install ALL dependencies including devDependencies for build
RUN npm install --legacy-peer-deps --no-audit --no-fund --include=dev

# Copy source code
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true
ENV DISABLE_BULLMQ=true

# Create build-time env file with dummy values
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co" > .env.production && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key" >> .env.production && \
    echo "SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key" >> .env.production && \
    echo "OPENAI_API_KEY=dummy-openai-api-key" >> .env.production && \
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.production && \
    echo "NEXTAUTH_SECRET=dummy-nextauth-secret" >> .env.production

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Install production runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Create src directory structure for path aliases
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Create module resolution wrapper
RUN echo '#!/usr/bin/env node\n\
const Module = require("module");\n\
const path = require("path");\n\
const originalResolveFilename = Module._resolveFilename;\n\
\n\
Module._resolveFilename = function (request, parent, isMain) {\n\
  if (request.startsWith("@/")) {\n\
    const modulePath = request.replace("@/", "");\n\
    const resolved = path.join(__dirname, "src", modulePath);\n\
    try {\n\
      return originalResolveFilename(resolved, parent, isMain);\n\
    } catch (e) {\n\
      // Fallback to original if resolution fails\n\
      return originalResolveFilename(request, parent, isMain);\n\
    }\n\
  }\n\
  return originalResolveFilename(request, parent, isMain);\n\
};\n\
\n\
require("./server.js");' > server-wrapper.js && \
    chown nextjs:nodejs server-wrapper.js && \
    chmod +x server-wrapper.js

# Create necessary directories
RUN mkdir -p /tmp/video-uploads /tmp/video-analysis && \
    chown -R nextjs:nodejs /tmp/video-uploads /tmp/video-analysis

# Switch to non-root user
USER nextjs

# Environment
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the server with the wrapper
CMD ["node", "server-wrapper.js"]