import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    // Disable CSS optimization to prevent lightningcss issues
    optimizeCss: false
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Reduce build time and avoid SSR issues
  trailingSlash: false,
  output: 'standalone',
  // Ignore specific build warnings that might cause issues
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build for Railway deployment
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
