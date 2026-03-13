"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { useState } from "react";

// Define Polkadot Hub chain
const polkadotHub = {
  id: 420420420, // Placeholder - use actual chain ID
  name: "Polkadot Hub Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "DOT",
    symbol: "DOT",
  },
  rpcUrls: {
    default: {
      http: ["https://polkadot-hub-testnet-rpc.example.com"], // Replace with actual RPC
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.example.com" },
  },
} as const;

const config = createConfig({
  chains: [polkadotHub],
  connectors: [injected()],
  transports: {
    [polkadotHub.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
