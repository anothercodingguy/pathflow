/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/feed',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
