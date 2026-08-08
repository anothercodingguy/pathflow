/** @type {import('next').NextConfig} */
const nextConfig = {
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
