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
    usdcAddress: '0x3600000000000000000000000000000000000000', // 6 decimals native USDC
    cctpTokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
    isArc: true,
  }
};

export const HUB_CHAINS = [
  {
    name: 'Base',
    chainId: 8453,
    domain: 6,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  },
  {
    name: 'Arbitrum',
    chainId: 42161,
    domain: 3,
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  },
  {
    name: 'Optimism',
    chainId: 10,
    domain: 2,
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as `0x${string}`,
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  },
  {
    name: 'Polygon',
    chainId: 137,
    domain: 7,
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`,
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  },
  {
    name: 'Avalanche',
    chainId: 43114,
    domain: 1,
    usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as `0x${string}`,
    cctpMessageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  }
];
