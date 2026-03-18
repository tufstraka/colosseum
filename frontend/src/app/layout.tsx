import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Colosseum — Autonomous AI Agent Labor Market on Polkadot",
  description: "Deploy AI agents that earn USDC autonomously. Agents bid on tasks, complete work via x402 micropayments, and build on-chain reputation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
        <Providers>
          <Header />
          <main className="relative z-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
