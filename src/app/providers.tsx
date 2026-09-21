'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, bsc, arbitrum, optimism, polygon, mainnet } from 'wagmi/chains';

const arcMainnet = {
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
  },
} as const;

const config = createConfig({
  chains: [arcMainnet, base, bsc, arbitrum, optimism, polygon, mainnet],
  transports: {
    [arcMainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [mainnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // The user should set this in .env.local
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: false });

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors
          }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
