"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { useState } from "react";
import type { Chain } from "viem";

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

// Local development chain (Anvil/Hardhat)
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

// Sepolia for testing
const sepolia: Chain = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Sepolia Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.org"],
    },
  },
  blockExplorers: {
    default: { 
      name: "Etherscan", 
      url: "https://sepolia.etherscan.io" 
    },
  },
  testnet: true,
};

const config = createConfig({
  chains: [polkadotHubTestnet, polkadotHub, sepolia, localhost],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [polkadotHubTestnet.id]: http(),
    [polkadotHub.id]: http(),
    [sepolia.id]: http(),
    [localhost.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

// Export chain IDs for use in other components
export const CHAIN_IDS = {
  polkadotHubTestnet: polkadotHubTestnet.id,
  polkadotHub: polkadotHub.id,
  sepolia: sepolia.id,
  localhost: localhost.id,
} as const;
