# 緊急: Dockerfile.simple修正指示

From: Boss1
To: Worker1
Date: 2025-06-25 17:30
Priority: 🔴 CRITICAL NOW

## 修正内容

Dockerfile.simpleを以下の内容に**完全に置き換えて**ください。

```dockerfile
# Simple Single-Stage Dockerfile for Railway
FROM node:18-slim

# Install essential dependencies INCLUDING yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && pip3 install yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create build-time env file
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co" > .env.production && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key" >> .env.production && \
    echo "SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key" >> .env.production && \
    echo "OPENAI_API_KEY=dummy-openai-api-key" >> .env.production

# Build the application
RUN npm run build

# Prepare standalone deployment
RUN cp -R .next/standalone/* ./ && \
    cp -R .next/static ./.next/ && \
    cp -R public ./public || true

# Create necessary directories
RUN mkdir -p /tmp/video-uploads /tmp/video-analysis

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/simple-health || exit 1

# Use standalone server
CMD ["node", "server.js"]
```

## 重要な変更点

1. **yt-dlp追加**: `pip3 install yt-dlp`
2. **Standaloneモード**: `node server.js`に変更
3. **ファイルコピー**: standalone出力を正しくコピー

## 実行手順

```bash
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace

# 1. Dockerfile.simple編集
# 上記内容で完全に置き換え

# 2. コミット&プッシュ
git add Dockerfile.simple
git commit -m "fix: Add yt-dlp and use standalone mode for Railway"
git push

# 3. Railway再デプロイ
# 自動でトリガーされるはず
```

## 期限

**10分以内**に完了してください。

これで/simpleページ404とyt-dlp問題が同時に解決します！

Boss1