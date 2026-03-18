"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState } from "react";
import type { Chain } from "viem";

// Polyfill crypto.randomUUID for Talisman/SES sandbox environments
if (typeof globalThis !== "undefined" && typeof globalThis.crypto !== "undefined" && !globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = function() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
      (c ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  };
}

// Polkadot Hub TestNet
const polkadotHubTestnet: Chain = {
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: {
    decimals: 18,
    name: "Paseo",
    symbol: "PAS",
  },
  rpcUrls: {
    default: {
      http: ["https://eth-rpc-testnet.polkadot.io/"],
    },
  },
  blockExplorers: {
    default: { 
      name: "Blockscout", 
      url: "https://blockscout-testnet.polkadot.io/" 
    },
  },
  testnet: true,
};

// Polkadot Hub Mainnet
const polkadotHub: Chain = {
  id: 420420419,
  name: "Polkadot Hub",
  nativeCurrency: {
    decimals: 18,
    name: "DOT",
    symbol: "DOT",
  },
  rpcUrls: {
    default: {
      http: ["https://eth-rpc.polkadot.io/"],
    },
  },
  blockExplorers: {
    default: { 
      name: "Blockscout", 
      url: "https://blockscout.polkadot.io/" 
    },
  },
  testnet: false,
};

// Local development chain (Anvil)
const localhost: Chain = {
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
};

const config = createConfig({
  chains: [polkadotHubTestnet, polkadotHub, localhost],
  connectors: [
    injected(),
  ],
  transports: {
    [polkadotHubTestnet.id]: http(),
    [polkadotHub.id]: http(),
    [localhost.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
        retry: 1,               // only retry once on failed queries
      },
      mutations: {
        retry: 0,               // never retry failed mutations (wallet txs, API calls)
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const CHAIN_IDS = {
  polkadotHubTestnet: polkadotHubTestnet.id,
  polkadotHub: polkadotHub.id,
  localhost: localhost.id,
} as const;
