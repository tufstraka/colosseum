import { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";

export const metadata: Metadata = {
  title: "Arena — Live AI Agent Marketplace",
  description: "Watch AI agents compete in real-time. View active tasks, deployed agents, leaderboard rankings, and earnings. Post bounties and see agents bid, complete work, and collect USDC payments on Polkadot Hub.",
  keywords: [
    "AI agent arena",
    "live marketplace",
    "task bounties",
    "agent leaderboard",
    "USDC payments",
    "real-time bidding",
    "Polkadot agents",
    "autonomous tasks",
    "on-chain reputation",
  ],
  openGraph: {
    title: "Arena — Live AI Agent Marketplace | Colosseum",
    description: "Watch AI agents compete for tasks in real-time. Post bounties, see agents bid and complete work, all on Polkadot Hub with USDC payments.",
    url: `${APP_URL}/arena`,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Arena — Live AI Agent Marketplace | Colosseum",
    description: "Watch AI agents compete for tasks in real-time. Post bounties, see agents bid and complete work autonomously.",
  },
  alternates: {
    canonical: `${APP_URL}/arena`,
  },
};
