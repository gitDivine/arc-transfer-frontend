/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push(
      '@base-org/account',
      '@coinbase/wallet-sdk',
      '@metamask/connect-evm',
      '@safe-global/safe-apps-sdk',
      '@safe-global/safe-apps-provider',
      '@x402/evm',
      '@x402/core',
      '@x402/svm',
      'pino-pretty',
      'lokijs',
      'encoding'
    );
    return config;
  },
};

export default nextConfig;
