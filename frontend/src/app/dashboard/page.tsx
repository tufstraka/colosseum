"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Globe,
  Zap,
  Shield
} from "lucide-react";
import { useReadContract } from "wagmi";
import { getContractAddress, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-8">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Vaultstone</h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect your wallet to start creating cross-chain invoices on Polkadot Hub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const contractAddress = chain?.id ? getContractAddress(chain.id) : undefined;

  // Get user's invoices
  const { data: createdInvoices } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByCreator",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  const { data: receivedInvoices } = useReadContract({
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    functionName: "getInvoicesByRecipient",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Calculate stats
  const totalCreated = createdInvoices?.length || 0;
  const totalReceived = receivedInvoices?.length || 0;
  const totalInvoices = totalCreated + totalReceived;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 rounded-3xl blur-3xl -z-10" />
        
        <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-3xl border shadow-xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Globe className="h-4 w-4" />
                Connected to {chain?.name || "Network"}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Your Dashboard
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Manage cross-chain invoices, track payments, and get paid from any Polkadot parachain
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">Wallet: </span>
                <code className="px-2 py-1 rounded bg-muted font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
              </div>
            </div>
            
            <Link
              href="/dashboard/invoices/create"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-gradient-to-r from-primary to-purple-600 rounded-xl hover:from-primary/90 hover:to-purple-600/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Invoice
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Total Invoices"
          value={totalInvoices}
          trend="+12% from last month"
          gradient="from-blue-500/10 to-cyan-500/10"
          iconBg="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Created"
          value={totalCreated}
          subtext="NFTs you own"
          gradient="from-green-500/10 to-emerald-500/10"
          iconBg="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Received"
          value={totalReceived}
          subtext="Payment requests"
          gradient="from-purple-500/10 to-pink-500/10"
          iconBg="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Pending"
          value={0}
          subtext="Awaiting payment"
          gradient="from-orange-500/10 to-amber-500/10"
          iconBg="from-orange-500 to-amber-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <ActionCard
          icon={<Plus className="h-8 w-8" />}
          title="Create Invoice"
          description="Mint a new NFT invoice with payment splits and cross-chain support"
          href="/dashboard/invoices/create"
          color="primary"
        />
        <ActionCard
          icon={<FileText className="h-8 w-8" />}
          title="View Invoices"
          description="Browse all your invoices, track status, and manage payments"
          href="/dashboard/invoices"
          color="purple"
        />
        <ActionCard
          icon={<Globe className="h-8 w-8" />}
          title="Cross-Chain Pay"
          description="Accept payments from Moonbeam, Astar, Acala, and more via XCM"
          href="/dashboard/invoices"
          color="green"
        />
      </div>

      {/* Features Banner */}
      <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 rounded-3xl border p-8 lg:p-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">Why Vaultstone?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The most advanced invoice platform in the Polkadot ecosystem
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeaturePill
            icon={<Shield className="h-5 w-5" />}
            title="NFT Ownership"
            description="Your invoice, your asset"
          />
          <FeaturePill
            icon={<Globe className="h-5 w-5" />}
            title="6+ Parachains"
            description="True cross-chain"
          />
          <FeaturePill
            icon={<Zap className="h-5 w-5" />}
            title="Auto-Split"
            description="10 recipients max"
          />
          <FeaturePill
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="1% Fee"
            description="Low platform cost"
          />
        </div>
      </div>

      {/* Empty State */}
      {totalInvoices === 0 && (
        <div className="mt-12 text-center py-16">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No invoices yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Create your first invoice to start accepting cross-chain payments on Polkadot Hub
          </p>
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Your First Invoice
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  subtext,
  gradient,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  subtext?: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-6 transition-all hover:shadow-lg hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: "primary" | "purple" | "green";
}) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40",
    green: "from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40",
  };

  const iconClasses = {
    primary: "bg-primary text-primary-foreground",
    purple: "bg-purple-500 text-white",
    green: "bg-green-500 text-white",
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-6 transition-all hover:shadow-lg hover:scale-105`}
    >
      <div className={`w-14 h-14 rounded-xl ${iconClasses[color]} flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function FeaturePill({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
