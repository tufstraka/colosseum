"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { 
  Wallet, 
  ChevronDown, 
  Check, 
  ExternalLink, 
  LogOut,
  Copy,
  X
} from "lucide-react";

interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  detected: boolean;
  downloadUrl?: string;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  const detectWallets = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const ethereum = (window as any).ethereum;
    
    const wallets: WalletInfo[] = [
      {
        id: "injected",
        name: "Talisman",
        icon: "🔮",
        detected: !!(ethereum?.isTalisman) || !!(window as any).talismanEth,
        downloadUrl: "https://talisman.xyz/download",
      },
      {
        id: "injected",
        name: "MetaMask",
        icon: "🦊",
        detected: !!(ethereum?.isMetaMask) && !(ethereum?.isTalisman),
        downloadUrl: "https://metamask.io/download/",
      },
      {
        id: "injected",
        name: "SubWallet",
        icon: "◆",
        detected: !!(window as any).SubWallet || !!(ethereum?.isSubWallet),
        downloadUrl: "https://subwallet.app/download",
      },
    ];

    // Also check if there's any injected provider
    if (ethereum && !wallets.some(w => w.detected)) {
      wallets.push({
        id: "injected",
        name: "Browser Wallet",
        icon: "🌐",
        detected: true,
        downloadUrl: undefined,
      });
    }

    setAvailableWallets(wallets);
  }, []);

  useEffect(() => {
    detectWallets();
    const timer1 = setTimeout(detectWallets, 100);
    const timer2 = setTimeout(detectWallets, 500);
    const timer3 = setTimeout(detectWallets, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [detectWallets]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = (walletName: string) => {
    const connector = connectors.find((c) => c.id === "injected");
    if (connector) {
      connect({ connector });
      setShowWalletModal(false);
    }
  };

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowWalletModal(false);
        setShowMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-sm text-white">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Connected</p>
                <p className="font-mono text-sm text-white truncate">{address}</p>
              </div>
              
              <div className="p-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="text-sm text-zinc-300">{copied ? "Copied!" : "Copy Address"}</span>
                </button>

                <a
                  href={`https://blockscout-testnet.polkadot.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">View on Explorer</span>
                </a>

                <div className="h-px bg-zinc-800 my-2" />

                <button
                  onClick={() => {
                    disconnect();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Disconnect</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowWalletModal(true)}
        className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
      >
        Connect Wallet
      </button>

      {/* Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowWalletModal(false)}
          />
          
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Wallets */}
            <div className="p-4 space-y-2">
              {availableWallets.filter(w => w.detected).length > 0 ? (
                availableWallets.filter(w => w.detected).map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{wallet.name}</p>
                      <p className="text-xs text-emerald-500">Ready to connect</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-zinc-500 -rotate-90" />
                  </button>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 mb-4">No wallet detected</p>
                </div>
              )}
              
              {/* Not installed wallets */}
              {availableWallets.filter(w => !w.detected && w.downloadUrl).length > 0 && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-xs text-zinc-500 px-1">Install a wallet</p>
                  </div>
                  {availableWallets.filter(w => !w.detected && w.downloadUrl).map((wallet) => (
                    <a
                      key={wallet.name}
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-4 p-4 bg-transparent hover:bg-zinc-800/50 border border-zinc-800/50 border-dashed rounded-xl transition-all"
                    >
                      <span className="text-2xl opacity-50">{wallet.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-zinc-400">{wallet.name}</p>
                        <p className="text-xs text-zinc-500">Click to install</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                    </a>
                  ))}
                </>
              )}
            </div>

            {/* Footer tip */}
            <div className="p-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 text-center">
                We recommend <span className="text-emerald-500">Talisman</span> for best Polkadot experience
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
