export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  usdcAddress: `0x${string}`;
  cctpTokenMessenger: `0x${string}`;
  cctpMessageTransmitter: `0x${string}`;
  isArc?: boolean;
}

export const networks: Record<string, NetworkConfig> = {
  // Arc Mainnet
  arcMainnet: {
    name: 'Arc Mainnet',
    chainId: 5042,
    rpcUrl: process.env.ARC_MAINNET_RPC || 'https://rpc.mainnet.arc.io',
    usdcAddress: '0x3600000000000000000000000000000000000000', // 18 decimals native USDC
    cctpTokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
    isArc: true,
  },
  
  // Base Mainnet (Intermediate Chain)
  baseMainnet: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    cctpTokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  }
};
