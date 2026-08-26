/** @type {import('next').NextConfig} */

// Crash immediately if any required env var is missing
const { validateEnv } = require('./lib/env-check')
if (process.env.NODE_ENV !== 'test') validateEnv()

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'] }
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
    // Prevent SSRF via image proxy
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' }
    ]
  },
  // Disable X-Powered-By header (don't leak tech stack)
  poweredByHeader: false,
  // Prevent client bundles from containing server-only code
  serverExternalPackages: ['googleapis', 'stripe', 'anthropic']
}

module.exports = nextConfig
