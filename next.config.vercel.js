/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DISABLE_CANVAS: 'true',
    DISABLE_BULLMQ: 'true',
    DISABLE_FFMPEG_NATIVE: 'true',
    NEXT_PUBLIC_IS_VERCEL: 'true'
  },
  // Reduce build time and avoid SSR issues
  trailingSlash: false,
  output: 'standalone',
  // Ignore specific build warnings that might cause issues
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors in Vercel builds
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip linting in Vercel builds
  },
  // Vercel-specific optimizations
  webpack: (config, { isServer }) => {
    // Exclude problematic packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        worker_threads: false,
        canvas: false,
        'utf-8-validate': false,
        'bufferutil': false
      }
    }

    // Exclude native dependencies completely from client bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      'youtube-dl-exec': false,
      'bullmq': false,
      'ioredis': false,
      'canvas': false,
      'fabric': false
    }

    // Also exclude from externals
    config.externals = config.externals || []
    config.externals.push({
      canvas: 'canvas',
      'node-canvas': 'node-canvas',
      fabric: 'fabric',
      bullmq: 'bullmq',
      ioredis: 'ioredis',
      'youtube-dl-exec': 'youtube-dl-exec'
    })

    return config
  }
};

module.exports = nextConfig;