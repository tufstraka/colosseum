"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, zeroAddress } from "viem";
import { VAULTSTONE_INVOICE_ABI, getContractAddress } from "@/lib/contracts/abi";
import { ConnectButton } from "@/components/wallet/connect-button";
import { CrossChainPayment } from "@/components/invoice/cross-chain-payment";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Shield,
  Zap,
  ArrowRight,
  Globe,
  Wallet
} from "lucide-react";

const InvoiceStatus = {
  0: { label: "Pending Payment", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  1: { label: "Paid", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle },
  2: { label: "Cancelled", color: "bg-zinc-500/10 text-zinc-400", icon: XCircle },
  3: { label: "Overdue", color: "bg-red-500/10 text-red-500", icon: AlertTriangle },
  4: { label: "Disputed", color: "bg-orange-500/10 text-orange-500", icon: AlertTriangle },
} as const;

export default function PayInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = BigInt(id);
  
  const { address, isConnected, chain } = useAccount();
  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  const [paymentMethod, setPaymentMethod] = useState<"same-chain" | "cross-chain">("same-chain");

  const { data: invoice, refetch, isLoading: isLoadingInvoice } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoice",
    args: [invoiceId],
    query: { enabled: !!contractAddress },
  });

  const { data: paymentInfo } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "calculatePaymentAmount",
    args: [invoiceId],
    query: { enabled: !!invoice && !!contractAddress },
  });

  const { data: isOverdue } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "isOverdue",
    args: [invoiceId],
    query: { enabled: !!invoice && !!contractAddress },
  });

  const handlePay = () => {
    if (!paymentInfo || !contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: VAULTSTONE_INVOICE_ABI,
      functionName: "payInvoice",
      args: [invoiceId],
      value: paymentInfo[0],
    });
  };

  if (isSuccess) {
    refetch();
  }

  // Loading state
  if (isLoadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-zinc-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Invoice not found
  if (!invoice || invoice.id === BigInt(0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
          <p className="text-zinc-400 mb-6">
            This invoice doesn't exist or has been removed.
          </p>
          <Link href="/" className="text-emerald-500 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const status = InvoiceStatus[invoice.status as keyof typeof InvoiceStatus] || InvoiceStatus[0];
  const StatusIcon = status.icon;
  const isNative = invoice.currency === zeroAddress;
  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const canPay = invoice.status === 0;

  // Already paid
  if (invoice.status === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-20 w-20 mx-auto mb-6 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Paid!</h1>
          <p className="text-zinc-400 mb-6">
            This invoice was paid on {new Date(Number(invoice.paidAt) * 1000).toLocaleDateString()}
          </p>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-left mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Amount</span>
              <span className="font-semibold text-white">{formatEther(invoice.amount)} PAS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Paid to</span>
              <span className="font-mono text-sm text-white">{invoice.creator.slice(0, 8)}...{invoice.creator.slice(-6)}</span>
            </div>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center text-emerald-500 hover:underline"
          >
            Create your own invoices with Vaultstone
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  // Payment success message
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-20 w-20 mx-auto mb-6 text-emerald-500 animate-bounce" />
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-zinc-400 mb-6">
            Thank you for your payment. The funds have been distributed.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center text-emerald-500 hover:underline"
          >
            Create your own invoices with Vaultstone
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-white text-lg">Vaultstone</span>
        </Link>
        <ConnectButton />
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-zinc-950 p-6 border-b border-zinc-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Invoice</p>
                <p className="text-lg font-semibold text-white">#{id}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="p-6 text-center border-b border-zinc-800">
            <p className="text-sm text-zinc-500 mb-2">Amount Due</p>
            <p className="text-4xl font-bold text-white">
              {formatEther(invoice.amount)} <span className="text-zinc-400">PAS</span>
            </p>
            {paymentInfo && (
              <p className="text-sm text-zinc-500 mt-2">
                + {formatEther(paymentInfo[1])} fee = <span className="text-white">{formatEther(paymentInfo[0])} total</span>
              </p>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-4 border-b border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400">From</span>
              <span className="font-mono text-sm text-white">{invoice.creator.slice(0, 8)}...{invoice.creator.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Due Date</span>
              <span className={isOverdue ? "text-red-500 font-medium" : "text-white"}>
                {dueDate.toLocaleDateString()}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Recipients</span>
              <span className="text-white">{invoice.splits.length} address{invoice.splits.length !== 1 ? "es" : ""}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          {canPay && isConnected && (
            <div className="p-6 border-b border-zinc-800">
              <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl">
                <button
                  onClick={() => setPaymentMethod("same-chain")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === "same-chain"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Same Chain
                </button>
                <button
                  onClick={() => setPaymentMethod("cross-chain")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === "cross-chain"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Cross-Chain (XCM)
                </button>
              </div>
            </div>
          )}

          {/* Payment Action */}
          <div className="p-6">
            {!isConnected ? (
              <div className="text-center">
                <p className="text-zinc-400 mb-4">Connect your wallet to pay this invoice</p>
                <ConnectButton />
              </div>
            ) : paymentMethod === "cross-chain" ? (
              <CrossChainPayment 
                invoiceId={invoiceId} 
                amount={invoice.amount}
                onSuccess={() => refetch()}
              />
            ) : (
              <button
                onClick={handlePay}
                disabled={isPending || isConfirming || !canPay}
                className="w-full py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isPending ? "Confirm in Wallet..." : "Processing..."}
                  </>
                ) : (
                  <>
                    Pay {paymentInfo ? formatEther(paymentInfo[0]) : formatEther(invoice.amount)} PAS
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-8 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Secure
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Instant
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Cross-Chain
          </div>
        </div>
      </main>
    </div>
  );
}
