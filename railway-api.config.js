// Railway API Server Configuration
// This file configures the Next.js app to run as an API-only server on Railway

module.exports = {
  // API Routes Configuration
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase limit for video uploads
    },
    responseLimit: false,
  },

  // CORS Configuration for Vercel Frontend
  async headers() {
    return [
      {
        // Apply CORS to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL || 'https://sns-video-generator.vercel.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Environment Variables
  env: {
    IS_API_SERVER: 'true',
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://sns-video-generator.vercel.app',
  },

  // Disable image optimization (not needed for API server)
  images: {
    unoptimized: true,
  },

  // Disable static file serving (API only)
  output: 'standalone',
  
  // Railway-specific optimizations
  compress: true,
  poweredByHeader: false,
  
  // Webpack configuration for API server
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize heavy dependencies not needed for API
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
};