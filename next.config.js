/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable strict mode
  reactStrictMode: false,
  // Use standalone output for deployment
  output: 'standalone',
  // Disable server actions
  experimental: {
    serverActions: false
  }
};

module.exports = nextConfig;