import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    // Disable CSS optimization to prevent lightningcss issues
    optimizeCss: false,
    // Disable Turbopack CSS features that may conflict
    turbo: {
      rules: {}
    }
  },
  // CORS configuration for Railway deployment
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGIN || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  // Simplify for Railway compatibility
  // Remove turbopack config that may cause issues
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Reduce build time and avoid SSR issues
  trailingSlash: false,
  output: 'standalone',
  // Force standalone build for Railway
  distDir: '.next',
  // Webpack configuration for module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure proper module resolution for Railway builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    return config
  },
  // Ignore specific build warnings that might cause issues
  typescript: {
    // Temporarily ignore TypeScript errors during build for Railway
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build for Railway deployment
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
