"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { GENOME_VAULT_ABI, GENOME_VAULT_ADDRESS, MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/genome-vault";
import {
  Dna, Search, Filter, Brain, Shield, DollarSign, Clock, Eye, Lock,
  Loader2, CheckCircle, ArrowRight, Droplets, Coins, AlertTriangle
} from "lucide-react";

const CATEGORIES = [
  { value: -1, label: "All", icon: "📋" },
  { value: 0, label: "Whole Genome", icon: "🧬" },
  { value: 1, label: "Exome", icon: "🔬" },
  { value: 2, label: "SNP Array", icon: "📊" },
  { value: 3, label: "Microbiome", icon: "🦠" },
  { value: 4, label: "Epigenetic", icon: "🧪" },
  { value: 5, label: "Proteomic", icon: "🧫" },
  { value: 6, label: "Metabolomic", icon: "💉" },
  { value: 7, label: "Clinical Trial", icon: "💊" },
  { value: 8, label: "EHR", icon: "🏥" },
  { value: 9, label: "Imaging", icon: "📷" },
  { value: 10, label: "Other", icon: "📁" },
];

// Demo listings to show (in production these come from events/subgraph)
const DEMO_LISTINGS = [
  { id: 1, category: 0, owner: "0x742d...f44e", price: "25.00", window: "24h", queries: 12, tags: ["european", "male", "age:30-40", "diabetes"], verified: true },
  { id: 2, category: 3, owner: "0x8ba1...BA72", price: "15.00", window: "12h", queries: 8, tags: ["asian", "female", "age:25-35", "gut-health"], verified: true },
  { id: 3, category: 7, owner: "0x1CBd...c9Ec", price: "50.00", window: "48h", queries: 3, tags: ["oncology", "breast-cancer", "stage-2"], verified: true },
  { id: 4, category: 2, owner: "0xde0B...bEEF", price: "10.00", window: "6h", queries: 45, tags: ["african", "male", "age:40-50", "cardiovascular"], verified: false },
  { id: 5, category: 4, owner: "0xAb5...D123", price: "35.00", window: "24h", queries: 6, tags: ["epigenetics", "aging", "telomere-length"], verified: true },
];

export default function ExplorePage() {
  const { address, isConnected } = useAccount();
  const [categoryFilter, setCategoryFilter] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<typeof DEMO_LISTINGS[0] | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState<string | null>(null);

  // USDC Balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // USDC Allowance for GenomeVault
  const { data: usdcAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, GENOME_VAULT_ADDRESS] : undefined,
  });

  const filteredListings = DEMO_LISTINGS
    .filter(l => categoryFilter === -1 || l.category === categoryFilter)
    .filter(l => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return l.tags.some(t => t.toLowerCase().includes(q));
    });

  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    setFaucetResult(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.success) {
        setFaucetResult(`✅ Minted ${data.minted}! New balance: ${data.newBalance}`);
        refetchBalance();
      } else {
        setFaucetResult(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setFaucetResult(`❌ ${e.message}`);
    }
    setFaucetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Genome Vault</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/vault" className="text-sm text-zinc-400 hover:text-white transition-colors">
              My Vault
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header + Faucet */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Explore Genomic Data</h1>
              <p className="text-zinc-400">Browse and purchase access to anonymized genomic datasets</p>
            </div>
            
            {isConnected && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">
                    USDC Balance: <strong className="text-white">{usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"}</strong>
                  </span>
                  <button
                    onClick={handleFaucet}
                    disabled={faucetLoading}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {faucetLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Droplets className="w-4 h-4" />
                    )}
                    Get Test USDC
                  </button>
                </div>
                {faucetResult && (
                  <p className="text-xs text-zinc-400">{faucetResult}</p>
                )}
              </div>
            )}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tag (diabetes, european, oncology...)"
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  categoryFilter === cat.value
                    ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Listings */}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <DatasetCard
                key={listing.id}
                listing={listing}
                onPurchase={() => setSelectedListing(listing)}
              />
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No datasets match your search</p>
            </div>
          )}

          {/* USDC Info */}
          <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-300 font-medium">Payment Token: USDC on Polkadot Hub TestNet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Contract: <code className="text-zinc-400">{MOCK_USDC_ADDRESS}</code>
                  <br />
                  Use the &quot;Get Test USDC&quot; button to mint free test tokens. In production, this would be real USDC via Circle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Purchase Modal */}
      {selectedListing && (
        <PurchaseModal
          listing={selectedListing}
          usdcBalance={usdcBalance as bigint}
          usdcAllowance={usdcAllowance as bigint}
          onClose={() => setSelectedListing(null)}
          onRefresh={refetchBalance}
        />
      )}
    </div>
  );
}

function DatasetCard({ listing, onPurchase }: { listing: typeof DEMO_LISTINGS[0]; onPurchase: () => void }) {
  const cat = CATEGORIES.find(c => c.value === listing.category) || CATEGORIES[0];
  
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-lg font-semibold text-white">{cat.label}</span>
            {listing.verified && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" /> AI Verified
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mb-2">
            Owner: {listing.owner} · {listing.queries} queries sold
          </p>
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-zinc-500">Price/Query</p>
            <p className="text-lg font-bold text-white">${listing.price}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Access</p>
            <p className="text-lg font-bold text-white">{listing.window}</p>
          </div>
          <button
            onClick={onPurchase}
            className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2 transition-colors"
          >
            Purchase
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({ 
  listing, 
  usdcBalance,
  usdcAllowance,
  onClose,
  onRefresh
}: { 
  listing: typeof DEMO_LISTINGS[0]; 
  usdcBalance?: bigint;
  usdcAllowance?: bigint;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [queries, setQueries] = useState(1);
  const [step, setStep] = useState<"review" | "approve" | "purchase" | "success">("review");
  
  const { writeContract: approveUSDC, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const { writeContract: purchaseAccess, data: purchaseTxHash, isPending: isPurchasing } = useWriteContract();
  const { isSuccess: purchaseSuccess } = useWaitForTransactionReceipt({ hash: purchaseTxHash });

  const totalCost = parseFloat(listing.price) * queries;
  const totalCostUnits = parseUnits(totalCost.toFixed(6), 6);
  const hasEnough = usdcBalance ? usdcBalance >= totalCostUnits : false;
  const needsApproval = usdcAllowance ? usdcAllowance < totalCostUnits : true;

  const handleApprove = () => {
    setStep("approve");
    approveUSDC({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [GENOME_VAULT_ADDRESS, maxUint256],
    });
  };

  const handlePurchase = () => {
    setStep("purchase");
    purchaseAccess({
      address: GENOME_VAULT_ADDRESS,
      abi: GENOME_VAULT_ABI,
      functionName: "purchaseAccess",
      args: [BigInt(listing.id), BigInt(queries)],
    });
  };

  if (purchaseSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Access Purchased!</h3>
          <p className="text-zinc-400 mb-4">
            Your access grant is pending AI anonymization. Once processed, you&apos;ll be able to query the data.
          </p>
          <a
            href={`https://blockscout-testnet.polkadot.io/tx/${purchaseTxHash}`}
            target="_blank"
            className="text-emerald-400 hover:text-emerald-300 text-sm block mb-6"
          >
            View on Explorer →
          </a>
          <button onClick={onClose} className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Purchase Data Access</h3>
          <p className="text-sm text-zinc-400">Review and confirm your purchase</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Dataset Info */}
          <div className="p-4 bg-zinc-950 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Dataset</span>
              <span className="text-white">{CATEGORIES.find(c => c.value === listing.category)?.label}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Price per Query</span>
              <span className="text-white">{listing.price} USDC</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Access Window</span>
              <span className="text-white">{listing.window}</span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Number of Queries</label>
            <input
              type="number"
              value={queries}
              onChange={(e) => setQueries(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Total */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex justify-between">
              <span className="text-emerald-400 font-medium">Total Cost</span>
              <span className="text-white font-bold text-lg">{totalCost.toFixed(2)} USDC</span>
            </div>
            <p className="text-xs text-emerald-400/70 mt-1">
              Includes 2.5% platform fee ({(totalCost * 0.025).toFixed(2)} USDC)
            </p>
          </div>

          {/* Balance Warning */}
          {!hasEnough && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">
                Insufficient USDC. You have {usdcBalance ? formatUnits(usdcBalance, 6) : "0"} USDC.
                Use the faucet to get more.
              </p>
            </div>
          )}

          {/* Privacy */}
          <div className="p-3 bg-zinc-800/50 rounded-xl flex items-start gap-2">
            <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400">
              Data will be anonymized by our AI agent before delivery. All identifying information 
              is stripped. The data owner can revoke access at any time.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800">
            Cancel
          </button>
          {needsApproval && !approveSuccess ? (
            <button
              onClick={handleApprove}
              disabled={isApproving || !hasEnough}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isApproving ? "Approving..." : "Approve USDC"}
            </button>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || !hasEnough}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              {isPurchasing ? "Processing..." : `Purchase (${totalCost.toFixed(2)} USDC)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
