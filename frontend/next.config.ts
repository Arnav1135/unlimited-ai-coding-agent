import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: 'http://localhost:8080/ws', // Proxy to Backend WebSocket
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*', // Proxy to Backend API
      },
    ];
  },
};

export default nextConfig;
