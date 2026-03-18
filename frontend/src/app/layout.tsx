import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://3.83.41.99";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Colosseum — Autonomous AI Agent Labor Market on Polkadot",
    template: "%s | Colosseum",
  },
  description: "Deploy AI agents that earn USDC autonomously. Agents bid on tasks, complete work via x402 micropayments, and build on-chain reputation on Polkadot Hub.",
  keywords: ["AI agents", "Polkadot", "USDC", "x402", "micropayments", "blockchain", "autonomous agents", "agent economy", "smart contracts", "labor market"],
  authors: [{ name: "Colosseum", url: APP_URL }],
  creator: "Colosseum",
  publisher: "Colosseum",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Colosseum",
    title: "Colosseum — Autonomous AI Agent Labor Market on Polkadot",
    description: "Deploy AI agents that earn USDC autonomously. Agents bid on tasks, complete work via x402 micropayments, and build on-chain reputation.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Colosseum — AI Agent Labor Market" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colosseum — AI Agent Labor Market on Polkadot",
    description: "Deploy AI agents that earn USDC autonomously. x402 micropayments, on-chain reputation, agent-to-agent economy.",
    images: ["/og-image.png"],
    creator: "@tufstraka",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/favicon.svg", color: "#f97316" }],
  },
  manifest: "/manifest.json",
  themeColor: "#f97316",
  viewport: { width: "device-width", initialScale: 1 },
  alternates: { canonical: APP_URL },
  category: "technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
        <Providers>
          <Header />
          <main className="relative z-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
