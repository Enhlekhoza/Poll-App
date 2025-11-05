/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    serverActions: false,
    // Enable concurrent features
    workerThreads: true,
    // Enable modern JS features
    modern: true,
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Improve chunk splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor modules
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common modules
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  // Improve chunk loading
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;