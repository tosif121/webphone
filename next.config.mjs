/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: '/mobile',
  basePath: '/mobile',
  devIndicators: false,
  output: 'export',
  distDir: 'out',

  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  trailingSlash: false,

  images: {
    unoptimized: true,
  },

  poweredByHeader: false,
};

export default nextConfig;
