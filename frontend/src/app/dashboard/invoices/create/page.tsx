"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, zeroAddress } from "viem";
import { VAULTSTONE_INVOICE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts/abi";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface PaymentSplit {
  payee: string;
  shares: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState({
    recipientAddress: "",
    amount: "",
    currency: "native", // native or token address
    dueDate: "",
    title: "",
    description: "",
  });

  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [error, setError] = useState("");

  const addSplit = () => {
    if (splits.length >= 10) return;
    setSplits([...splits, { payee: "", shares: 0 }]);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof PaymentSplit, value: string | number) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    try {
      // Validate splits total to 100%
      if (splits.length > 0) {
        const totalShares = splits.reduce((sum, s) => sum + s.shares, 0);
        if (totalShares !== 100) {
          setError("Payment splits must total 100%");
          return;
        }
      }

      // Convert splits to contract format (basis points)
      const contractSplits = splits.map((s) => ({
        payee: s.payee as `0x${string}`,
        shares: BigInt(s.shares * 100), // Convert percentage to basis points
      }));

      // Create metadata URI (in production, upload to IPFS)
      const metadataURI = `data:application/json,${encodeURIComponent(
        JSON.stringify({
          title: formData.title,
          description: formData.description,
          createdBy: address,
        })
      )}`;

      // Calculate due date timestamp
      const dueTimestamp = BigInt(Math.floor(new Date(formData.dueDate).getTime() / 1000));

      // Determine currency address
      const currencyAddress = formData.currency === "native" ? zeroAddress : (formData.currency as `0x${string}`);

      writeContract({
        address: CONTRACT_ADDRESSES.polkadotHubTestnet,
        abi: VAULTSTONE_INVOICE_ABI,
        functionName: "createInvoice",
        args: [
          formData.recipientAddress as `0x${string}`,
          parseEther(formData.amount),
          currencyAddress,
          dueTimestamp,
          metadataURI,
          contractSplits,
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    }
  };

  if (isSuccess) {
    router.push("/dashboard/invoices");
  }

  if (!isConnected) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to create an invoice.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invoice Details</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Invoice for services"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the services or products..."
              rows={3}
            />
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Payment Details</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={formData.recipientAddress}
              onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="0x..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                step="0.001"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="native">DOT (Native)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Payment Splits */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Payment Splits (Optional)</h2>
            <button
              type="button"
              onClick={addSplit}
              disabled={splits.length >= 10}
              className="inline-flex items-center px-3 py-1 text-sm bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Split
            </button>
          </div>

          {splits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              By default, 100% goes to you. Add splits to distribute payments.
            </p>
          ) : (
            <div className="space-y-3">
              {splits.map((split, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={split.payee}
                    onChange={(e) => updateSplit(index, "payee", e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="0x..."
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={split.shares}
                      onChange={(e) => updateSplit(index, "shares", parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSplit(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Total: {splits.reduce((sum, s) => sum + s.shares, 0)}% (must equal 100%)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {isPending ? "Confirm in Wallet..." : "Creating Invoice..."}
            </>
          ) : (
            "Create Invoice"
          )}
        </button>
      </form>
    </div>
  );
}
