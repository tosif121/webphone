/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
