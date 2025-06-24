/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-domain.com', 'localhost'], // Added localhost for local development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true
  },
  devIndicators: {
    autoPrerender: false,
  },
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: '/.well-known/appspecific/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/sign-in',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig
