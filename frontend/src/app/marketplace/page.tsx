"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { getContractAddress, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Percent,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Filter,
  BarChart3,
} from "lucide-react";

// Mock marketplace listings (in production, this would be on-chain or in a database)
const MOCK_LISTINGS = [
  {
    invoiceId: 1,
    seller: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    faceValue: "1000",
    askingPrice: "950",
    discount: 5,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Web development services",
    riskScore: 25,
    riskLevel: "low",
    daysUntilDue: 30,
    aiVerified: true,
  },
  {
    invoiceId: 2,
    seller: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    faceValue: "5000",
    askingPrice: "4650",
    discount: 7,
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Consulting engagement Q1",
    riskScore: 35,
    riskLevel: "medium",
    daysUntilDue: 45,
    aiVerified: true,
  },
  {
    invoiceId: 3,
    seller: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    faceValue: "2500",
    askingPrice: "2375",
    discount: 5,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Logo design and branding",
    riskScore: 20,
    riskLevel: "low",
    daysUntilDue: 14,
    aiVerified: true,
  },
];

export default function MarketplacePage() {
  const { address, isConnected, chain } = useAccount();
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [sortBy, setSortBy] = useState<"discount" | "amount" | "due">("discount");
  const [selectedListing, setSelectedListing] = useState<typeof MOCK_LISTINGS[0] | null>(null);
  const [showListModal, setShowListModal] = useState(false);

  const filteredListings = MOCK_LISTINGS
    .filter(l => filter === "all" || l.riskLevel === filter)
    .sort((a, b) => {
      if (sortBy === "discount") return b.discount - a.discount;
      if (sortBy === "amount") return parseFloat(b.faceValue) - parseFloat(a.faceValue);
      return a.daysUntilDue - b.daysUntilDue;
    });

  const totalVolume = MOCK_LISTINGS.reduce((sum, l) => sum + parseFloat(l.faceValue), 0);
  const avgDiscount = MOCK_LISTINGS.reduce((sum, l) => sum + l.discount, 0) / MOCK_LISTINGS.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-white text-lg">Vaultstone</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-sm mb-4">
              <TrendingUp className="w-4 h-4" />
              Invoice Factoring Marketplace
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Get Paid Today, Not in 90 Days
            </h1>
            <p className="text-zinc-400 max-w-2xl">
              Sell your invoices at a discount for immediate cash, or invest in verified invoices 
              to earn yield. All secured by NFTs on Polkadot Hub.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Listed"
              value={`${totalVolume.toLocaleString()} PAS`}
            />
            <StatCard
              icon={<Percent className="w-5 h-5" />}
              label="Avg. Discount"
              value={`${avgDiscount.toFixed(1)}%`}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Active Listings"
              value={MOCK_LISTINGS.length.toString()}
            />
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              label="AI Verified"
              value="100%"
            />
          </div>

          {/* How it Works */}
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-8">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-500" />
              How Invoice Factoring Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-zinc-800 mb-2">01</div>
                <p className="text-sm font-medium text-white">List Your Invoice</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Set a discount (e.g., 5%) and list your invoice NFT. AI analyzes risk to help price it.
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-800 mb-2">02</div>
                <p className="text-sm font-medium text-white">Get Immediate Cash</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Investors buy your invoice. You receive funds instantly minus the discount.
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-800 mb-2">03</div>
                <p className="text-sm font-medium text-white">Investor Gets Paid</p>
                <p className="text-xs text-zinc-500 mt-1">
                  When the debtor pays, the investor (now NFT owner) receives the full amount.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button
              onClick={() => setShowListModal(true)}
              className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              List Invoice for Sale
            </button>
            <Link
              href="/ai"
              className="flex-1 py-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              AI Risk Analysis
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Filter:</span>
              {(["all", "low", "medium", "high"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === f
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {f === "all" ? "All" : `${f.charAt(0).toUpperCase() + f.slice(1)} Risk`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-zinc-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="discount">Highest Discount</option>
                <option value="amount">Highest Amount</option>
                <option value="due">Soonest Due</option>
              </select>
            </div>
          </div>

          {/* Listings */}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.invoiceId}
                listing={listing}
                onSelect={() => setSelectedListing(listing)}
              />
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
              <p className="text-zinc-400">No listings match your filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Purchase Modal */}
      {selectedListing && (
        <PurchaseModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}

      {/* List Modal */}
      {showListModal && (
        <ListInvoiceModal onClose={() => setShowListModal(false)} />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function ListingCard({ 
  listing, 
  onSelect 
}: { 
  listing: typeof MOCK_LISTINGS[0]; 
  onSelect: () => void;
}) {
  const profit = parseFloat(listing.faceValue) - parseFloat(listing.askingPrice);
  const annualizedReturn = (listing.discount / listing.daysUntilDue) * 365;

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Main Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-semibold text-white">
              {parseFloat(listing.faceValue).toLocaleString()} PAS
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              listing.riskLevel === "low" ? "bg-emerald-500/20 text-emerald-400" :
              listing.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              {listing.riskLevel} risk
            </span>
            {listing.aiVerified && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Verified
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">{listing.description}</p>
          <p className="text-xs text-zinc-500 mt-1">
            Seller: {listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}
          </p>
        </div>

        {/* Metrics */}
        <div className="flex gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-xs text-zinc-500">Discount</p>
            <p className="text-lg font-bold text-emerald-500">{listing.discount}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Your Profit</p>
            <p className="text-lg font-bold text-white">{profit} PAS</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">APY</p>
            <p className="text-lg font-bold text-emerald-500">{annualizedReturn.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Due In</p>
            <p className="text-lg font-bold text-white">{listing.daysUntilDue}d</p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onSelect}
          className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 flex items-center gap-2 transition-colors"
        >
          Buy for {parseFloat(listing.askingPrice).toLocaleString()} PAS
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PurchaseModal({ 
  listing, 
  onClose 
}: { 
  listing: typeof MOCK_LISTINGS[0]; 
  onClose: () => void;
}) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    // Simulate purchase
    await new Promise(r => setTimeout(r, 2000));
    setIsSuccess(true);
  };

  const profit = parseFloat(listing.faceValue) - parseFloat(listing.askingPrice);
  const annualizedReturn = (listing.discount / listing.daysUntilDue) * 365;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl">
        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Purchase Complete!</h3>
            <p className="text-zinc-400 mb-6">
              You now own Invoice #{listing.invoiceId}. When the debtor pays, you'll receive{" "}
              <strong className="text-white">{listing.faceValue} PAS</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">Purchase Invoice</h3>
              <p className="text-sm text-zinc-400">Review the details before purchasing</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-zinc-950 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Face Value</span>
                  <span className="text-white font-medium">{listing.faceValue} PAS</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Your Cost</span>
                  <span className="text-white font-medium">{listing.askingPrice} PAS</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Your Profit</span>
                  <span className="text-emerald-500 font-medium">+{profit} PAS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Annualized Return</span>
                  <span className="text-emerald-500 font-medium">{annualizedReturn.toFixed(0)}% APY</span>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium">Risk Disclosure</p>
                    <p className="text-xs text-yellow-400/80 mt-1">
                      Invoice factoring carries risk. The debtor may not pay on time or at all. 
                      AI risk score: {listing.riskScore}/100 ({listing.riskLevel}).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Purchase Invoice</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListInvoiceModal({ onClose }: { onClose: () => void }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [discount, setDiscount] = useState("5");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">List Invoice for Sale</h3>
          <p className="text-sm text-zinc-400">Sell your invoice NFT for immediate cash</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Invoice ID</label>
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Discount (%)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              min="1"
              max="50"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Higher discounts attract buyers faster but reduce your payout.
            </p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-sm text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI will analyze your invoice and suggest optimal pricing
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800"
          >
            Cancel
          </button>
          <Link
            href="/ai"
            className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Get AI Analysis First
          </Link>
        </div>
      </div>
    </div>
  );
}
