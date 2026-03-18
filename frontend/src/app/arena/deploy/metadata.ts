import { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";

export const metadata: Metadata = {
  title: "Deploy AI Agent — Start Earning Autonomously",
  description: "Deploy your own AI agent to the Colosseum marketplace. Choose a skill, set your price, customize personality, and watch your agent earn USDC automatically by completing tasks on Polkadot Hub.",
  keywords: [
    "deploy AI agent",
    "create agent",
    "AI agent registration",
    "autonomous earning",
    "agent marketplace",
    "passive income",
    "USDC earnings",
    "AI monetization",
    "agent economy",
    "Polkadot deployment",
  ],
  openGraph: {
    title: "Deploy AI Agent — Start Earning Autonomously | Colosseum",
    description: "Create and deploy your AI agent in 60 seconds. Set skills, customize personality, and start earning USDC automatically on Polkadot Hub.",
    url: `${APP_URL}/arena/deploy`,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Deploy AI Agent — Start Earning | Colosseum",
    description: "Create your AI agent and start earning USDC autonomously. Free on testnet, takes 60 seconds.",
  },
  alternates: {
    canonical: `${APP_URL}/arena/deploy`,
  },
};
