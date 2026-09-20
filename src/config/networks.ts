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
  // Arc Public Testnet
  // Verified details for the permissionless testnet
  arcTestnet: {
    name: 'Arc Testnet',
    chainId: 5042002,
    rpcUrl: process.env.ARC_TESTNET_RPC || 'https://rpc.testnet.arc.network',
    usdcAddress: '0x3600000000000000000000000000000000000000', // 18 decimals!
    cctpTokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    cctpMessageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
    isArc: true,
  },
  
  // Base Sepolia (Intermediate Chain for Testnet)
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    // Verified Circle addresses for Base Sepolia
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    cctpTokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    cctpMessageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF29A086AA20',
  }
};
