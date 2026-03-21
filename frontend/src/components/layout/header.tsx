"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import { DollarSign, Droplets, Loader2, Trophy, Menu, X } from "lucide-react";
import { useState } from "react";

const MOCK_USDC_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export function Header() {
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const { data: usdcBalance, refetch: refetchBal } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    try {
      await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      refetchBal();
    } catch {}
    setFaucetLoading(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={40} />
            <span className="font-display font-semibold text-white text-lg tracking-tight hidden sm:block">Colosseum</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/arena">Arena</NavLink>
            <NavLink href="/arena/deploy">Deploy</NavLink>
            <NavLink href="/arena/join">Join</NavLink>
            <NavLink href="/arena/docs">Docs</NavLink>
            <NavLink href="/arena/leaderboard">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              Leaderboard
            </NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* USDC Balance */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 card rounded-xl">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[--gold-400]" />
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : "0"}
                  </span>
                  <span className="text-xs text-[--text-muted]">USDC</span>
                </div>
                <div className="w-px h-4 bg-[--border-default]" />
                <button
                  onClick={handleFaucet}
                  disabled={faucetLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[--cyan-500]/10 hover:bg-[--cyan-500]/20 text-[--cyan-400] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {faucetLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Droplets className="w-3 h-3" />
                  )}
                  {faucetLoading ? "" : "Faucet"}
                </button>
              </div>
            )}

            <ConnectButton />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[--text-secondary] hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass border-t border-[--border-default] py-4 px-6 animate-fade-in">
            <div className="space-y-1">
              <MobileNavLink href="/arena" onClick={() => setMobileMenuOpen(false)}>Arena</MobileNavLink>
              <MobileNavLink href="/arena/deploy" onClick={() => setMobileMenuOpen(false)}>Deploy Agent</MobileNavLink>
              <MobileNavLink href="/arena/join" onClick={() => setMobileMenuOpen(false)}>Bring Your Agent</MobileNavLink>
              <MobileNavLink href="/arena/docs" onClick={() => setMobileMenuOpen(false)}>Documentation</MobileNavLink>
              <MobileNavLink href="/arena/leaderboard" onClick={() => setMobileMenuOpen(false)}>Leaderboard</MobileNavLink>
            </div>
            
            {isConnected && (
              <div className="mt-4 pt-4 border-t border-[--border-default]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[--gold-400]" />
                    <span className="text-white font-semibold">
                      {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : "0"} USDC
                    </span>
                  </div>
                  <button
                    onClick={handleFaucet}
                    disabled={faucetLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[--cyan-500]/10 text-[--cyan-400] rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {faucetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                    Get USDC
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="flex-shrink-0">
      <defs>
        <linearGradient id="header-logo-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa' }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
        </linearGradient>
        <linearGradient id="header-logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
          <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
        </linearGradient>
      </defs>
      <path d="M10 48 Q10 16 32 16 Q54 16 54 48" 
            fill="none" stroke="url(#header-logo-primary)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M18 48 Q18 26 32 26 Q46 26 46 48" 
            fill="none" stroke="url(#header-logo-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <line x1="6" y1="52" x2="58" y2="52" stroke="url(#header-logo-primary)" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="32" cy="40" r="7" fill="url(#header-logo-accent)"/>
      <circle cx="32" cy="40" r="3" fill="#09090b" opacity="0.3"/>
    </svg>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center px-4 py-2 text-sm text-[--text-secondary] hover:text-white hover:bg-white/5 rounded-lg transition-all">
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-base text-[--text-secondary] hover:text-white hover:bg-white/5 rounded-xl transition-colors">
      {children}
    </Link>
  );
}
