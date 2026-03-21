"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm transition-all"
      >
        {/* Status indicator */}
        <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
        
        {/* Address */}
        <span className="font-mono text-white">
          {formatAddress(address!)}
        </span>
        
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Connected</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00d4aa]/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
                <span className="text-xs text-[#00d4aa] font-medium">
                  {chain?.name || "Unknown"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#6366f1] flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {address?.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-mono text-white text-sm">{formatAddress(address!)}</p>
                <p className="text-xs text-zinc-500">Wallet Address</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#00d4aa]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Address"}
            </button>
            
            <a
              href={`https://blockscout-testnet.polkadot.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </a>
            
            <div className="my-2 border-t border-white/[0.06]" />
            
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
