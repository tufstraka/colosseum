"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, createConfig } from "wagmi";
import { 
  RainbowKitProvider, 
  darkTheme,
  connectorsForWallets 
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  coinbaseWallet,
  talismanWallet,
} from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";
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

const projectId = "vaultstone-polkadot";

// Explicitly configure wallets with Talisman first
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        talismanWallet,
        metaMaskWallet,
      ],
    },
    {
      groupName: "Other",
      wallets: [
        injectedWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Vaultstone",
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [polkadotHubTestnet, polkadotHub, localhost],
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
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#10b981",
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Export chain IDs for use in other components
export const CHAIN_IDS = {
  polkadotHubTestnet: polkadotHubTestnet.id,
  polkadotHub: polkadotHub.id,
  localhost: localhost.id,
} as const;
