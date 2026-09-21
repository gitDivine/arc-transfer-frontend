/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'pino-pretty': false,
      lokijs: false,
      encoding: false,
      accounts: false // Fix Wagmi Tempo bug
    };
    return config;
  },
  transpilePackages: ['@base-org/account', '@coinbase/wallet-sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
