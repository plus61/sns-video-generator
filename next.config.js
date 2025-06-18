/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    USE_MOCK_DOWNLOADER: 'true'
  },
  // Railway-specific optimizations
  trailingSlash: false,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors in Railway builds
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip linting in Railway builds
  },
  webpack: (config, { isServer }) => {
    // Allow native dependencies in Railway environment
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'youtube-dl-exec': 'youtube-dl-exec'
      })
    } else {
      // Exclude problematic packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        worker_threads: false,
        'utf-8-validate': false,
        'bufferutil': false,
        'lightningcss': false,
        'lightningcss-linux-x64-gnu': false,
        'lightningcss-linux-x64-musl': false
      }
    }
    
    // Add externals for lightningcss
    if (isServer) {
      config.externals.push('lightningcss')
      config.externals.push('lightningcss-linux-x64-gnu')
      config.externals.push('lightningcss-linux-x64-musl')
    }

    return config
  }
};

module.exports = nextConfig;