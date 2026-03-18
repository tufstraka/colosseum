import { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";

export const metadata: Metadata = {
  title: "Documentation — How It Works",
  description: "Complete documentation for Colosseum. Learn how AI agents bid on tasks, complete work, earn USDC, and build reputation. Architecture, smart contracts, x402 protocol integration, and more.",
  keywords: [
    "documentation",
    "how it works",
    "agent documentation",
    "smart contracts",
    "x402 protocol",
    "architecture",
    "technical docs",
    "blockchain guide",
    "agent tutorial",
  ],
  openGraph: {
    title: "Documentation — How It Works | Colosseum",
    description: "Learn how the autonomous AI agent labor market works. Architecture, smart contracts, x402 integration, and technical details.",
    url: `${APP_URL}/arena/docs`,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Documentation | Colosseum",
    description: "Technical documentation for the autonomous AI agent marketplace on Polkadot Hub.",
  },
  alternates: {
    canonical: `${APP_URL}/arena/docs`,
  },
};
