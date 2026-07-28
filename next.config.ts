import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pica.zhimg.com',
      },
      {
        protocol: 'https',
        hostname: 'static.zhihu.com',
      },
      {
        protocol: 'https',
        hostname: '**.byteacctimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.byteimg.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.v2ex.com',
      },
      {
        protocol: 'https',
        hostname: 'www.v2ex.com',
      },
    ],
  },
}

export default nextConfig
