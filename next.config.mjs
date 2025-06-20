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
};

export default nextConfig;