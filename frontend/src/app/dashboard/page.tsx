"use client";

import Link from "next/link";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";
import { useContractConfig } from "@/hooks/use-contract";
import { FileText, Plus, DollarSign, Clock, CheckCircle, ArrowRight } from "lucide-react";
import type { Invoice } from "@/types/invoice";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { address: contractAddress } = useContractConfig();

  const { data: createdInvoiceIds } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: receivedInvoiceIds } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByRecipient",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fetch all created invoices
  const invoiceIds = createdInvoiceIds || [];
  const { data: invoicesData } = useReadContracts({
    contracts: invoiceIds.map((id) => ({
      address: contractAddress,
      abi: VAULTSTONE_INVOICE_ABI,
      functionName: "getInvoice" as const,
      args: [id],
    })),
    query: { enabled: invoiceIds.length > 0 },
  });

  const invoices = (invoicesData?.map((r) => r.result).filter(Boolean) || []) as Invoice[];
  
  // Calculate stats
  const totalInvoices = invoiceIds.length;
  const pendingInvoices = invoices.filter((inv) => inv?.status === 0).length;
  const paidInvoices = invoices.filter((inv) => inv?.status === 1).length;
  const totalReceived = invoices
    .filter((inv) => inv?.status === 1)
    .reduce((sum, inv) => sum + (inv?.amount || BigInt(0)), BigInt(0));

  const recentInvoices = [...invoices]
    .sort((a, b) => Number((b?.createdAt || BigInt(0)) - (a?.createdAt || BigInt(0))))
    .slice(0, 5);

  if (!isConnected) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          title="Total Invoices"
          value={totalInvoices.toString()}
          description="All time"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          title="Pending"
          value={pendingInvoices.toString()}
          description="Awaiting payment"
          highlight={pendingInvoices > 0}
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6" />}
          title="Paid"
          value={paidInvoices.toString()}
          description="Completed"
        />
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          title="Total Received"
          value={`${formatEther(totalReceived)} DOT`}
          description="All time earnings"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border p-6">
          <h3 className="font-semibold mb-2">Create New Invoice</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Send a professional invoice in seconds. NFT-backed and trackable.
          </p>
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center text-primary hover:underline"
          >
            Create Invoice
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl border p-6">
          <h3 className="font-semibold mb-2">View All Invoices</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your invoices, track payments, and see your history.
          </p>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center text-primary hover:underline"
          >
            View Invoices
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Invoices</h2>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        
        {recentInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((inv) => {
              if (!inv) return null;
              const statusColors = {
                0: "bg-yellow-500/10 text-yellow-600",
                1: "bg-green-500/10 text-green-600",
                2: "bg-gray-500/10 text-gray-600",
                3: "bg-red-500/10 text-red-600",
                4: "bg-orange-500/10 text-orange-600",
              };
              const statusLabels = ["Pending", "Paid", "Cancelled", "Overdue", "Disputed"];
              
              return (
                <Link
                  key={inv.id.toString()}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Invoice #{inv.id.toString()}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {inv.recipient.slice(0, 6)}...{inv.recipient.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatEther(inv.amount)} DOT</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[inv.status as keyof typeof statusColors] || statusColors[0]}`}>
                      {statusLabels[inv.status] || "Unknown"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-card rounded-xl border p-6 ${highlight ? "ring-2 ring-primary/20" : ""}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${highlight ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
