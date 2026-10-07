import type { NextConfig } from 'next';
import { STATIC_SECURITY_HEADERS } from './src/lib/security/csp';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/niveles', destination: '/camino', permanent: true }];
  },
  async headers() {
    return [{ source: '/:path*', headers: STATIC_SECURITY_HEADERS }];
  },
};

export default nextConfig;
