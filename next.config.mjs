/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  output: 'export',
  distDir: 'out',
  basePath: '/webphone/v1',
  assetPrefix: '/webphone/v1',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
};

export default nextConfig;
