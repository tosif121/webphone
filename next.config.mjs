/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  output: 'export',
  distDir: 'out',
  basePath: '/webphone/mobile',
  assetPrefix: '/webphone/mobile',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
};

export default nextConfig;
