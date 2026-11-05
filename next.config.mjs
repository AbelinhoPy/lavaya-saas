/** @type {import('next').NextConfig} */
const config = {
  poweredByHeader: false,
  async rewrites() { return [ { source: '/sitemap.xml', destination: '/api/seo/sitemap' }, { source: '/robots.txt', destination: '/api/seo/robots' } ]; },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  }
};
export default config;
