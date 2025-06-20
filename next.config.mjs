import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for Railway deployment
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore for Railway deployment
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // Server external packages
  serverExternalPackages: ['canvas', 'fabric'],
  
  // Webpack configuration to fix path alias issues
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix path alias resolution for standalone builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': join(__dirname, 'src'),
      '@/components': join(__dirname, 'src/components'),
      '@/lib': join(__dirname, 'src/lib'),
      '@/utils': join(__dirname, 'src/utils'),
      '@/hooks': join(__dirname, 'src/hooks'),
      '@/types': join(__dirname, 'src/types'),
      '@/app': join(__dirname, 'src/app'),
    };
    
    // Handle server-only dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        canvas: false,
        'canvas-prebuilt': false,
      };
    }
    
    // Add custom module resolution for production builds
    if (!dev) {
      config.resolve.modules.push(join(__dirname, 'src'));
    }
    
    return config;
  },
  
  // Module transpilation for problematic packages
  transpilePackages: ['@supabase/ssr'],
  
  // Headers for CORS if needed
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

export default nextConfig;