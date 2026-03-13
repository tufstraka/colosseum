"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/connect-button";

export function Header() {
  const { isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Vaultstone</span>
          </Link>
          {isConnected && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/invoices"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/dashboard/invoices/create"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Create Invoice
              </Link>
            </nav>
          )}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
