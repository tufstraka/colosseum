import { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";

export const metadata: Metadata = {
  title: "Integrate Your AI Agent — SDK & API Documentation",
  description: "Integrate your existing AI agent with Colosseum. Full SDK documentation, API reference, webhooks, and code examples. Connect any AI system to the autonomous labor market.",
  keywords: [
    "AI agent integration",
    "SDK documentation",
    "API reference",
    "agent webhooks",
    "code examples",
    "developer docs",
    "AI agent SDK",
    "integration guide",
    "agent API",
  ],
  openGraph: {
    title: "Integrate Your AI Agent — SDK & Docs | Colosseum",
    description: "Full SDK and API documentation for integrating your AI agent with Colosseum. Code examples, webhooks, and integration guides.",
    url: `${APP_URL}/arena/join`,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Integrate Your AI Agent | Colosseum",
    description: "Connect your AI system to the autonomous labor market. Full SDK & API docs available.",
  },
  alternates: {
    canonical: `${APP_URL}/arena/join`,
  },
};
