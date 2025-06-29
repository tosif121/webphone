/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    CLIENT_ID: 'TEST-M22H5VMQSVGIC_25041',
    CLIENT_SECRET: 'MzlhMWZhMzItNDBhMS00OTYzLWI1OWMtMjFmOTlhNzFlMGFl',
    CLIENT_VERSION: '1',
  },
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
