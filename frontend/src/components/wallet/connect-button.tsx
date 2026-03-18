"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useConnect, useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { ChevronDown, Check, ExternalLink, LogOut, Copy, X, Loader2, AlertTriangle } from "lucide-react";

const POLKADOT_HUB_TESTNET_ID = 420420417;

interface DetectedWallet {
  name: string;
  icon: string;
  installed: boolean;
  downloadUrl: string;
}

function WalletModal({ 
  onClose, 
  wallets, 
  isDetecting, 
  onConnect, 
  isPending 
}: { 
  onClose: () => void;
  wallets: DetectedWallet[];
  isDetecting: boolean;
  onConnect: () => void;
  isPending: boolean;
}) {
  const installedWallets = wallets.filter(w => w.installed);
  const notInstalledWallets = wallets.filter(w => !w.installed);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        className="fixed inset-0 overflow-y-auto"
        style={{ zIndex: 9999 }}
      >
        <div className="min-h-full flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
              <button 
                onClick={onClose} 
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
                  {installedWallets.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-2 px-1">Available</p>
                      <div className="space-y-2">
                        {installedWallets.map((wallet) => (
                          <button
                            key={wallet.name}
                            onClick={onConnect}
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

            {/* Footer removed */}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-switch to Polkadot Hub TestNet when connected to wrong network
  useEffect(() => {
    if (!isConnected) {
      console.log("[Network] Not connected");
      return;
    }
    
    console.log("[Network] Current chain:", chain?.id, chain?.name || "Unknown/undefined");
    console.log("[Network] Target chain:", POLKADOT_HUB_TESTNET_ID);
    
    // If chain is undefined OR wrong chain ID, we need to switch
    if (chain?.id === POLKADOT_HUB_TESTNET_ID) {
      console.log("[Network] Already on correct network");
      return;
    }
    
    if (isSwitching) {
      console.log("[Network] Already switching...");
      return;
    }
    
    const autoSwitch = async () => {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        console.log("[Network] No ethereum provider found");
        return;
      }
      
      console.log("[Network] Attempting to switch to Polkadot Hub TestNet...");
      
      try {
        // First try switching (works if chain already added)
        console.log("[Network] Calling wallet_switchEthereumChain...");
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x190F1B41" }],
        });
        console.log("[Network] Switch successful!");
      } catch (switchError: any) {
        console.log("[Network] Switch error:", switchError?.code, switchError?.message);
        // Chain not added — add it first (error code 4902)
        if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized") || switchError?.message?.includes("wallet_addEthereumChain")) {
          console.log("[Network] Chain not found, attempting to add...");
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x190F1B41",
                chainName: "Polkadot Hub TestNet",
                nativeCurrency: { name: "Paseo", symbol: "PAS", decimals: 18 },
                rpcUrls: ["https://eth-rpc-testnet.polkadot.io/"],
                blockExplorerUrls: ["https://blockscout-testnet.polkadot.io/"],
              }],
            });
            console.log("[Network] Chain added successfully!");
          } catch (addError: any) {
            console.log("[Network] Add chain error:", addError?.code, addError?.message);
          }
        }
      }
    };
    autoSwitch();
  }, [isConnected, chain, isSwitching]);

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
      ];

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
      const hasMetaMask = typeof window !== "undefined" && (window as any).ethereum?.isMetaMask;
      setWallets([
        { name: "MetaMask", icon: "🦊", installed: hasMetaMask, downloadUrl: "https://metamask.io/download/" },
        { name: "Talisman", icon: "🔮", installed: false, downloadUrl: "https://talisman.xyz/download" },
      ]);
    }
    setIsDetecting(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      detectWallets();
      const timer = setTimeout(detectWallets, 1000);
      return () => clearTimeout(timer);
    }
  }, [detectWallets, mounted]);

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

  const handleSwitchNetwork = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.log("[Switch] No ethereum provider");
      return;
    }
    
    console.log("[Switch] Manual switch triggered");
    
    try {
      console.log("[Switch] Calling wallet_switchEthereumChain...");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x190F1B41" }],
      });
      console.log("[Switch] Success!");
    } catch (switchError: any) {
      console.log("[Switch] Error:", switchError?.code, switchError?.message);
      if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized") || switchError?.message?.includes("wallet_addEthereumChain")) {
        console.log("[Switch] Attempting to add chain...");
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x190F1B41",
              chainName: "Polkadot Hub TestNet",
              nativeCurrency: { name: "Paseo", symbol: "PAS", decimals: 18 },
              rpcUrls: ["https://eth-rpc-testnet.polkadot.io/"],
              blockExplorerUrls: ["https://blockscout-testnet.polkadot.io/"],
            }],
          });
          console.log("[Switch] Chain added!");
        } catch (addError: any) {
          console.log("[Switch] Add error:", addError?.code, addError?.message);
        }
      }
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // If chain is undefined but connected, we're on an unknown chain (wrong network)
  // If chain exists but ID doesn't match, also wrong network
  const isWrongNetwork = isConnected && (!chain || chain.id !== POLKADOT_HUB_TESTNET_ID);

  // Debug info
  useEffect(() => {
    if (isConnected) {
      console.log("[Debug] Connected:", isConnected);
      console.log("[Debug] Chain object:", chain);
      console.log("[Debug] Chain ID:", chain?.id);
      console.log("[Debug] Is wrong network:", isWrongNetwork);
    }
  }, [isConnected, chain, isWrongNetwork]);

  // Wrong network state - show switch button
  if (isConnected && isWrongNetwork) {
    return (
      <button
        onClick={handleSwitchNetwork}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg transition-colors"
        title={`Current: ${chain?.name || 'Unknown'} (${chain?.id || '?'})`}
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        )}
        <span className="text-sm text-amber-400 font-medium">
          {chain?.name || `Chain ${chain?.id}`} → Switch to Polkadot Hub
        </span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-sm text-white">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl" style={{ zIndex: 95 }}>
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-xs text-emerald-500">Connected to {chain?.name}</p>
                </div>
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

      {mounted && showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          wallets={wallets}
          isDetecting={isDetecting}
          onConnect={handleConnect}
          isPending={isPending}
        />
      )}
    </>
  );
}
