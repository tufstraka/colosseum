"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { FileText, Plus, TrendingUp, Clock, ArrowRight, Wallet, Zap } from "lucide-react";
import { useReadContract } from "wagmi";
import { getContractAddress, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;

  const { data: createdInvoices } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  const { data: receivedInvoices } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByRecipient",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  const totalCreated = createdInvoices?.length || 0;
  const totalReceived = receivedInvoices?.length || 0;

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-0">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h1>
          <p className="text-zinc-400 mb-6">
            Connect your wallet to create invoices and manage payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-zinc-400">
              Connected to {chain?.name || "Network"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-zinc-400">Manage your cross-chain invoices</p>
            </div>
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Invoices"
            value={totalCreated + totalReceived}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Created"
            value={totalCreated}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Received"
            value={totalReceived}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={0}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard
              href="/dashboard/invoices/create"
              icon={<Plus className="w-5 h-5" />}
              title="Create Invoice"
              description="Mint a new NFT invoice with payment splits"
            />
            <ActionCard
              href="/dashboard/invoices"
              icon={<FileText className="w-5 h-5" />}
              title="View Invoices"
              description="Browse and manage all your invoices"
            />
            <ActionCard
              href="/ai"
              icon={<Zap className="w-5 h-5" />}
              title="AI Tools"
              description="Generate invoices & detect fraud with AI"
              badge="x402"
            />
            <ActionCard
              href="/marketplace"
              icon={<TrendingUp className="w-5 h-5" />}
              title="Marketplace"
              description="Sell invoices for instant cash or invest"
              badge="Earn"
            />
          </div>
        </div>

        {/* Empty state */}
        {totalCreated === 0 && totalReceived === 0 && (
          <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No invoices yet</h3>
            <p className="text-zinc-400 text-sm mb-6">Create your first invoice to get started</p>
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function ActionCard({ href, icon, title, description, badge }: { href: string; icon: React.ReactNode; title: string; description: string; badge?: string }) {
  return (
    <Link
      href={href}
      className="group p-5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors">
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-sm text-zinc-500 group-hover:text-white transition-colors">
        <span>Open</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
