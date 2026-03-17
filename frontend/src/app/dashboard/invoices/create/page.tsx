"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import { parseEther, zeroAddress } from "viem";
import { 
  FileText, 
  Plus, 
  X, 
  Calendar, 
  DollarSign, 
  Users,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";
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
  const [showSplits, setShowSplits] = useState(false);

  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAddSplit = () => {
    if (splits.length >= 10) {
      alert("Maximum 10 payment splits allowed");
      return;
    }
    setSplits([...splits, { payee: "", shares: 0 }]);
    setShowSplits(true);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
    if (splits.length === 1) setShowSplits(false);
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

    if (!isConnected || !contractAddress) {
      alert("Please connect your wallet");
      return;
    }

    // Validate splits total to 10000 (100%)
    if (splits.length > 0) {
      const totalShares = splits.reduce((sum, split) => sum + split.shares, 0);
      if (totalShares !== 10000) {
        alert(`Split shares must total 10000 (100%). Current total: ${totalShares}`);
        return;
      }
    }

    const dueDateTimestamp = BigInt(Math.floor(new Date(dueDate).getTime() / 1000));

    try {
      const formattedSplits = splits.map(split => ({
        payee: split.payee as `0x${string}`,
        shares: BigInt(split.shares),
      }));

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
      console.error("Error creating invoice:", err);
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      router.push("/dashboard/invoices");
    }, 2000);
  }

  const totalShares = splits.reduce((sum, split) => sum + split.shares, 0);
  const sharesValid = splits.length === 0 || totalShares === 10000;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-sm font-medium text-primary mb-4">
          <Sparkles className="h-4 w-4" />
          NFT Invoice Creation
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Create Cross-Chain Invoice
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mint an NFT invoice that accepts payments from any Polkadot parachain
        </p>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 bg-card rounded-3xl border">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to create invoices
          </p>
        </div>
      ) : isSuccess ? (
        <div className="text-center py-16 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-3xl border border-green-500/20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-green-600 dark:text-green-400">Invoice Created!</h2>
          <p className="text-muted-foreground mb-2">
            Your NFT invoice has been minted successfully
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting to dashboard...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Important Notice */}
          <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  About the MetaMask "Burn Address" Warning
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you create an invoice, MetaMask may show a warning about "sending assets to a burn address." 
                  <strong className="text-foreground"> This is safe and expected!</strong> We use the zero address (0x000...000) 
                  as a technical flag to indicate native currency (PAS/DOT) instead of ERC20 tokens. Your funds will NOT be burned - 
                  they will go to the recipient address you specify below when the invoice is paid.
                </p>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-3xl border shadow-xl p-8">
            {/* Recipient */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Users className="h-4 w-4 text-primary" />
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                required
                className="w-full px-4 py-3 rounded-xl border bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2">
                The wallet address that will receive payment
              </p>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <DollarSign className="h-4 w-4 text-primary" />
                Amount (PAS/DOT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.0"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 rounded-xl border bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>MetaMask Warning Expected:</strong> You may see a "burn address" warning. 
                    This is safe - we use the zero address (0x000...000) as a flag for native currency (PAS/DOT).
                    Your funds are NOT being burned, they go to the recipient you specify above.
                  </span>
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Payment deadline for this invoice
              </p>
            </div>

            {/* Metadata URI (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <FileText className="h-4 w-4 text-primary" />
                Metadata URI (Optional)
              </label>
              <input
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://... or https://..."
                className="w-full px-4 py-3 rounded-xl border bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2">
                IPFS or HTTP URL for invoice metadata (description, logo, etc.)
              </p>
            </div>
          </div>

          {/* Payment Splits */}
          <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl border p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Payment Splits
                  <span className="text-sm font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically distribute payments among multiple recipients
                </p>
              </div>
              {!showSplits && (
                <button
                  type="button"
                  onClick={() => {
                    setSplits([{ payee: address || "", shares: 10000 }]);
                    setShowSplits(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Split
                </button>
              )}
            </div>

            {showSplits && (
              <div className="space-y-4">
                {splits.map((split, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 rounded-xl bg-background/50 border">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Payee Address
                      </label>
                      <input
                        type="text"
                        value={split.payee}
                        onChange={(e) => handleSplitChange(index, "payee", e.target.value)}
                        placeholder="0x..."
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Shares (basis points)
                      </label>
                      <input
                        type="number"
                        value={split.shares}
                        onChange={(e) => handleSplitChange(index, "shares", e.target.value)}
                        placeholder="10000"
                        min="1"
                        max="10000"
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {((split.shares / 10000) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(index)}
                      className="mt-7 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium">
                      Total Shares: <span className={totalShares === 10000 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {totalShares}
                      </span> / 10000
                    </p>
                    {!sharesValid && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        Shares must total exactly 10000 (100%)
                      </p>
                    )}
                  </div>
                  {splits.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddSplit}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another
                    </button>
                  )}
                </div>
              </div>
            )}

            {!showSplits && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  No payment splits configured. The full amount will go to the creator.
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 text-base font-semibold text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming || !sharesValid}
              className="group flex-1 inline-flex items-center justify-center px-6 py-4 text-base font-semibold text-primary-foreground bg-gradient-to-r from-primary to-purple-600 rounded-xl hover:from-primary/90 hover:to-purple-600/90 transition-all hover:scale-105 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isPending ? "Confirming..." : "Creating..."}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Create Invoice
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
