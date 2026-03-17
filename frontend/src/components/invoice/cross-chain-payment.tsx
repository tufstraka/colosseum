"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Globe, ArrowRight, Loader2, Check, AlertCircle } from "lucide-react";
import { getContractAddress, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";

const PARACHAINS = [
  { id: 1000, name: "Asset Hub", symbol: "DOT", color: "bg-pink-500" },
  { id: 2000, name: "Acala", symbol: "ACA", color: "bg-red-500" },
  { id: 2004, name: "Moonbeam", symbol: "GLMR", color: "bg-cyan-500" },
  { id: 2006, name: "Astar", symbol: "ASTR", color: "bg-blue-500" },
  { id: 2030, name: "Bifrost", symbol: "BNC", color: "bg-purple-500" },
  { id: 2034, name: "Hydration", symbol: "HDX", color: "bg-green-500" },
];

interface CrossChainPaymentProps {
  invoiceId: bigint;
  amount: bigint;
  onSuccess?: () => void;
}

export function CrossChainPayment({ invoiceId, amount, onSuccess }: CrossChainPaymentProps) {
  const { chain } = useAccount();
  const [selectedParachain, setSelectedParachain] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleInitiatePayment = () => {
    if (!selectedParachain || !contractAddress) return;

    writeContract({
      address: contractAddress,
      abi: VAULTSTONE_INVOICE_ABI,
      functionName: "initiateCrossChainPayment",
      args: [invoiceId, selectedParachain],
    });
  };

  if (isSuccess) {
    return (
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">XCM Payment Initiated!</h3>
            <p className="text-sm text-emerald-400">Cross-chain transfer in progress</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
          <p className="text-xs text-zinc-400 mb-1">Transaction Hash</p>
          <a
            href={`https://blockscout-testnet.polkadot.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-400 hover:underline font-mono"
          >
            {hash?.slice(0, 20)}...{hash?.slice(-8)}
          </a>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          The XCM message has been sent. Funds will arrive once the cross-chain transfer completes (typically 1-2 minutes).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-white">Pay from Another Chain</h3>
      </div>

      <p className="text-sm text-zinc-400">
        Select the parachain where your funds are located. We'll use XCM to transfer them to Polkadot Hub.
      </p>

      {/* Parachain Selection */}
      <div className="grid grid-cols-2 gap-2">
        {PARACHAINS.map((chain) => (
          <button
            key={chain.id}
            onClick={() => {
              setSelectedParachain(chain.id);
              setShowConfirm(true);
            }}
            className={`p-3 rounded-xl border transition-all text-left ${
              selectedParachain === chain.id
                ? "bg-zinc-800 border-emerald-500"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${chain.color}`} />
              <span className="text-sm font-medium text-white">{chain.name}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">ID: {chain.id}</p>
          </button>
        ))}
      </div>

      {/* Confirmation */}
      {showConfirm && selectedParachain && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
          <h4 className="font-medium text-white mb-3">Confirm Cross-Chain Payment</h4>
          
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg mb-3">
            <div className="text-center">
              <p className="text-xs text-zinc-500">From</p>
              <p className="text-sm font-medium text-white">
                {PARACHAINS.find(p => p.id === selectedParachain)?.name}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
            <div className="text-center">
              <p className="text-xs text-zinc-500">To</p>
              <p className="text-sm font-medium text-white">Polkadot Hub</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Amount</span>
              <span className="text-white">{(Number(amount) / 1e18).toFixed(4)} PAS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">XCM Fee (est.)</span>
              <span className="text-white">~0.01 DOT</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowConfirm(false);
                setSelectedParachain(null);
              }}
              className="flex-1 px-4 py-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={isPending || isConfirming}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPending ? "Confirm..." : "Processing..."}
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Initiate XCM
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
        <p className="text-xs text-zinc-500">
          <span className="text-emerald-500 font-medium">How it works:</span> XCM (Cross-Consensus Messaging) 
          enables secure asset transfers between Polkadot parachains. Your funds will be withdrawn from the 
          source chain and deposited here via the relay chain.
        </p>
      </div>
    </div>
  );
}
