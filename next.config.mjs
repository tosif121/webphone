/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/mobile',
  reactStrictMode: false,
  devIndicators: false,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
