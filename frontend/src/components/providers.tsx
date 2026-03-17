"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { useState } from "react";
import type { Chain } from "viem";

// Polkadot Hub Testnet (Westend Asset Hub EVM)
// Update these values based on actual network configuration
const polkadotHubTestnet: Chain = {
  id: 420420421,
  name: "Polkadot Hub Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Westend",
    symbol: "WND",
  },
  rpcUrls: {
    default: {
      http: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
    },
  },
  blockExplorers: {
    default: { 
      name: "Subscan", 
      url: "https://westend-asset-hub.subscan.io" 
    },
  },
  testnet: true,
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

// Sepolia for testing if Polkadot Hub isn't available
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
  chains: [polkadotHubTestnet, sepolia, localhost],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [polkadotHubTestnet.id]: http(),
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
  sepolia: sepolia.id,
  localhost: localhost.id,
} as const;
