"use client";

import { use } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, zeroAddress } from "viem";
import { VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";
import { useContractConfig } from "@/hooks/use-contract";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Loader2,
  Ban
} from "lucide-react";

const InvoiceStatus = {
  0: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: Clock },
  1: { label: "Paid", color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle },
  2: { label: "Cancelled", color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: XCircle },
  3: { label: "Overdue", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: AlertTriangle },
  4: { label: "Disputed", color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: AlertTriangle },
} as const;

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = BigInt(id);
  
  const { address, isConnected } = useAccount();
  const { address: contractAddress } = useContractConfig();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: invoice, refetch } = useReadContract({
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

  const handleCancel = () => {
    writeContract({
      address: contractAddress,
      abi: VAULTSTONE_INVOICE_ABI,
      functionName: "cancelInvoice",
      args: [invoiceId],
    });
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isSuccess) {
    refetch();
  }

  if (!isConnected) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to view this invoice.
        </p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const status = InvoiceStatus[invoice.status as keyof typeof InvoiceStatus] || InvoiceStatus[0];
  const StatusIcon = status.icon;
  const isNative = invoice.currency === zeroAddress;
  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const createdAt = new Date(Number(invoice.createdAt) * 1000);
  const isCreator = address?.toLowerCase() === invoice.creator.toLowerCase();
  const isRecipient = address?.toLowerCase() === invoice.recipient.toLowerCase();
  const canCancel = isCreator && invoice.status === 0;
  const canPay = invoice.status === 0;

  const paymentLink = typeof window !== "undefined" 
    ? `${window.location.origin}/pay/${invoiceId}`
    : `/pay/${invoiceId}`;

  return (
    <div className="container py-8 max-w-4xl">
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoices
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice #{id}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
              <StatusIcon className="h-4 w-4 inline mr-1" />
              {status.label}
            </span>
            {isOverdue && invoice.status === 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-red-500/10 text-red-600 border-red-500/30">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Overdue
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">
            {formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}
          </p>
          {paymentInfo && (
            <p className="text-sm text-muted-foreground">
              + {formatEther(paymentInfo[1])} fee = {formatEther(paymentInfo[0])} total
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Invoice Details */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          
          <div>
            <p className="text-sm text-muted-foreground">Creator</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">{invoice.creator}</code>
              <button onClick={() => copyToClipboard(invoice.creator)} className="p-1 hover:bg-muted rounded">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Recipient</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">{invoice.recipient}</code>
              <button onClick={() => copyToClipboard(invoice.recipient)} className="p-1 hover:bg-muted rounded">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{createdAt.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{createdAt.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{dueDate.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{dueDate.toLocaleTimeString()}</p>
            </div>
          </div>

          {invoice.paidAt > BigInt(0) && (
            <div>
              <p className="text-sm text-muted-foreground">Paid On</p>
              <p className="font-medium text-green-600">
                {new Date(Number(invoice.paidAt) * 1000).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Payment Splits */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Distribution</h2>
          <div className="space-y-3">
            {invoice.splits.map((split, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <code className="text-sm font-mono">
                  {split.payee.slice(0, 6)}...{split.payee.slice(-4)}
                </code>
                <span className="font-medium">
                  {Number(split.shares) / 100}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Link */}
      {invoice.status === 0 && (
        <div className="bg-card rounded-xl border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Payment Link</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Share this link with anyone to receive payment:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
              {paymentLink}
            </code>
            <button
              onClick={() => copyToClipboard(paymentLink)}
              className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {canPay && (
          <button
            onClick={handlePay}
            disabled={isPending || isConfirming}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {isPending ? "Confirm in Wallet..." : "Processing..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Pay {paymentInfo ? formatEther(paymentInfo[0]) : formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}
              </>
            )}
          </button>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isPending || isConfirming}
            className="px-6 py-3 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 disabled:opacity-50 flex items-center justify-center"
          >
            {isPending || isConfirming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Ban className="h-5 w-5 mr-2" />
                Cancel Invoice
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
