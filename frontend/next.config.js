const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  async rewrites() {
    // In local development, proxy API requests to local Express backend server (port 5000)
    // In production on Vercel, requests to /api/* are handled by Vercel serverless function
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
