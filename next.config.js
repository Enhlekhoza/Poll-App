/** @type {import('next').NextConfig} */
const nextConfig = {
  /* other config options here */
  eslint: {
    // Ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;