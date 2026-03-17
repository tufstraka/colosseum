"use client";

import { use } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, zeroAddress } from "viem";
import { VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";
import { useContractConfig } from "@/hooks/use-contract";
import { ConnectButton } from "@/components/wallet/connect-button";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Shield,
  Zap,
  ArrowRight
} from "lucide-react";

const InvoiceStatus = {
  0: { label: "Pending Payment", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  1: { label: "Paid", color: "bg-green-500/10 text-green-600", icon: CheckCircle },
  2: { label: "Cancelled", color: "bg-gray-500/10 text-gray-600", icon: XCircle },
  3: { label: "Overdue", color: "bg-red-500/10 text-red-600", icon: AlertTriangle },
  4: { label: "Disputed", color: "bg-orange-500/10 text-orange-600", icon: AlertTriangle },
} as const;

export default function PayInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = BigInt(id);
  
  const { address, isConnected } = useAccount();
  const { address: contractAddress } = useContractConfig();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: invoice, refetch, isLoading: isLoadingInvoice } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoice",
    args: [invoiceId],
  });

  const { data: paymentInfo } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "calculatePaymentAmount",
    args: [invoiceId],
    query: { enabled: !!invoice },
  });

  const { data: isOverdue } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "isOverdue",
    args: [invoiceId],
    query: { enabled: !!invoice },
  });

  const handlePay = () => {
    if (!paymentInfo) return;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="animate-pulse text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Invoice not found
  if (!invoice || invoice.id === BigInt(0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This invoice doesn't exist or has been removed.
          </p>
          <Link href="/" className="text-primary hover:underline">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/5 via-background to-background">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-20 w-20 mx-auto mb-6 text-green-500" />
          <h1 className="text-3xl font-bold mb-2">Invoice Paid!</h1>
          <p className="text-muted-foreground mb-6">
            This invoice was paid on {new Date(Number(invoice.paidAt) * 1000).toLocaleDateString()}
          </p>
          <div className="bg-card rounded-xl border p-6 text-left mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid to</span>
              <span className="font-mono text-sm">{invoice.creator.slice(0, 8)}...{invoice.creator.slice(-6)}</span>
            </div>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center text-primary hover:underline"
          >
            Create your own invoices with Vaultstone
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  // Cancelled or Disputed
  if (invoice.status === 2 || invoice.status === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="text-center max-w-md mx-auto px-4">
          <StatusIcon className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2">Invoice {status.label}</h1>
          <p className="text-muted-foreground mb-6">
            This invoice can no longer be paid.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Payment success message
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/5 via-background to-background">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-20 w-20 mx-auto mb-6 text-green-500 animate-bounce" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your payment. The funds have been distributed.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center text-primary hover:underline"
          >
            Create your own invoices with Vaultstone
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-4xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-primary">
          Vaultstone
        </Link>
        <ConnectButton />
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-primary/5 p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invoice</p>
                <p className="text-lg font-semibold">#{id}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                <StatusIcon className="h-4 w-4 inline mr-1" />
                {status.label}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="p-6 text-center border-b">
            <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
            <p className="text-4xl font-bold">
              {formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}
            </p>
            {paymentInfo && (
              <p className="text-sm text-muted-foreground mt-2">
                + {formatEther(paymentInfo[1])} platform fee = {formatEther(paymentInfo[0])} total
              </p>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-4 border-b">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-mono text-sm">{invoice.creator.slice(0, 8)}...{invoice.creator.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                {dueDate.toLocaleDateString()}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipients</span>
              <span>{invoice.splits.length} address{invoice.splits.length !== 1 ? "es" : ""}</span>
            </div>
          </div>

          {/* Payment Action */}
          <div className="p-6">
            {!isConnected ? (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Connect your wallet to pay this invoice</p>
                <ConnectButton />
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={isPending || isConfirming || !canPay}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isPending ? "Confirm in Wallet..." : "Processing Payment..."}
                  </>
                ) : (
                  <>
                    Pay {paymentInfo ? formatEther(paymentInfo[0]) : formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Secure
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            Instant
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            On-chain
          </div>
        </div>
      </main>
    </div>
  );
}
