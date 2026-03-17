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
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50">
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

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowModal(false)} />
          
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-zinc-400 mb-4">
                  Click below to connect your browser wallet (MetaMask, Talisman with EVM enabled, etc.)
                </p>
                
                <button
                  onClick={handleConnect}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">
                      {isPending ? "Connecting..." : "Browser Wallet"}
                    </p>
                    <p className="text-xs text-zinc-500">MetaMask, Talisman, etc.</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-zinc-500 -rotate-90" />
                </button>

                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">
                    <strong className="text-zinc-400">Using Talisman?</strong> Make sure EVM/Ethereum is enabled in Talisman settings and you have an Ethereum account added.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
