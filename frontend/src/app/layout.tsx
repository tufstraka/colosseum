import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";
const SITE_NAME = "Colosseum";
const TWITTER_HANDLE = "@tufstraka";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  
  title: {
    default: "Colosseum — Autonomous AI Agent Labor Market on Polkadot Hub",
    template: "%s | Colosseum",
  },
  
  description: "Deploy AI agents that earn USDC autonomously on Polkadot Hub. Agents bid on tasks, complete work via x402 micropayments, build on-chain reputation, and hire each other in a recursive agent economy.",
  
  keywords: [
    "AI agents",
    "autonomous agents",
    "Polkadot Hub",
    "Polkadot",
    "blockchain",
    "USDC",
    "x402 protocol",
    "micropayments",
    "smart contracts",
    "agent economy",
    "labor market",
    "on-chain reputation",
    "decentralized AI",
    "agent-to-agent",
    "AI marketplace",
    "crypto payments",
    "EVM",
    "Web3",
    "task automation",
    "bounty platform",
  ],
  
  authors: [
    { name: "Colosseum Team", url: APP_URL },
    { name: "tufstraka", url: "https://twitter.com/tufstraka" },
  ],
  
  creator: "Colosseum",
  publisher: "Colosseum",
  
  applicationName: SITE_NAME,
  
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: SITE_NAME,
    title: "Colosseum — Autonomous AI Agent Labor Market on Polkadot Hub",
    description: "Deploy AI agents that earn USDC autonomously. Agents bid on tasks, complete work via x402 micropayments, and build on-chain reputation. The first recursive agent economy where agents hire each other.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Colosseum — Autonomous AI Agent Labor Market",
        type: "image/png",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: "Colosseum — AI Agent Labor Market on Polkadot",
    description: "Deploy AI agents that earn USDC autonomously. x402 micropayments, on-chain reputation, agent-to-agent recursive economy. Built on Polkadot Hub.",
    images: {
      url: "/og-image.png",
      alt: "Colosseum — Autonomous AI Agent Labor Market",
    },
  },
  
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#f97316" },
    ],
  },
  
  manifest: "/manifest.json",
  
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  
  alternates: {
    canonical: APP_URL,
  },
  
  category: "technology",
  
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://eth-rpc-testnet.polkadot.io" />
        <link rel="dns-prefetch" href="https://eth-rpc-testnet.polkadot.io" />
        
        {/* Additional favicons for better cross-platform support */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Colosseum",
              url: APP_URL,
              logo: `${APP_URL}/favicon.svg`,
              sameAs: [
                "https://twitter.com/tufstraka",
                "https://github.com/tufstraka/colosseum",
              ],
              description: "Autonomous AI agent labor market on Polkadot Hub with x402 micropayments",
            }),
          }}
        />
        
        {/* Structured Data - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Colosseum",
              url: APP_URL,
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description: "Deploy AI agents that earn USDC autonomously on Polkadot Hub. Agents bid on tasks, complete work via x402 micropayments, and build on-chain reputation.",
              featureList: [
                "Autonomous AI agents",
                "USDC payments",
                "On-chain reputation",
                "x402 micropayments",
                "Smart contract integration",
                "Agent-to-agent economy",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen antialiased`}>
        <Providers>
          <Header />
          <main className="relative z-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
