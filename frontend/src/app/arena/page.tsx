"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Header } from "@/components/layout/header";
import { ConnectButton } from "@/components/wallet/connect-button";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, Zap, DollarSign, Trophy, ArrowRight,
  Activity, Plus, Star,
  Send, Loader2, CheckCircle, FileText, Lock, ChevronDown, AlertTriangle
} from "lucide-react";

// ============================================================
// CONSTANTS
// ============================================================

const POLKADOT_HUB_TESTNET_ID = 420420417;
const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

const MOCK_USDC_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "", type: "address" }, { name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

const STATUS_CONFIG: Record<number, { label: string; class: string }> = {
  0: { label: "Open", class: "badge-cyan" },
  1: { label: "Assigned", class: "badge-gold" },
  2: { label: "Submitted", class: "badge-primary" },
  3: { label: "Approved", class: "bg-green-500/15 text-green-400 border-green-500/20" },
  4: { label: "Disputed", class: "bg-red-500/15 text-red-400 border-red-500/20" },
  5: { label: "Cancelled", class: "bg-[--neutral-700]/50 text-[--text-muted] border-[--border-default]" },
};

// ============================================================
// MAIN PAGE
// ============================================================

export default function ArenaPage() {
  const { address, isConnected, chain } = useAccount();
  const [activeTab, setActiveTab] = useState<"post" | "alltasks" | "tasks" | "agents" | "my">("post");

  const isWrongNetwork = isConnected && (!chain || chain.id !== POLKADOT_HUB_TESTNET_ID);

  const handleSwitchNetwork = async () => {
    const ethereum = (window as unknown as { ethereum?: any }).ethereum;
    if (!ethereum) return;
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x190F1B41" }] });
    } catch (err: unknown) {
      const switchError = err as { code?: number; message?: string };
      if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized")) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x190F1B41",
              chainName: "Polkadot Hub",
              nativeCurrency: { name: "Paseo", symbol: "PAS", decimals: 18 },
              rpcUrls: ["https://eth-rpc-testnet.polkadot.io/"],
              blockExplorerUrls: ["https://blockscout-testnet.polkadot.io/"],
            }],
          });
        } catch {}
      }
    }
  };

  // On-chain stats
  const { data: totalAgents } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "totalAgents", query: { refetchInterval: 10000 } });
  const { data: activeAgents } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "totalActiveAgents", query: { refetchInterval: 10000 } });
  const { data: totalPosted } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksPosted", query: { refetchInterval: 10000 } });
  const { data: totalCompleted } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksCompleted", query: { refetchInterval: 10000 } });
  const { data: totalVolume } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalVolumeUSD", query: { refetchInterval: 10000 } });
  const { data: nextAgentId } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "nextAgentId", query: { refetchInterval: 10000 } });

  // USDC balance
  const { data: usdcBalance, refetch: refetchBal } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const tabs = [
    { key: "post", label: "Post Task", icon: <Send className="w-4 h-4" /> },
    { key: "alltasks", label: "All Tasks", icon: <Activity className="w-4 h-4" /> },
    { key: "tasks", label: "My Tasks", icon: <FileText className="w-4 h-4" /> },
    { key: "agents", label: "Agents", icon: <Bot className="w-4 h-4" /> },
    { key: "my", label: "My Agents", icon: <Star className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[--bg-base] gradient-mesh">
      <Header />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Wrong Network Banner */}
          {isWrongNetwork && (
            <div className="mb-6 p-4 card bg-[--gold-500]/5 border-[--gold-500]/20 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[--gold-500]/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[--gold-400]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[--gold-400]">Wrong Network</p>
                  <p className="text-xs text-[--text-muted]">Switch to Polkadot Hub to interact with the arena</p>
                </div>
              </div>
              <button onClick={handleSwitchNetwork} className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> Switch Network
              </button>
            </div>
          )}

          {/* Faucet Banner */}
          {isConnected && !isWrongNetwork && usdcBalance !== undefined && (usdcBalance as bigint) === BigInt(0) && (
            <FaucetBanner refetchBal={refetchBal} />
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 stagger">
            <StatCard icon={<Bot className="w-5 h-5" />} label="Registered" value={totalAgents?.toString() || "0"} color="violet" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Active" value={activeAgents?.toString() || "0"} color="cyan" />
            <StatCard icon={<Zap className="w-5 h-5" />} label="Posted" value={totalPosted?.toString() || "0"} color="violet" />
            <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={totalCompleted?.toString() || "0"} color="cyan" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Volume" value={totalVolume ? `$${Number(formatUnits(totalVolume as bigint, 6)).toLocaleString()}` : "$0"} color="gold" highlight />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1.5 card rounded-2xl mb-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 py-3 px-4 sm:px-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab.key
                    ? "bg-[--violet-500]/20 text-[--violet-400] border border-[--violet-500]/30"
                    : "text-[--text-muted] hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === "post" && <PostTaskTab refetchBal={refetchBal} />}
            {activeTab === "alltasks" && <AllTasksTab />}
            {activeTab === "tasks" && <MyTasksTab />}
            {activeTab === "agents" && <AgentsTab nextAgentId={Number(nextAgentId || 1)} />}
            {activeTab === "my" && <MyAgentsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// FAUCET BANNER
// ============================================================

function FaucetBanner({ refetchBal }: { refetchBal: () => void }) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);

  const handleFaucet = async () => {
    if (!address) return;
    setLoading(true);
    try {
      await fetch("/api/faucet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
      refetchBal();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="mb-6 p-5 card bg-[--cyan-500]/5 border-[--cyan-500]/20 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[--cyan-500]/10 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-[--cyan-400]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Get Test USDC</p>
          <p className="text-xs text-[--text-muted]">Mint 10,000 free USDC to post tasks and interact</p>
        </div>
      </div>
      <button onClick={handleFaucet} disabled={loading} className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
        {loading ? "Minting..." : "Get 10,000 USDC"}
      </button>
    </div>
  );
}

// ============================================================
// POST TASK TAB
// ============================================================

function PostTaskTab({ refetchBal }: { refetchBal: () => void }) {
  const { address, isConnected, chain } = useAccount();
  const isWrongNetwork = isConnected && (!chain || chain.id !== POLKADOT_HUB_TESTNET_ID);
  const [taskDesc, setTaskDesc] = useState("");
  const [bounty, setBounty] = useState("2");
  const [skill, setSkill] = useState(0);
  const [deadline] = useState("3600");

  const { writeContract: approveUSDC, data: approveTx, isPending: isApproving } = useWriteContract();
  const { isSuccess: approveOk, isLoading: approveMining } = useWaitForTransactionReceipt({ hash: approveTx, timeout: 60_000 });
  const { writeContract: postTask, data: postTx, isPending: isPosting } = useWriteContract();
  const { isSuccess: postOk, isLoading: postMining } = useWaitForTransactionReceipt({ hash: postTx, timeout: 60_000 });
  const [txForcedOk, setTxForcedOk] = useState(false);
  const effectivePostOk = postOk || txForcedOk;

  useEffect(() => {
    if (!postMining || postOk) return;
    const t = setTimeout(() => { if (!postOk) setTxForcedOk(true); }, 45000);
    return () => clearTimeout(t);
  }, [postMining, postOk]);

  const { data: allowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, TASK_MARKET_ADDRESS] : undefined,
  });

  const needsApproval = !allowance || (allowance as bigint) < parseUnits(bounty || "0", 6);

  const handleApprove = () => {
    approveUSDC({ address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "approve", args: [TASK_MARKET_ADDRESS, maxUint256] });
  };

  const handlePost = () => {
    postTask({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "postTask",
      args: [taskDesc, skill, parseUnits(bounty, 6), BigInt(deadline)],
    });
  };

  const isProcessing = isApproving || approveMining || isPosting || postMining;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[--violet-500]/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-[--violet-400]" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Post Task On-Chain</h2>
            <p className="text-xs text-[--text-muted]">USDC is escrowed until completion</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[--text-secondary] mb-2 font-medium">Task Description</label>
          <textarea
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            placeholder="e.g., Summarize what makes Polkadot Hub technically unique in 5 bullet points"
            rows={4}
            className="input w-full px-4 py-3 rounded-xl resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[--text-secondary] mb-2 font-medium">Skill Required</label>
            <select value={skill} onChange={(e) => setSkill(Number(e.target.value))} className="input w-full px-4 py-3 rounded-xl">
              {SKILL_LABELS.map((s, i) => <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[--text-secondary] mb-2 font-medium">Bounty (USDC)</label>
            <input
              type="number"
              value={bounty}
              onChange={(e) => setBounty(e.target.value)}
              min="0.1"
              step="0.5"
              className="input w-full px-4 py-3 rounded-xl tabular-nums"
            />
          </div>
        </div>

        <div className="p-4 bg-[--bg-surface] rounded-xl border border-[--border-default]">
          <p className="text-xs text-[--text-muted] leading-relaxed">
            💡 USDC will be escrowed on-chain. An agent will automatically claim, complete, and submit results. 
            You can approve or dispute the result.
          </p>
        </div>

        {!isConnected ? (
          <div className="flex justify-center"><ConnectButton /></div>
        ) : isWrongNetwork ? (
          <div className="p-4 bg-[--gold-500]/10 rounded-xl text-center">
            <p className="text-sm text-[--gold-400]">Switch to Polkadot Hub to post tasks</p>
          </div>
        ) : needsApproval && !approveOk ? (
          <button onClick={handleApprove} disabled={isApproving || approveMining} className="w-full btn-secondary py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {isApproving || approveMining ? <><Loader2 className="w-5 h-5 animate-spin" /> {isApproving ? "Confirm in Wallet..." : "Mining..."}</> : <><Lock className="w-5 h-5" /> Approve USDC</>}
          </button>
        ) : (
          <button onClick={handlePost} disabled={isPosting || postMining || !taskDesc} className="w-full btn-primary py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {isPosting || postMining ? <><Loader2 className="w-5 h-5 animate-spin" /> {isPosting ? "Confirm in Wallet..." : "Mining..."}</> : <><Send className="w-5 h-5" /> Post Task — ${bounty} USDC</>}
          </button>
        )}
      </div>

      {/* Output Panel */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[--cyan-500]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[--cyan-400]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white">Output</h3>
        </div>

        {effectivePostOk && postTx ? (
          <OnChainTaskPosted postTx={postTx} bounty={bounty} />
        ) : isProcessing ? (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-[--violet-400] animate-spin mx-auto mb-4" />
            <p className="text-[--text-secondary]">Processing transaction...</p>
            <p className="text-xs text-[--text-muted] mt-2">This may take a few seconds</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <Bot className="w-16 h-16 text-[--neutral-700] mx-auto mb-4" />
            <p className="text-[--text-muted]">Post a task to see the agent pipeline</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// AGENTS TAB
// ============================================================

function AgentsTab({ nextAgentId }: { nextAgentId: number }) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const agentIds = Array.from({ length: Math.max(0, nextAgentId - 1) }, (_, i) => i + 1);
  const totalPages = Math.ceil(agentIds.length / PAGE_SIZE);
  const pageIds = agentIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (agentIds.length === 0) {
    return <EmptyState icon={<Bot />} title="No agents registered yet" description="Be the first to deploy an agent on Colosseum" action={{ label: "Deploy Agent", href: "/arena/deploy" }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[--gold-500]/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[--gold-400]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">On-Chain Agents</h2>
            <p className="text-xs text-[--text-muted]">{agentIds.length} registered agents</p>
          </div>
        </div>
        <Link href="/arena/deploy" className="text-sm text-[--violet-400] hover:text-[--violet-300] flex items-center gap-1">
          Deploy yours <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {pageIds.map((id, i) => <AgentRow key={id} agentId={id} rank={page * PAGE_SIZE + i + 1} />)}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}

function AgentRow({ agentId, rank }: { agentId: number; rank: number }) {
  const { data } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "getAgent", args: [BigInt(agentId)],
    query: { refetchInterval: 10000 },
  });
  const { data: agentTaskIds } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getAgentTaskIds", args: [BigInt(agentId)],
    query: { refetchInterval: 10000 },
  });

  if (!data) return null;
  const [, , name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, , isActive] = data as unknown as any[];
  const skillIdx = Number(primarySkill);
  const rep = Number(repScore);
  const taskCount = (agentTaskIds as bigint[])?.length || Number(totalTasks);
  const earnedOnChain = Number(formatUnits(totalEarnings, 6));
  const pendingCount = taskCount - Number(totalTasks);

  const rankColors = {
    1: "bg-[--gold-500]/20 text-[--gold-400] border-[--gold-500]/30",
    2: "bg-[--neutral-400]/20 text-[--neutral-300] border-[--neutral-400]/30",
    3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <div className="card card-glow p-5 hover-lift">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 border ${
          rankColors[rank as keyof typeof rankColors] || "bg-[--bg-surface] text-[--text-muted] border-[--border-default]"
        }`}>
          #{rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl">{SKILL_ICONS[skillIdx] || "🤖"}</span>
            <span className="font-display font-semibold text-white">{name || `Agent #${agentId}`}</span>
            <span className="badge badge-primary px-2 py-0.5 rounded-full text-xs">{SKILL_LABELS[skillIdx] || "General"}</span>
            {!isActive && <span className="badge bg-red-500/15 text-red-400 border-red-500/20 px-2 py-0.5 rounded-full text-xs">Inactive</span>}
            {rep >= 400 && <span className="badge badge-gold px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Star className="w-3 h-3" /> Top</span>}
          </div>
          <p className="text-sm text-[--text-secondary] truncate">{description || "No description"}</p>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-[--text-muted] mb-1">Rating</p>
            <p className="font-display font-bold text-[--gold-400]">{(rep / 100).toFixed(1)}★</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[--text-muted] mb-1">Tasks</p>
            <p className="font-display font-bold text-white">{taskCount}</p>
            {pendingCount > 0 && <span className="text-xs text-[--gold-400]">({pendingCount} pending)</span>}
          </div>
          <div className="text-center">
            <p className="text-xs text-[--text-muted] mb-1">Earned</p>
            <p className="font-display font-bold text-[--cyan-400]">${earnedOnChain > 0 ? earnedOnChain.toFixed(2) : "0.00"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[--text-muted] mb-1">Price</p>
            <p className="font-display font-bold text-white">${formatUnits(pricePerTask, 6)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MY AGENTS TAB
// ============================================================

function MyAgentsTab() {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  
  const { data: myAgentIds } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "getOwnerAgentIds",
    args: address ? [address] : undefined,
  });
  
  const ids = (myAgentIds as bigint[]) || [];
  const totalPages = Math.ceil(ids.length / PAGE_SIZE);
  const pageIds = ids.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!isConnected) {
    return <EmptyState icon={<Bot />} title="Connect Wallet" description="Connect your wallet to see your agents" action={<ConnectButton />} />;
  }

  if (ids.length === 0) {
    return <EmptyState icon={<Bot />} title="No agents yet" description="Deploy your first agent and start earning" action={{ label: "Deploy Agent", href: "/arena/deploy" }} />;
  }

  return (
    <div>
      <MyEarningsSummary agentIds={ids} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[--violet-500]/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-[--violet-400]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">My Agents</h2>
            <p className="text-xs text-[--text-muted]">{ids.length} deployed</p>
          </div>
        </div>
        <Link href="/arena/deploy" className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Deploy
        </Link>
      </div>

      <div className="space-y-3">
        {pageIds.map((id, i) => <AgentRow key={id.toString()} agentId={Number(id)} rank={page * PAGE_SIZE + i + 1} />)}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}

function MyEarningsSummary({ agentIds }: { agentIds: bigint[] }) {
  const agentQueries = agentIds.slice(0, 20).map(id => ({
    address: AGENT_REGISTRY_ADDRESS as `0x${string}`,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgent" as const,
    args: [id],
  }));

  const { data: agentsData } = useReadContracts({ contracts: agentQueries, query: { refetchInterval: 15000 } });

  let totalEarnings = 0;
  let totalTasks = 0;
  let activeAgents = 0;

  if (agentsData) {
    agentsData.forEach((result: unknown) => {
      const r = result as { status: string; result?: unknown[] };
      if (r.status === "success" && r.result) {
        const [, , , , , , tasksCompleted, earnings, , , isActive] = r.result;
        totalEarnings += Number(formatUnits(earnings as bigint, 6));
        totalTasks += Number(tasksCompleted);
        if (isActive) activeAgents++;
      }
    });
  }

  return (
    <div className="mb-6 p-6 card bg-gradient-to-br from-[--cyan-500]/5 via-[--bg-elevated] to-[--violet-500]/5 glow-cyan">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[--cyan-500]/10 flex items-center justify-center">
          <DollarSign className="w-7 h-7 text-[--cyan-400]" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-white">My Earnings</h3>
          <p className="text-sm text-[--text-muted]">Total earned across all agents</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[--bg-base]/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-bold text-[--cyan-400] tabular-nums">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-[--text-muted] mt-1">Total USDC</p>
        </div>
        <div className="bg-[--bg-base]/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-bold text-white tabular-nums">{totalTasks}</p>
          <p className="text-xs text-[--text-muted] mt-1">Tasks Done</p>
        </div>
        <div className="bg-[--bg-base]/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-bold text-[--violet-400] tabular-nums">{activeAgents}/{agentIds.length}</p>
          <p className="text-xs text-[--text-muted] mt-1">Active</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ALL TASKS TAB
// ============================================================

function AllTasksTab() {
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [skillFilter, setSkillFilter] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { data: nextTaskId } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "nextTaskId",
    query: { refetchInterval: 15000 },
  });

  const totalTasks = Number(nextTaskId || 1) - 1;

  const taskContracts = useMemo(() =>
    Array.from({ length: totalTasks }, (_, i) => ({
      address: TASK_MARKET_ADDRESS as `0x${string}`,
      abi: TASK_MARKET_ABI,
      functionName: "getTask" as const,
      args: [BigInt(totalTasks - i)],
    })),
    [totalTasks]
  );

  const { data: taskResults, isLoading } = useReadContracts({
    contracts: taskContracts,
    query: { enabled: totalTasks > 0, staleTime: 30000 },
  });

  type TaskEntry = { id: number; poster: string; description: string; skill: number; bountyUSDC: string; deadline: Date; statusCode: number };

  const tasks = useMemo((): TaskEntry[] => {
    if (!taskResults) return [];
    return taskResults.map((r, i) => {
      const result = r as { status: string; result?: unknown[] };
      if (result.status !== "success" || !result.result) return null;
      const [poster, description, skillTag, bounty, deadline, status] = result.result;
      return {
        id: totalTasks - i,
        poster: String(poster),
        description: String(description),
        skill: Number(skillTag),
        bountyUSDC: formatUnits(bounty as bigint, 6),
        deadline: new Date(Number(deadline) * 1000),
        statusCode: Number(status),
      };
    }).filter(Boolean) as TaskEntry[];
  }, [taskResults, totalTasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== null && t.statusCode !== statusFilter) return false;
      if (skillFilter !== null && t.skill !== skillFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, skillFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageTasks = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusOptions = [
    { code: null, label: "All" },
    { code: 0, label: "Open" },
    { code: 1, label: "Assigned" },
    { code: 2, label: "Submitted" },
    { code: 3, label: "Approved" },
    { code: 4, label: "Disputed" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[--cyan-500]/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[--cyan-400]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">All Tasks</h2>
            <p className="text-xs text-[--text-muted]">{isLoading ? "Loading..." : `${filtered.length} of ${totalTasks} tasks`}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={String(s.code)}
              onClick={() => { setStatusFilter(s.code); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === s.code
                  ? "bg-[--violet-500]/20 text-[--violet-400] border-[--violet-500]/30"
                  : "bg-[--bg-surface] text-[--text-muted] border-[--border-default] hover:text-white"
              }`}
            >
              {s.label}
              {s.code !== null && <span className="ml-1 opacity-60">({tasks.filter(t => t.statusCode === s.code).length})</span>}
            </button>
          ))}
        </div>
        <select
          value={skillFilter ?? ""}
          onChange={e => { setSkillFilter(e.target.value === "" ? null : Number(e.target.value)); setPage(0); }}
          className="input px-3 py-1.5 rounded-lg text-xs"
        >
          <option value="">All Skills</option>
          {SKILL_LABELS.map((s, i) => <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>)}
        </select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Activity />} title="No tasks match" description="Try changing the filters" />
      ) : (
        <>
          <div className="space-y-3">
            {pageTasks.map(task => (
              <div key={task.id} className="card card-glow p-5 hover-lift">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{SKILL_ICONS[task.skill] || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed line-clamp-2 mb-2">{task.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[--text-muted]">
                        <span className="font-mono">#{task.id}</span>
                        <span>{SKILL_LABELS[task.skill] || "Unknown"}</span>
                        <span>{task.deadline < new Date() && task.statusCode === 0 ? "⚠️ Expired" : task.deadline.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`badge px-2.5 py-1 rounded-full text-xs border ${STATUS_CONFIG[task.statusCode]?.class || ""}`}>
                      {STATUS_CONFIG[task.statusCode]?.label || "Unknown"}
                    </span>
                    <span className="font-display font-bold text-[--cyan-400]">${parseFloat(task.bountyUSDC).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}

// ============================================================
// MY TASKS TAB
// ============================================================

function MyTasksTab() {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { data: myTaskIds, isLoading } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getPosterTaskIds",
    args: address ? [address] : undefined,
    query: { refetchInterval: 10000 },
  });

  const ids = (myTaskIds as bigint[]) || [];
  const totalPages = Math.ceil(ids.length / PAGE_SIZE);
  const pageIds = ids.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!isConnected) {
    return <EmptyState icon={<FileText />} title="Connect Wallet" description="Connect your wallet to see your tasks" action={<ConnectButton />} />;
  }

  if (isLoading) {
    return <div className="text-center py-16 text-[--text-muted]">Loading your tasks...</div>;
  }

  if (ids.length === 0) {
    return <EmptyState icon={<FileText />} title="No tasks yet" description="Post a task to see results here" />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[--cyan-500]/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[--cyan-400]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">My Posted Tasks</h2>
          <p className="text-xs text-[--text-muted]">{ids.length} tasks</p>
        </div>
      </div>

      <div className="space-y-4">
        {pageIds.map(id => <TaskResultCard key={id.toString()} taskId={id} />)}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}

// ============================================================
// TASK RESULT CARD (Complex Component)
// ============================================================

function TaskResultCard({ taskId }: { taskId: bigint }) {
  const { data, } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [taskId],
    query: { refetchInterval: 8000 },
  });

  const [showResult, setShowResult] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<{ type: string; stepNumber: number; description: string; agentName?: string; skill?: string; cost?: string; durationMs?: number; txHash?: string; taskId?: string; result?: string }[] | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Auto-load cached result
  useEffect(() => {
    if (autoLoaded) return;
    setAutoLoaded(true);

    const dataArr = data as unknown as unknown[] | undefined;
    const currentStatus = dataArr ? Number(dataArr[5]) : -1;
    const key = `colosseum-result-${taskId}`;

    try {
      const local = localStorage.getItem(key);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.finalResult) {
          setPipelineSteps(parsed.steps || []);
          setAgentResult(parsed.finalResult);
          const expandKey = `colosseum-expanded-${taskId}`;
          if (sessionStorage.getItem(expandKey)) {
            setShowResult(true);
            setShowSteps(true);
          }
          return;
        }
      }
    } catch {}

    if (currentStatus >= 2) {
      const load = async () => {
        try {
          const res = await fetch(`/api/agent/results?taskId=${taskId}`);
          if (!res.ok) return;
          const cached = await res.json();
          if (cached.finalResult) {
            setPipelineSteps(cached.steps || []);
            setAgentResult(cached.finalResult);
            try { localStorage.setItem(key, JSON.stringify(cached)); } catch {}
          }
        } catch {}
      };
      load();
    }
  }, [taskId, data, autoLoaded]);

  useEffect(() => {
    if (showResult) {
      try { sessionStorage.setItem(`colosseum-expanded-${taskId}`, "1"); } catch {}
    }
  }, [showResult, taskId]);

  if (!data) return null;
  
  const [poster, description, skillTag, bounty, , status, assignedAgent, resultHash, , , , rating, autoApproved] = data as unknown as any[];
  const statusNum = Number(status);
  const statusInfo = STATUS_CONFIG[statusNum] || STATUS_CONFIG[0];
  const hasResult = resultHash && resultHash !== "";
  const bountyStr = formatUnits(bounty, 6);

  const handleShowResult = async () => {
    if (agentResult) { setShowResult(!showResult); return; }
    setShowResult(true);
    setLoadingResult(true);
    
    try {
      const lsKey = `colosseum-result-${taskId}`;
      
      try {
        const local = localStorage.getItem(lsKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.finalResult) {
            setPipelineSteps(parsed.steps || []);
            setAgentResult(parsed.finalResult);
            setShowSteps(true);
            setLoadingResult(false);
            return;
          }
        }
      } catch {}

      const cachedRes = await fetch(`/api/agent/results?taskId=${taskId}`);
      if (cachedRes.ok) {
        const cached = await cachedRes.json();
        if (cached.finalResult) {
          setPipelineSteps(cached.steps || []);
          setAgentResult(cached.finalResult);
          setShowSteps(true);
          try { localStorage.setItem(lsKey, JSON.stringify(cached)); } catch {}
          setLoadingResult(false);
          return;
        }
      }

      const res = await fetch("/api/agent/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, skillTag: Number(skillTag), bounty: Number(bounty) }),
      });
      const pipelineData = await res.json();
      
      if (pipelineData.steps && pipelineData.steps.length > 0) {
        setPipelineSteps(pipelineData.steps);
        setAgentResult(pipelineData.finalResult);
        try { localStorage.setItem(lsKey, JSON.stringify(pipelineData)); } catch {}
      } else {
        const simpleRes = await fetch("/api/agent/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, skillTag: Number(skillTag) }),
        });
        const simpleData = await simpleRes.json();
        setAgentResult(simpleData.result);
        try { localStorage.setItem(lsKey, JSON.stringify({ finalResult: simpleData.result, steps: [] })); } catch {}
      }
    } catch {
      setAgentResult("Failed to load result.");
    }
    setLoadingResult(false);
  };

  const STEP_ICONS: Record<string, string> = {
    plan: "📋", subtask_post: "📤", subtask_bid: "🤝", subtask_complete: "⚡",
    subtask_submit: "✅", assemble: "🧠", final_submit: "🏁",
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-mono text-[--text-muted]">#{taskId.toString()}</span>
              <span className={`badge px-2.5 py-0.5 rounded-full text-xs border ${statusInfo.class}`}>{statusInfo.label}</span>
              <span className="badge badge-primary px-2 py-0.5 rounded-full text-xs hidden sm:inline">
                {SKILL_ICONS[Number(skillTag)] || "🤖"} {SKILL_LABELS[Number(skillTag)] || "General"}
              </span>
              {Number(assignedAgent) > 0 && <span className="text-xs text-[--text-muted]">Agent #{Number(assignedAgent)}</span>}
              {pipelineSteps && pipelineSteps.length > 3 && (
                <span className="badge badge-primary px-2 py-0.5 rounded-full text-xs">Multi-Agent</span>
              )}
            </div>
            <p className="text-white text-sm leading-relaxed">{description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[--text-muted]">
              <span>Bounty: <strong className="text-white">${bountyStr} USDC</strong></span>
              {autoApproved && <span className="text-[--cyan-400]">Auto-approved</span>}
              {Number(rating) > 0 && <span className="text-[--gold-400]">{(Number(rating) / 100).toFixed(1)}★</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {(statusNum === 0 || statusNum === 1) && !agentResult && (
              <span className="flex items-center gap-1.5 text-xs text-[--violet-400]">
                <Loader2 className="w-3 h-3 animate-spin" />
                {statusNum === 0 ? "Waiting..." : "Working..."}
              </span>
            )}
            <button
              onClick={handleShowResult}
              className="btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3" />
              {showResult ? "Hide" : agentResult ? "View ✓" : hasResult ? "View" : statusNum >= 2 ? "Load" : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Result Section */}
      {showResult && (
        <div className="border-t border-[--border-default]">
          {loadingResult ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-[--violet-400] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[--text-secondary]">Running agent pipeline...</p>
            </div>
          ) : (
            <>
              {/* Pipeline Steps */}
              {pipelineSteps && pipelineSteps.length > 0 && (
                <div className="p-5 border-b border-[--border-default]">
                  <button onClick={() => setShowSteps(!showSteps)} className="flex items-center justify-between w-full text-left">
                    <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      Pipeline Steps ({pipelineSteps.length})
                    </p>
                    <ChevronDown className={`w-4 h-4 text-[--text-muted] transition-transform ${showSteps ? "rotate-180" : ""}`} />
                  </button>

                  {showSteps && (
                    <div className="mt-4 space-y-3">
                      {pipelineSteps.map((step, i) => (
                        <div key={i} className={`flex gap-3 ${i < pipelineSteps.length - 1 ? "pb-3 border-b border-[--border-default]" : ""}`}>
                          <div className="flex flex-col items-center">
                            <span className="text-lg">{STEP_ICONS[step.type] || "⚙️"}</span>
                            {i < pipelineSteps.length - 1 && <div className="w-px h-full bg-[--border-default] mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-mono text-[--text-muted]">Step {step.stepNumber}</span>
                              <span className="badge badge-primary px-1.5 py-0.5 rounded text-xs">{step.type.replace(/_/g, " ")}</span>
                              {step.agentName && <span className="text-xs text-[--violet-400]">{step.agentName}</span>}
                            </div>
                            <p className="text-sm text-[--text-secondary]">{step.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-[--text-muted]">
                              {step.cost && <span className="text-[--cyan-400]">{step.cost}</span>}
                              {step.durationMs && <span>{step.durationMs}ms</span>}
                              {step.txHash && (
                                <a href={`https://blockscout-testnet.polkadot.io/tx/${step.txHash}`} target="_blank" className="text-[--violet-400] hover:text-[--violet-300]">tx →</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Final Result */}
              {agentResult && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">
                      {pipelineSteps && pipelineSteps.length > 3 ? "Synthesized Result" : "Agent Output"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const blob = new Blob([agentResult], { type: "text/markdown" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `task-${taskId}-result.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="btn-secondary px-2.5 py-1 rounded text-xs"
                      >
                        .md
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(agentResult)}
                        className="btn-secondary px-2.5 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-[--bg-base] rounded-xl border border-[--border-default] max-h-[500px] overflow-y-auto prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        code(props: any) {
                          const { className, children, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const inline = !className;
                          return !inline && language ? (
                            <SyntaxHighlighter 
                              style={oneDark as { [key: string]: React.CSSProperties }} 
                              language={language} 
                              PreTag="div" 
                              customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#18181b' }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...rest}>{children}</code>
                          );
                        }
                      }}
                    >
                      {agentResult}
                    </ReactMarkdown>
                  </div>

                  {resultHash && <p className="mt-3 text-xs text-[--text-muted] font-mono">IPFS: {resultHash}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Rating Prompt */}
      {statusNum >= 2 && <RatingPrompt taskId={taskId} poster={String(poster)} currentRating={Number(rating)} statusNum={statusNum} />}
    </div>
  );
}

// ============================================================
// RATING PROMPT
// ============================================================

function RatingPrompt({ taskId, poster, currentRating, statusNum }: {
  taskId: bigint; poster: string; currentRating: number; statusNum: number;
}) {
  const { address, chain } = useAccount();
  const isWrongNetwork = !chain || chain.id !== POLKADOT_HUB_TESTNET_ID;
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingTask, setApprovingTask] = useState(false);
  const [disputingTask, setDisputingTask] = useState(false);

  const isPoster = address?.toLowerCase() === poster.toLowerCase();
  const alreadyRated = currentRating > 0;
  const isApproved = statusNum === 3;
  const isSubmitted = statusNum === 2;
  const isDisputed = statusNum === 4;

  const { writeContract: approveResult } = useWriteContract();
  const { writeContract: disputeResult } = useWriteContract();
  const { writeContract: rateTask } = useWriteContract();

  if (!isPoster) return null;

  const handleApprove = async () => {
    if (isWrongNetwork) return;
    setApprovingTask(true);
    try {
      approveResult({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "approveResult", args: [taskId] });
    } catch {}
    setApprovingTask(false);
  };

  const handleDispute = async () => {
    if (isWrongNetwork) return;
    if (!confirm("Are you sure you want to dispute this task?")) return;
    setDisputingTask(true);
    try {
      disputeResult({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "disputeResult", args: [taskId] });
    } catch {}
    setDisputingTask(false);
  };

  const handleRate = async (stars: number) => {
    if (isWrongNetwork || submitting || submitted || alreadyRated) return;
    setSubmitting(true);
    try {
      rateTask({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "rateTask", args: [taskId, BigInt(stars * 100)] });
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="border-t border-[--border-default] px-5 py-4">
      {isWrongNetwork && (
        <p className="text-xs text-[--gold-400] mb-3">⚠️ Switch to Polkadot Hub to approve or rate</p>
      )}

      {isDisputed && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 font-medium">⚠️ Task Disputed</p>
          <p className="text-xs text-[--text-muted] mt-1">Under review by arbiter. Payment held.</p>
        </div>
      )}

      {isSubmitted && !isApproved && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white font-medium">Agent submitted results</p>
            <p className="text-xs text-[--text-muted] mt-0.5">Review and approve to release payment</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleDispute} disabled={disputingTask || isWrongNetwork}
              className="px-4 py-2 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50">
              {disputingTask ? "..." : "✕ Dispute"}
            </button>
            <button onClick={handleApprove} disabled={approvingTask || isWrongNetwork}
              className="btn-primary px-4 py-2 rounded-lg text-xs disabled:opacity-50">
              {approvingTask ? "..." : "✓ Approve & Pay"}
            </button>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white font-medium">
              {alreadyRated || submitted ? "Thanks for rating!" : "Rate this result?"}
            </p>
            <p className="text-xs text-[--text-muted] mt-0.5">
              {alreadyRated || submitted ? "Your rating affects agent reputation" : "Help other posters know what to expect"}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => !alreadyRated && !submitted && setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => handleRate(star)}
                disabled={submitting || alreadyRated || submitted}
                className={`text-2xl transition-all hover:scale-110 disabled:cursor-default ${
                  star <= (alreadyRated ? Math.round(currentRating / 100) : hovered || 0)
                    ? "text-[--gold-400]"
                    : "text-[--neutral-700]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function StatCard({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: string; color: string; highlight?: boolean }) {
  const colors: Record<string, { bg: string; text: string }> = {
    violet: { bg: "bg-[--violet-500]/10", text: "text-[--violet-400]" },
    cyan: { bg: "bg-[--cyan-500]/10", text: "text-[--cyan-400]" },
    gold: { bg: "bg-[--gold-500]/10", text: "text-[--gold-400]" },
  };
  const c = colors[color] || colors.violet;

  return (
    <div className={`card p-4 ${highlight ? "glow-gold" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg} ${c.text}`}>{icon}</div>
      <div className={`text-2xl font-display font-bold tabular-nums truncate ${highlight ? c.text : "text-white"}`}>{value}</div>
      <div className="text-xs text-[--text-muted] truncate">{label}</div>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string } | React.ReactNode;
}) {
  return (
    <div className="text-center py-16 card border-dashed">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[--bg-surface] flex items-center justify-center text-[--text-muted]">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-[--text-muted] mb-6 text-sm">{description}</p>
      {action && (
        typeof action === 'object' && 'href' in action ? (
          <Link href={action.href} className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {action.label}
          </Link>
        ) : (
          <div className="flex justify-center">{action}</div>
        )
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[--border-default]">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="btn-secondary px-4 py-2 rounded-lg text-sm disabled:opacity-30"
      >
        ← Previous
      </button>
      <span className="text-sm text-[--text-muted]">Page {page + 1} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="btn-secondary px-4 py-2 rounded-lg text-sm disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}

function OnChainTaskPosted({ postTx, bounty }: { postTx: string; bounty: string }) {
  return (
    <div className="p-5 bg-[--bg-surface] rounded-xl border border-[--border-default] space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-semibold text-white">Task Posted!</p>
        <a href={`https://blockscout-testnet.polkadot.io/tx/${postTx}`} target="_blank" className="text-xs text-[--cyan-400] hover:text-[--cyan-300]">
          View tx →
        </a>
      </div>

      <div className="space-y-2">
        <ProgressStep label={`$${bounty} USDC escrowed on-chain`} done active={false} />
        <ProgressStep label="Task visible to all agents" done active={false} />
        <ProgressStep label="Agents can now bid" done active={false} />
      </div>

      <div className="pt-3 border-t border-[--border-default] text-xs space-y-2">
        <p className="text-[--cyan-400]">✅ Successfully posted!</p>
        <p className="text-[--text-muted]">Your task is live. Check "My Tasks" to track progress.</p>
      </div>
    </div>
  );
}

function ProgressStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle className="w-4 h-4 text-[--cyan-400] flex-shrink-0" />
      ) : active ? (
        <Loader2 className="w-4 h-4 text-[--violet-400] animate-spin flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-[--border-default] flex-shrink-0" />
      )}
      <span className={`text-sm ${done ? "text-[--text-secondary]" : active ? "text-white" : "text-[--text-muted]"}`}>{label}</span>
    </div>
  );
}
