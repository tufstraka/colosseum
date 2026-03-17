"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { GENOME_VAULT_ABI, GENOME_VAULT_ADDRESS } from "@/lib/contracts/genome-vault";
import {
  Dna, Upload, Database, DollarSign, Shield, Clock, Tag, ArrowRight,
  Loader2, CheckCircle, AlertTriangle, Eye, Lock, Brain, Plus, TrendingUp
} from "lucide-react";

const DATA_CATEGORIES = [
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

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"overview" | "list" | "earnings">("overview");
  
  // Read user's listings
  const { data: listingIds } = useReadContract({
    address: GENOME_VAULT_ADDRESS,
    abi: GENOME_VAULT_ABI,
    functionName: "getOwnerListingIds",
    args: address ? [address] : undefined,
  });

  // Read stats
  const { data: totalListings } = useReadContract({
    address: GENOME_VAULT_ADDRESS,
    abi: GENOME_VAULT_ABI,
    functionName: "totalListings",
  });

  const { data: totalQueries } = useReadContract({
    address: GENOME_VAULT_ADDRESS,
    abi: GENOME_VAULT_ABI,
    functionName: "totalQueriesSold",
  });

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
            <Link href="/vault/explore" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Explore Data
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {!isConnected ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Dna className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Connect your wallet to list your genomic data, view earnings, or purchase access as a researcher.
              </p>
              <ConnectButton />
            </div>
          ) : (
            <>
              {/* Welcome */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Your Genome Vault</h1>
                <p className="text-zinc-400">
                  Manage your data listings, track earnings, and control access.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={<Database className="w-5 h-5" />}
                  label="Your Listings"
                  value={(listingIds as bigint[])?.length?.toString() || "0"}
                />
                <StatCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Total Earnings"
                  value="0 USDC"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Platform Listings"
                  value={totalListings?.toString() || "0"}
                />
                <StatCard
                  icon={<Eye className="w-5 h-5" />}
                  label="Queries Sold"
                  value={totalQueries?.toString() || "0"}
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-8">
                {(["overview", "list", "earnings"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {tab === "overview" ? "Overview" : tab === "list" ? "List Data" : "Earnings"}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && <OverviewTab listingIds={listingIds as bigint[]} />}
              {activeTab === "list" && <ListDataTab />}
              {activeTab === "earnings" && <EarningsTab listingIds={listingIds as bigint[]} />}
            </>
          )}
        </div>
      </main>
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

function OverviewTab({ listingIds }: { listingIds?: bigint[] }) {
  if (!listingIds || listingIds.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <Database className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Listed Yet</h3>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Upload and list your genomic data to start earning. You control the price, access duration, and can revoke consent anytime.
        </p>
        <p className="text-sm text-zinc-500">Switch to the &quot;List Data&quot; tab to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listingIds.map((id) => (
        <ListingRow key={id.toString()} listingId={id} />
      ))}
    </div>
  );
}

function ListingRow({ listingId }: { listingId: bigint }) {
  const { data } = useReadContract({
    address: GENOME_VAULT_ADDRESS,
    abi: GENOME_VAULT_ABI,
    functionName: "getListing",
    args: [listingId],
  });

  if (!data) return null;

  const [owner, , , category, pricePerQuery, accessWindow, totalQueries, totalEarnings, isActive] = data as unknown as any[];
  const cat = DATA_CATEGORIES[Number(category)] || DATA_CATEGORIES[10];

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-3xl">{cat.icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{cat.label}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {isActive ? "Active" : "Paused"}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Listing #{listingId.toString()} · {Number(totalQueries)} queries sold
          </p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-sm text-zinc-400">Price/Query</p>
          <p className="font-semibold text-white">{formatUnits(pricePerQuery, 6)} USDC</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400">Earned</p>
          <p className="font-semibold text-emerald-500">{formatUnits(totalEarnings, 6)} USDC</p>
        </div>
      </div>
    </div>
  );
}

function ListDataTab() {
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [ipfsHash, setIpfsHash] = useState("");
  const [metadataHash, setMetadataHash] = useState("");
  const [category, setCategory] = useState(0);
  const [price, setPrice] = useState("10");
  const [accessHours, setAccessHours] = useState("24");
  const [tags, setTags] = useState("");

  const handleList = () => {
    const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);
    const priceInUnits = parseUnits(price, 6); // USDC has 6 decimals
    const accessSeconds = BigInt(Number(accessHours) * 3600);

    writeContract({
      address: GENOME_VAULT_ADDRESS,
      abi: GENOME_VAULT_ABI,
      functionName: "listData",
      args: [
        ipfsHash || "QmDemoEncryptedGenomicData_" + Date.now(),
        metadataHash || "QmDemoMetadata_" + Date.now(),
        category,
        priceInUnits,
        accessSeconds,
        tagArray,
      ],
    });
  };

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Data Listed Successfully!</h3>
        <p className="text-zinc-400 mb-6">Your genomic data is now available for researchers to purchase access.</p>
        <a
          href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`}
          target="_blank"
          className="text-emerald-400 hover:text-emerald-300 text-sm"
        >
          View on Explorer →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">Data Category</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {DATA_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl text-center transition-colors ${
                  category === cat.value
                    ? "bg-emerald-500/20 border border-emerald-500/50 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-lg mb-1">{cat.icon}</div>
                <div className="text-xs">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* IPFS Hash */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Encrypted Data (IPFS Hash)
          </label>
          <input
            type="text"
            value={ipfsHash}
            onChange={(e) => setIpfsHash(e.target.value)}
            placeholder="QmYourEncryptedGenomicDataHash..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Upload your encrypted genomic file to IPFS first. Leave blank for demo.
          </p>
        </div>

        {/* Metadata Hash */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Public Metadata (IPFS Hash)
          </label>
          <input
            type="text"
            value={metadataHash}
            onChange={(e) => setMetadataHash(e.target.value)}
            placeholder="QmPublicMetadataHash..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Non-identifying metadata (age range, ethnicity, conditions). Leave blank for demo.
          </p>
        </div>

        {/* Price & Access */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Price Per Query (USDC)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Access Window (Hours)
            </label>
            <input
              type="number"
              value={accessHours}
              onChange={(e) => setAccessHours(e.target.value)}
              min="1"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="diabetes, european, male, age:30-40"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Privacy Protected</p>
              <p className="text-xs text-emerald-400/70 mt-1">
                Your data is encrypted before upload. When researchers purchase access, our AI anonymization 
                layer strips all identifying information before releasing the data. You can revoke consent anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleList}
          disabled={isPending}
          className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Transaction...</>
          ) : (
            <><Upload className="w-5 h-5" /> List Data on Genome Vault</>
          )}
        </button>
      </div>
    </div>
  );
}

function EarningsTab({ listingIds }: { listingIds?: bigint[] }) {
  if (!listingIds || listingIds.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Earnings Yet</h3>
        <p className="text-zinc-400">List your genomic data to start earning from researchers.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Earnings Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-zinc-400">Total Earned</p>
            <p className="text-2xl font-bold text-emerald-500">0 USDC</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Queries Sold</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Active Listings</p>
            <p className="text-2xl font-bold text-white">{listingIds.length}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            Payments go directly to your wallet via smart contract. 97.5% of each payment is yours (2.5% platform fee).
          </p>
        </div>
      </div>
    </div>
  );
}
