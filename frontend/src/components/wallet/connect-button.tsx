"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { Wallet, ChevronDown, Check, ExternalLink, LogOut, Copy, X, Loader2 } from "lucide-react";

interface DetectedWallet {
  name: string;
  icon: string;
  installed: boolean;
  downloadUrl: string;
}

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  // Detect wallets using @talismn/connect-wallets
  const detectWallets = useCallback(async () => {
    setIsDetecting(true);
    try {
      const { getWallets } = await import("@talismn/connect-wallets");
      const allWallets = getWallets();
      
      const walletList: DetectedWallet[] = [
        {
          name: "Talisman",
          icon: "🔮",
          installed: allWallets.some(w => w.extensionName === "talisman" && w.installed),
          downloadUrl: "https://talisman.xyz/download",
        },
        {
          name: "SubWallet",
          icon: "◆",
          installed: allWallets.some(w => w.extensionName === "subwallet-js" && w.installed),
          downloadUrl: "https://subwallet.app/download",
        },
        {
          name: "Polkadot.js",
          icon: "⬡",
          installed: allWallets.some(w => w.extensionName === "polkadot-js" && w.installed),
          downloadUrl: "https://polkadot.js.org/extension/",
        },
      ];

      // Also check for MetaMask via window.ethereum
      const hasMetaMask = typeof window !== "undefined" && 
        (window as any).ethereum?.isMetaMask && 
        !(window as any).ethereum?.isTalisman;
      
      walletList.push({
        name: "MetaMask",
        icon: "🦊",
        installed: hasMetaMask,
        downloadUrl: "https://metamask.io/download/",
      });

      setWallets(walletList);
    } catch (error) {
      console.error("Error detecting wallets:", error);
      // Fallback detection
      const hasMetaMask = typeof window !== "undefined" && (window as any).ethereum?.isMetaMask;
      setWallets([
        { name: "MetaMask", icon: "🦊", installed: hasMetaMask, downloadUrl: "https://metamask.io/download/" },
        { name: "Talisman", icon: "🔮", installed: false, downloadUrl: "https://talisman.xyz/download" },
      ]);
    }
    setIsDetecting(false);
  }, []);

  useEffect(() => {
    detectWallets();
    // Re-detect after delays for async wallet injection
    const timer = setTimeout(detectWallets, 1000);
    return () => clearTimeout(timer);
  }, [detectWallets]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
      setShowModal(false);
    }
  };

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setShowMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const installedWallets = wallets.filter(w => w.installed);
  const notInstalledWallets = wallets.filter(w => !w.installed);

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
            <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[95]">
              <div className="p-4 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Connected to {chain?.name}</p>
                <p className="font-mono text-sm text-white truncate">{address}</p>
              </div>
              
              <div className="p-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
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
                  onClick={() => { disconnect(); setShowMenu(false); }}
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
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
      >
        Connect Wallet
      </button>

      {/* Modal */}
      {showModal && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)} 
          />
          
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {isDetecting ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                    <span className="ml-2 text-sm text-zinc-400">Detecting wallets...</span>
                  </div>
                ) : (
                  <>
                    {/* Installed Wallets */}
                    {installedWallets.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 mb-2 px-1">Available</p>
                        <div className="space-y-2">
                          {installedWallets.map((wallet) => (
                            <button
                              key={wallet.name}
                              onClick={handleConnect}
                              disabled={isPending}
                              className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all disabled:opacity-50"
                            >
                              <span className="text-2xl">{wallet.icon}</span>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-white">{wallet.name}</p>
                                <p className="text-xs text-emerald-500">Ready to connect</p>
                              </div>
                              {isPending ? (
                                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-zinc-500 -rotate-90" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Not Installed */}
                    {notInstalledWallets.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 px-1">
                          {installedWallets.length > 0 ? "Get more wallets" : "Install a wallet"}
                        </p>
                        <div className="space-y-2">
                          {notInstalledWallets.map((wallet) => (
                            <a
                              key={wallet.name}
                              href={wallet.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/50 border border-zinc-800/50 border-dashed rounded-xl transition-all"
                            >
                              <span className="text-2xl opacity-50">{wallet.icon}</span>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-zinc-400">{wallet.name}</p>
                                <p className="text-xs text-zinc-500">Click to install</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-zinc-500" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {installedWallets.length === 0 && notInstalledWallets.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-zinc-400">No wallets found</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <div className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-emerald-500 font-medium">Tip:</span> For Polkadot Hub, we recommend{" "}
                    <a href="https://talisman.xyz" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                      Talisman
                    </a>
                    . Enable EVM mode in settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
