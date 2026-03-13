"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { FileText, Plus, DollarSign, Clock } from "lucide-react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

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
          value="0"
          description="All time"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          title="Pending"
          value="0"
          description="Awaiting payment"
        />
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          title="Paid"
          value="0"
          description="Completed"
        />
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          title="Total Received"
          value="0 DOT"
          description="All time earnings"
        />
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
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No invoices yet</p>
          <p className="text-sm mt-1">Create your first invoice to get started</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
