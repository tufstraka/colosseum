"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, zeroAddress } from "viem";
import { VAULTSTONE_INVOICE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts/abi";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const InvoiceStatus = {
  0: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  1: { label: "Paid", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  2: { label: "Cancelled", color: "bg-gray-500/10 text-gray-500", icon: XCircle },
  3: { label: "Overdue", color: "bg-red-500/10 text-red-500", icon: AlertTriangle },
  4: { label: "Disputed", color: "bg-orange-500/10 text-orange-500", icon: AlertTriangle },
} as const;

export default function InvoicesPage() {
  const { address, isConnected } = useAccount();

  const { data: createdInvoiceIds } = useReadContract({
    address: CONTRACT_ADDRESSES.polkadotHubTestnet,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: receivedInvoiceIds } = useReadContract({
    address: CONTRACT_ADDRESSES.polkadotHubTestnet,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByRecipient",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to view your invoices.
        </p>
      </div>
    );
  }

  const createdIds = createdInvoiceIds || [];
  const receivedIds = receivedInvoiceIds || [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage your invoices and payments
          </p>
        </div>
        <Link
          href="/dashboard/invoices/create"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Invoice
        </Link>
      </div>

      {/* Created Invoices */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Created by You</h2>
        {createdIds.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No invoices created yet</p>
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center mt-4 text-primary hover:underline"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {createdIds.map((id) => (
              <InvoiceCard key={id.toString()} invoiceId={id} type="created" />
            ))}
          </div>
        )}
      </div>

      {/* Received Invoices */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Addressed to You</h2>
        {receivedIds.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No invoices received yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {receivedIds.map((id) => (
              <InvoiceCard key={id.toString()} invoiceId={id} type="received" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceCard({ invoiceId, type }: { invoiceId: bigint; type: "created" | "received" }) {
  const { data: invoice } = useReadContract({
    address: CONTRACT_ADDRESSES.polkadotHubTestnet,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoice",
    args: [invoiceId],
  });

  if (!invoice) {
    return (
      <div className="bg-card rounded-xl border p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  const status = InvoiceStatus[invoice.status as keyof typeof InvoiceStatus] || InvoiceStatus[0];
  const StatusIcon = status.icon;
  const isNative = invoice.currency === zeroAddress;
  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const createdAt = new Date(Number(invoice.createdAt) * 1000);

  return (
    <Link href={`/dashboard/invoices/${invoiceId}`}>
      <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold">Invoice #{invoiceId.toString()}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
                {status.label}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {type === "created" ? "To: " : "From: "}
                <span className="font-mono">
                  {type === "created"
                    ? `${invoice.recipient.slice(0, 6)}...${invoice.recipient.slice(-4)}`
                    : `${invoice.creator.slice(0, 6)}...${invoice.creator.slice(-4)}`}
                </span>
              </p>
              <p>Created: {createdAt.toLocaleDateString()}</p>
              <p>Due: {dueDate.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatEther(invoice.amount)} {isNative ? "DOT" : "Tokens"}
            </p>
            {invoice.paidAt > BigInt(0) && (
              <p className="text-sm text-green-500">
                Paid on {new Date(Number(invoice.paidAt) * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
