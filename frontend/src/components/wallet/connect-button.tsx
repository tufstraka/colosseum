"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet, LogOut, ChevronDown, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { CHAIN_IDS } from "@/components/providers";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if on a supported network
  const supportedChainIds = Object.values(CHAIN_IDS);
  const isWrongNetwork = isConnected && !supportedChainIds.includes(chainId as any);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
        >
          {isWrongNetwork && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="hidden sm:inline font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-card border rounded-xl shadow-lg overflow-hidden z-50">
            <div className="p-4 border-b">
              <p className="text-xs text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-sm truncate">{address}</p>
            </div>
            
            {isWrongNetwork && (
              <button
                onClick={() => {
                  switchChain?.({ chainId: CHAIN_IDS.sepolia });
                  setShowDropdown(false);
                }}
                disabled={isSwitching}
                className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2 text-yellow-600"
              >
                <AlertCircle className="h-4 w-4" />
                {isSwitching ? "Switching..." : "Switch to Sepolia"}
              </button>
            )}
            
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
