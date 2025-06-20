import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway compatibility settings
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    // Disable CSS optimization for Railway compatibility
    optimizeCss: false,
    // Disable ISR for Railway
    isrMemoryCacheSize: 0
  },
  
  // Critical: Force standalone output for Railway
  output: 'standalone',
  distDir: '.next',
  
  // Essential for Railway deployment
  trailingSlash: false,
  poweredByHeader: false,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // TypeScript and ESLint - strict mode for Railway
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Railway-specific webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Railway environment detection
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.CI;
    
    if (isRailway) {
      console.log('🚄 Railway environment detected - applying optimizations');
      
      // Optimize for Railway build
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        minimize: true
      };
      
      // Handle Canvas dependency for Railway
      config.externals = config.externals || [];
      if (isServer) {
        config.externals.push({
          canvas: 'canvas',
          'utf-8-validate': 'utf-8-validate',
          'bufferutil': 'bufferutil'
        });
      }
    }
    
    return config;
  },
  
  // Image optimization settings for Railway
  images: {
    unoptimized: true, // Railway compatibility
    domains: [],
    dangerouslyAllowSVG: true
  },
  
  // Static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Compression and performance
  compress: true,
  generateEtags: true,
  
  // Headers for Railway
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ];
  },
  
  // Redirects for Railway health checks
  redirects: async () => {
    return [];
  },
  
  // Rewrites for Railway API routing
  rewrites: async () => {
    return [];
  }
};

export default nextConfig;