/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/app',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/runs',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
