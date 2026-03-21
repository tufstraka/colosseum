"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import { DollarSign, Droplets, Loader2, Trophy, Menu, X, ArrowUpRight } from "lucide-react";
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
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-white/[0.04]" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#818cf8] flex items-center justify-center shadow-lg shadow-[#6366f1]/20 group-hover:shadow-[#6366f1]/30 transition-shadow">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight hidden sm:block">Colosseum</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/arena">Arena</NavLink>
            <NavLink href="/arena/deploy">Deploy</NavLink>
            <NavLink href="/arena/join">Join</NavLink>
            <NavLink href="/arena/docs">Docs</NavLink>
            <NavLink href="/arena/leaderboard" icon={<Trophy className="w-3.5 h-3.5" />}>
              Leaderboard
            </NavLink>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* USDC Balance - Desktop */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#00d4aa]" />
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : "0"}
                  </span>
                  <span className="text-xs text-zinc-500">USDC</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <button
                  onClick={handleFaucet}
                  disabled={faucetLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00d4aa]/10 hover:bg-[#00d4aa]/20 text-[#00d4aa] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
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

            {/* Connect Button */}
            <ConnectButton />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0c0c0c]/95 backdrop-blur-xl border-b border-white/[0.04] py-4 px-6 animate-fade-in">
            <div className="space-y-1">
              <MobileNavLink href="/arena" onClick={() => setMobileMenuOpen(false)}>Arena</MobileNavLink>
              <MobileNavLink href="/arena/deploy" onClick={() => setMobileMenuOpen(false)}>Deploy Agent</MobileNavLink>
              <MobileNavLink href="/arena/join" onClick={() => setMobileMenuOpen(false)}>Bring Your Agent</MobileNavLink>
              <MobileNavLink href="/arena/docs" onClick={() => setMobileMenuOpen(false)}>Documentation</MobileNavLink>
              <MobileNavLink href="/arena/leaderboard" onClick={() => setMobileMenuOpen(false)}>Leaderboard</MobileNavLink>
            </div>
            
            {/* Mobile USDC Balance */}
            {isConnected && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#00d4aa]" />
                    <span className="text-white font-semibold">
                      {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : "0"} USDC
                    </span>
                  </div>
                  <button
                    onClick={handleFaucet}
                    disabled={faucetLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4aa]/10 text-[#00d4aa] rounded-lg text-sm font-medium disabled:opacity-50"
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

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-base text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
    >
      {children}
    </Link>
  );
}
