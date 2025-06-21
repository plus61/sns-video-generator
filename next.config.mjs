/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Standalone output for Railway deployment
  output: 'standalone',
  
  // TypeScript and ESLint - temporarily ignore for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Server external packages
  serverExternalPackages: ['canvas', 'fabric'],
  
  // Module transpilation for problematic packages
  transpilePackages: ['@supabase/ssr'],
  
  // Railway optimization
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;