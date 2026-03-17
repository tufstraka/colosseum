"use client";

import { useState, useEffect } from "react";
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

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect available wallets
  const [availableWallets, setAvailableWallets] = useState<{
    id: string;
    name: string;
    icon: string;
    detected: boolean;
    downloadUrl?: string;
  }[]>([]);

  useEffect(() => {
    const wallets = [
      {
        id: "io.metamask",
        name: "MetaMask",
        icon: "🦊",
        detected: typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
        downloadUrl: "https://metamask.io/download/",
      },
      {
        id: "talisman",
        name: "Talisman",
        icon: "✨",
        detected: typeof window !== "undefined" && !!(window as any).talismanEth,
        downloadUrl: "https://talisman.xyz/download",
      },
      {
        id: "subwallet-js",
        name: "SubWallet",
        icon: "🔷",
        detected: typeof window !== "undefined" && !!(window as any).SubWallet,
        downloadUrl: "https://subwallet.app/download",
      },
      {
        id: "injected",
        name: "Browser Wallet",
        icon: "🌐",
        detected: typeof window !== "undefined" && !!(window as any).ethereum,
        downloadUrl: undefined,
      },
    ];

    setAvailableWallets(wallets);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
      setShowWalletModal(false);
    }
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 rounded-xl transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-sm font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-b">
                <p className="text-xs text-muted-foreground mb-2">Connected Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono flex-1 truncate">{address}</code>
                </div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy Address</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://blockscout-testnet.polkadot.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm">View on Explorer</span>
                </a>

                <div className="h-px bg-border my-2" />

                <button
                  onClick={() => {
                    disconnect();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Disconnect</span>
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
        className="relative group px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/25"
      >
        <span className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </span>
      </button>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWalletModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
              <button
                onClick={() => setShowWalletModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground">
                  Choose your preferred wallet to get started
                </p>
              </div>
            </div>

            {/* Wallet Options */}
            <div className="p-6 space-y-3">
              {availableWallets.map((wallet) => (
                <div key={wallet.id}>
                  {wallet.detected ? (
                    <button
                      onClick={() => handleConnect(wallet.id)}
                      className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/80 border border-border hover:border-primary/50 rounded-xl transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                        {wallet.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{wallet.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Detected
                        </p>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : wallet.downloadUrl ? (
                    <a
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-4 p-4 bg-muted/30 border border-dashed border-border hover:border-muted-foreground/50 rounded-xl transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                        {wallet.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-muted-foreground">{wallet.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          Not installed
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-blue-600 dark:text-blue-400">Recommended:</strong> For best experience with Polkadot Hub, 
                  use <strong>Talisman</strong> wallet. It won&apos;t show false warnings and has native XCM support.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
