"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import { parseEther, zeroAddress } from "viem";
import { FileText, Plus, X, Wallet, ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";
import { getContractAddress, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";

interface PaymentSplit {
  payee: string;
  shares: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Debug logging
  useEffect(() => {
    console.log("Create Invoice Debug:", {
      isConnected,
      chain: chain?.name,
      chainId: chain?.id,
      contractAddress,
      address,
    });
  }, [isConnected, chain, contractAddress, address]);

  const handleAddSplit = () => {
    if (splits.length >= 10) return;
    setSplits([...splits, { payee: "", shares: 0 }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index: number, field: keyof PaymentSplit, value: string) => {
    const newSplits = [...splits];
    if (field === "shares") {
      newSplits[index][field] = parseInt(value) || 0;
    } else {
      newSplits[index][field] = value;
    }
    setSplits(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    console.log("Form submitted", { isConnected, contractAddress, recipient, amount, dueDate });

    if (!isConnected) {
      setLocalError("Please connect your wallet first");
      return;
    }

    if (!contractAddress || contractAddress === zeroAddress) {
      setLocalError(`Contract not deployed on ${chain?.name || "this network"}. Please switch to Polkadot Hub TestNet.`);
      return;
    }

    if (!recipient || !recipient.startsWith("0x")) {
      setLocalError("Please enter a valid recipient address (0x...)");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setLocalError("Please enter a valid amount");
      return;
    }

    if (!dueDate) {
      setLocalError("Please select a due date");
      return;
    }

    if (splits.length > 0) {
      const totalShares = splits.reduce((sum, split) => sum + split.shares, 0);
      if (totalShares !== 10000) {
        setLocalError(`Payment splits must total 10000 (currently ${totalShares})`);
        return;
      }
      for (const split of splits) {
        if (!split.payee || !split.payee.startsWith("0x")) {
          setLocalError("All split payees must have valid addresses (0x...)");
          return;
        }
      }
    }

    const dueDateTimestamp = BigInt(Math.floor(new Date(dueDate).getTime() / 1000));
    const formattedSplits = splits.map(split => ({
      payee: split.payee as `0x${string}`,
      shares: BigInt(split.shares),
    }));

    console.log("Calling writeContract with:", {
      address: contractAddress,
      functionName: "createInvoice",
      args: [recipient, parseEther(amount).toString(), zeroAddress, dueDateTimestamp.toString(), metadataURI || "ipfs://", formattedSplits],
    });

    try {
      writeContract({
        address: contractAddress,
        abi: VAULTSTONE_INVOICE_ABI,
        functionName: "createInvoice",
        args: [
          recipient as `0x${string}`,
          parseEther(amount),
          zeroAddress,
          dueDateTimestamp,
          metadataURI || "ipfs://",
          formattedSplits,
        ],
      });
    } catch (err) {
      console.error("writeContract error:", err);
      setLocalError(err instanceof Error ? err.message : "Failed to create invoice");
    }
  };

  if (isSuccess) {
    setTimeout(() => router.push("/dashboard/invoices"), 2000);
  }

  const totalShares = splits.reduce((sum, split) => sum + split.shares, 0);
  const displayError = localError || (error?.message ? error.message : null);

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-0">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h1>
          <p className="text-zinc-400">Connect to create invoices</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invoice Created!</h1>
          <p className="text-zinc-400 mb-2">Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
          <p className="text-zinc-500 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white mb-1">Create Invoice</h1>
          <p className="text-zinc-400">Fill in the details to mint your invoice NFT</p>
          
          {/* Network Info */}
          <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-zinc-400">
              Connected to <span className="text-white">{chain?.name}</span>
            </span>
            <span className="text-xs text-zinc-500">
              Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-2">The wallet that should pay this invoice</p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount ({chain?.nativeCurrency?.symbol || "PAS"})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.001"
              min="0"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          {/* Metadata URI */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Metadata URI <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://..."
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          {/* Payment Splits */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-white">Payment Splits</h3>
                <p className="text-sm text-zinc-500">Split payments among multiple recipients</p>
              </div>
              {splits.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddSplit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            {splits.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No splits. Full amount goes to creator.</p>
            ) : (
              <div className="space-y-3">
                {splits.map((split, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={split.payee}
                      onChange={(e) => handleSplitChange(index, "payee", e.target.value)}
                      placeholder="0x..."
                      required
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                    <input
                      type="number"
                      value={split.shares}
                      onChange={(e) => handleSplitChange(index, "shares", e.target.value)}
                      placeholder="Shares"
                      min="1"
                      max="10000"
                      required
                      className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(index)}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-zinc-500">Total shares</span>
                  <span className={totalShares === 10000 ? "text-emerald-500" : "text-red-400"}>
                    {totalShares} / 10000
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-400">
              <strong className="text-zinc-300">Note:</strong> MetaMask may show a "burn address" warning for the currency field. 
              This is safe—we use address(0) as a flag for native currency ({chain?.nativeCurrency?.symbol || "PAS"}). Your funds go to the recipient, not address(0).
            </p>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-400/80 mt-1">{displayError}</p>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {hash && !isSuccess && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-400">
                Transaction submitted: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
              <a 
                href={`https://blockscout-testnet.polkadot.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 text-zinc-400 font-medium border border-zinc-800 hover:bg-zinc-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming || (splits.length > 0 && totalShares !== 10000)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPending ? "Confirm in wallet..." : "Creating..."}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Create Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
