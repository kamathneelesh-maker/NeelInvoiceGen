/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    config.resolve.alias.fontkit = false;
    return config;
  },
};

module.exports = nextConfig;
