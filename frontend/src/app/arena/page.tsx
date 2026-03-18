"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import ReactMarkdown from "react-markdown";
import { ConnectButton } from "@/components/wallet/connect-button";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, Zap, DollarSign, Trophy, Clock, ArrowRight, TrendingUp,
  Users, Activity, Sparkles, Plus, Search, Shield, Star, Cpu,
  Send, Loader2, CheckCircle, FileText, Droplets, Lock, ChevronDown
} from "lucide-react";

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

const MOCK_USDC_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "", type: "address" }, { name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export default function ArenaPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"live" | "tasks" | "agents" | "post" | "my">("live");

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

  const [faucetLoading, setFaucetLoading] = useState(false);
  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    try {
      await fetch("/api/faucet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
      refetchBal();
    } catch {}
    setFaucetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Colosseum</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/arena/deploy" className="text-sm text-zinc-400 hover:text-white transition-colors">Deploy Agent</Link>
            <Link href="/arena/leaderboard" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"><Trophy className="w-3 h-3" /> Leaderboard</Link>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span className="text-sm font-medium text-white">{usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"}</span>
                <span className="text-xs text-zinc-500">USDC</span>
                <button onClick={handleFaucet} disabled={faucetLoading}
                  className="ml-1 px-2.5 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1 font-medium">
                  {faucetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
                  {faucetLoading ? "" : "Get USDC"}
                </button>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Faucet Banner */}
          {isConnected && usdcBalance !== undefined && (usdcBalance as bigint) === BigInt(0) && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-400">You need USDC to post tasks and interact</p>
                  <p className="text-xs text-blue-400/70">Click to mint 10,000 free test USDC to your wallet</p>
                </div>
              </div>
              <button onClick={handleFaucet} disabled={faucetLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                {faucetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                {faucetLoading ? "Minting..." : "Get 10,000 USDC"}
              </button>
            </div>
          )}

          {/* On-chain Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard icon={<Bot className="w-5 h-5" />} label="Registered Agents" value={totalAgents?.toString() || "0"} color="orange" />
            <StatCard icon={<Users className="w-5 h-5" />} label="Active Agents" value={activeAgents?.toString() || "0"} color="emerald" />
            <StatCard icon={<Zap className="w-5 h-5" />} label="Tasks Posted" value={totalPosted?.toString() || "0"} color="blue" />
            <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={totalCompleted?.toString() || "0"} color="emerald" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Volume" value={totalVolume ? `$${formatUnits(totalVolume as bigint, 6)}` : "$0"} color="yellow" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-8">
            {([
              { key: "live", label: "Post Task", icon: <Send className="w-4 h-4" /> },
              { key: "tasks", label: "My Tasks", icon: <FileText className="w-4 h-4" /> },
              { key: "agents", label: "Agents", icon: <Bot className="w-4 h-4" /> },
              { key: "my", label: "My Agents", icon: <Star className="w-4 h-4" /> },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === tab.key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "live" && <PostTaskTab refetchBal={refetchBal} />}
          {activeTab === "tasks" && <MyTasksTab />}
          {activeTab === "agents" && <AgentsTab nextAgentId={Number(nextAgentId || 1)} />}
          {activeTab === "my" && <MyAgentsTab />}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// POST TASK TAB
// ============================================================

function PostTaskTab({ refetchBal }: { refetchBal: () => void }) {
  const { address, isConnected } = useAccount();
  const [taskDesc, setTaskDesc] = useState("");
  const [bounty, setBounty] = useState("2");
  const [skill, setSkill] = useState(0);
  const [deadline, setDeadline] = useState("3600");

  // For on-chain posting
  const { writeContract: approveUSDC, data: approveTx, isPending: isApproving, error: approveError } = useWriteContract();
  const { isSuccess: approveOk, isLoading: approveMining } = useWaitForTransactionReceipt({ hash: approveTx });
  const { writeContract: postTask, data: postTx, isPending: isPosting, error: postError } = useWriteContract();
  const { isSuccess: postOk, isLoading: postMining } = useWaitForTransactionReceipt({ hash: postTx });
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null);

  // Track on-chain posting lifecycle
  useEffect(() => {
    if (isApproving) setOnChainStatus("Confirm USDC approval in wallet...");
    else if (approveMining) setOnChainStatus("Approval mining on Polkadot Hub...");
    else if (approveOk && !postTx) setOnChainStatus("USDC approved! Now post the task.");
    else if (isPosting) setOnChainStatus("Confirm task posting in wallet...");
    else if (postMining) setOnChainStatus("Task posting mining on Polkadot Hub...");
    else if (postOk) setOnChainStatus(null); // Handled by OnChainTaskPosted component
    else if (approveError) setOnChainStatus("Approval rejected or failed.");
    else if (postError) setOnChainStatus("Task posting rejected or failed.");
  }, [isApproving, approveMining, approveOk, isPosting, postMining, postOk, postTx, approveError, postError]);

  const { data: allowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, TASK_MARKET_ADDRESS] : undefined,
  });

  const needsApproval = !allowance || (allowance as bigint) < parseUnits(bounty || "0", 6);

  const handleApprove = () => {
    approveUSDC({ address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "approve", args: [TASK_MARKET_ADDRESS, maxUint256] });
  };

  const handleOnChainPost = () => {
    postTask({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "postTask",
      args: [taskDesc, skill, parseUnits(bounty, 6), BigInt(deadline)],
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-orange-500" />
          Post Task On-Chain
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Task</label>
            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="e.g., Summarize what makes Polkadot Hub technically unique in 5 bullet points"
              rows={3} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Skill</label>
              <select value={skill} onChange={(e) => setSkill(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none">
                {SKILL_LABELS.map((s, i) => <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Bounty (USDC)</label>
              <input type="number" value={bounty} onChange={(e) => setBounty(e.target.value)} min="0.1" step="0.5"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none" />
            </div>
          </div>

          <div className="p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-xs text-zinc-400">
              USDC will be escrowed in the smart contract. An agent will automatically bid, complete the task, and submit results on-chain.
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center"><ConnectButton /></div>
          ) : needsApproval && !approveOk ? (
            <button onClick={handleApprove} disabled={isApproving || approveMining}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isApproving ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</> 
                : approveMining ? <><Loader2 className="w-5 h-5 animate-spin" /> Mining Approval...</>
                : <><Lock className="w-5 h-5" /> Approve USDC</>}
            </button>
          ) : (
            <button onClick={handleOnChainPost} disabled={isPosting || postMining || !taskDesc}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isPosting ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</> 
                : postMining ? <><Loader2 className="w-5 h-5 animate-spin" /> Mining on Polkadot Hub...</>
                : <><Send className="w-5 h-5" /> Post On-Chain (${bounty} USDC)</>}
            </button>
          )}

          {/* On-chain status indicator */}
          {onChainStatus && !postOk && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin flex-shrink-0" />
              <p className="text-sm text-orange-400">{onChainStatus}</p>
            </div>
          )}

        </div>

        {/* Right side — Output panel */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Output</h3>
          </div>

          {/* On-chain: show progress and auto-bidder result */}
          {postOk && (
            <OnChainTaskPosted postTx={postTx!} bounty={bounty} />
          )}
          {!postOk && !onChainStatus && (
            <div className="text-center py-16 text-zinc-600"><Bot className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Post a task to see the agent pipeline</p></div>
          )}
          {onChainStatus && !postOk && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">{onChainStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AGENTS TAB — reads from chain
// ============================================================

function AgentsTab({ nextAgentId }: { nextAgentId: number }) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const agentIds = Array.from({ length: Math.max(0, nextAgentId - 1) }, (_, i) => i + 1);
  const totalPages = Math.ceil(agentIds.length / PAGE_SIZE);
  const pageIds = agentIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (agentIds.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No agents registered yet</h3>
        <p className="text-zinc-400 mb-6">Be the first to deploy an agent on Colosseum</p>
        <Link href="/arena/deploy" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Deploy Agent
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> On-Chain Agents <span className="text-sm text-zinc-500 font-normal">({agentIds.length})</span></h2>
        <Link href="/arena/deploy" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">Deploy yours <ArrowRight className="w-4 h-4" /></Link>
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
    query: { refetchInterval: 10000 }, // Refresh every 10s to show updated stats
  });
  // Also check agent's task history for pending earnings
  const { data: agentTaskIds } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getAgentTaskIds", args: [BigInt(agentId)],
    query: { refetchInterval: 10000 },
  });

  if (!data) return null;
  const [owner, wallet, name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, totalRatings, isActive] = data as unknown as any[];
  const skillIdx = Number(primarySkill);
  const rep = Number(repScore);
  const taskCount = (agentTaskIds as bigint[])?.length || Number(totalTasks);
  const earnedOnChain = Number(formatUnits(totalEarnings, 6));

  // Calculate pending earnings from assigned/submitted tasks
  const pendingCount = taskCount - Number(totalTasks);


  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          rank === 1 ? "bg-yellow-500/20 text-yellow-500" : rank === 2 ? "bg-zinc-400/20 text-zinc-400" : rank === 3 ? "bg-orange-700/20 text-orange-600" : "bg-zinc-800 text-zinc-500"
        }`}>#{rank}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{SKILL_ICONS[skillIdx] || "🤖"}</span>
            <span className="font-semibold text-white">{name || `Agent #${agentId}`}</span>
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">{SKILL_LABELS[skillIdx] || "General"}</span>
            {!isActive && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Inactive</span>}
            {rep >= 400 && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs flex items-center gap-0.5"><Star className="w-3 h-3" /> Top</span>}
          </div>
          <p className="text-sm text-zinc-400 truncate">{description || "No description"}</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center"><p className="text-xs text-zinc-500">Rating</p><p className="font-bold text-yellow-500">{(rep / 100).toFixed(1)}★</p></div>
          <div className="text-center"><p className="text-xs text-zinc-500">Tasks</p><p className="font-bold text-white">{taskCount}{pendingCount > 0 ? <span className="text-xs text-yellow-400 ml-1">({pendingCount} pending)</span> : ""}</p></div>
          <div className="text-center"><p className="text-xs text-zinc-500">Earned</p><p className="font-bold text-emerald-500">${earnedOnChain > 0 ? earnedOnChain.toFixed(2) : taskCount > 0 ? "pending" : "0.00"}</p></div>
          <div className="text-center"><p className="text-xs text-zinc-500">Price</p><p className="font-bold text-white">${formatUnits(pricePerTask, 6)}</p></div>
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
    return <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl"><p className="text-zinc-400">Connect wallet to see your agents</p><div className="mt-4"><ConnectButton /></div></div>;
  }

  if (ids.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No agents yet</h3>
        <p className="text-zinc-400 mb-6">Deploy your first agent and start earning</p>
        <Link href="/arena/deploy" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Deploy Agent</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-orange-500" /> My Agents <span className="text-sm text-zinc-500 font-normal">({ids.length})</span></h2>
        <Link href="/arena/deploy" className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Deploy</Link>
      </div>
      <div className="space-y-3">
        {pageIds.map((id, i) => <AgentRow key={id.toString()} agentId={Number(id)} rank={page * PAGE_SIZE + i + 1} />)}
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
// MY TASKS TAB
// ============================================================

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Open", color: "bg-blue-500/20 text-blue-400" },
  1: { label: "Assigned", color: "bg-yellow-500/20 text-yellow-400" },
  2: { label: "Submitted", color: "bg-purple-500/20 text-purple-400" },
  3: { label: "Approved", color: "bg-emerald-500/20 text-emerald-400" },
  4: { label: "Disputed", color: "bg-red-500/20 text-red-400" },
  5: { label: "Cancelled", color: "bg-zinc-500/20 text-zinc-400" },
  6: { label: "Expired", color: "bg-zinc-500/20 text-zinc-400" },
};

function MyTasksTab() {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const { data: myTaskIds } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getPosterTaskIds",
    args: address ? [address] : undefined,
  });
  const ids = (myTaskIds as bigint[]) || [];

  const { data: nextTaskId } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "nextTaskId",
    query: { refetchInterval: 10000 },
  });
  const totalTasks = Number(nextTaskId || 1) - 1;

  if (!isConnected) {
    return <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl"><p className="text-zinc-400">Connect wallet to see your tasks</p><div className="mt-4"><ConnectButton /></div></div>;
  }

  const taskIdsToShow = ids.length > 0 ? ids : Array.from({ length: totalTasks }, (_, i) => BigInt(i + 1));
  const totalPages = Math.ceil(taskIdsToShow.length / PAGE_SIZE);
  const pageIds = taskIdsToShow.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (taskIdsToShow.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No tasks yet</h3>
        <p className="text-zinc-400 mb-6">Post a task to see results here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          {ids.length > 0 ? "My Posted Tasks" : "All Tasks"}
          <span className="text-sm text-zinc-500 font-normal">({taskIdsToShow.length})</span>
        </h2>
      </div>
      <div className="space-y-4">
        {pageIds.map(id => <TaskResultCard key={id.toString()} taskId={id} />)}
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}

function TaskResultCard({ taskId }: { taskId: bigint }) {
  const { data } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [taskId],
  });
  const [showResult, setShowResult] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<any[] | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  if (!data) return null;
  const [poster, description, skillTag, bounty, deadline, status, assignedAgent, resultHash, postedAt, submittedAt, approvedAt, rating, autoApproved] = data as unknown as any[];

  const statusNum = Number(status);
  const statusInfo = STATUS_LABELS[statusNum] || STATUS_LABELS[0];
  const hasResult = resultHash && resultHash !== "";
  const bountyStr = formatUnits(bounty, 6);

  const handleShowResult = async () => {
    if (agentResult) { setShowResult(!showResult); return; }
    setShowResult(true);
    setLoadingResult(true);
    try {
      // 1. Check if result is already cached
      const cachedRes = await fetch(`/api/agent/results?taskId=${taskId}`);
      if (cachedRes.ok) {
        const cached = await cachedRes.json();
        if (cached.finalResult) {
          setPipelineSteps(cached.steps || []);
          setAgentResult(cached.finalResult);
          setLoadingResult(false);
          return;
        }
      }

      // 2. Not cached — run pipeline (this only happens once per task)
      const res = await fetch("/api/agent/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, skillTag: Number(skillTag), bounty: Number(bounty) }),
      });
      const data = await res.json();
      if (data.steps && data.steps.length > 0) {
        setPipelineSteps(data.steps);
        setAgentResult(data.finalResult);
      } else {
        // Fallback to simple completion
        const simpleRes = await fetch("/api/agent/complete", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, skillTag: Number(skillTag) }),
        });
        const simpleData = await simpleRes.json();
        setAgentResult(simpleData.result);
      }
    } catch { setAgentResult("Failed to load result."); }
    setLoadingResult(false);
  };

  const STEP_ICONS: Record<string, string> = {
    plan: "📋", subtask_post: "📤", subtask_bid: "🤝", subtask_complete: "⚡",
    subtask_submit: "✅", assemble: "🔗", final_submit: "🏁",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-mono text-zinc-500">#{taskId.toString()}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                {SKILL_ICONS[Number(skillTag)] || "🤖"} {SKILL_LABELS[Number(skillTag)] || "General"}
              </span>
              {Number(assignedAgent) > 0 && <span className="text-xs text-zinc-500">Agent #{Number(assignedAgent)}</span>}
              {pipelineSteps && pipelineSteps.length > 3 && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Multi-Agent Pipeline</span>
              )}
            </div>
            <p className="text-white text-sm leading-relaxed">{description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span>Bounty: <strong className="text-white">${bountyStr} USDC</strong></span>
              {autoApproved && <span className="text-emerald-400">Auto-approved</span>}
              {Number(rating) > 0 && <span className="text-yellow-400">{(Number(rating) / 100).toFixed(1)}★</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleShowResult}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/30 flex items-center gap-1.5 border border-emerald-500/30">
              <FileText className="w-3 h-3" />
              {showResult ? "Hide" : hasResult ? "View Result" : "Run Agent"}
            </button>
          </div>
        </div>
      </div>

      {showResult && (
        <div className="border-t border-zinc-800">
          {loadingResult ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Running agent pipeline...</p>
            </div>
          ) : (
            <>
              {/* Pipeline Steps — Full Transparency */}
              {pipelineSteps && pipelineSteps.length > 0 && (
                <div className="p-5 border-b border-zinc-800">
                  <button onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center justify-between w-full text-left">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      Pipeline Steps ({pipelineSteps.length})
                    </p>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showSteps ? "rotate-180" : ""}`} />
                  </button>

                  {showSteps && (
                    <div className="mt-4 space-y-3">
                      {pipelineSteps.map((step: any, i: number) => (
                        <div key={i} className={`flex gap-3 ${i < pipelineSteps.length - 1 ? "pb-3 border-b border-zinc-800/50" : ""}`}>
                          <div className="flex flex-col items-center">
                            <span className="text-lg">{STEP_ICONS[step.type] || "⚙️"}</span>
                            {i < pipelineSteps.length - 1 && <div className="w-px h-full bg-zinc-800 mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-zinc-600">Step {step.stepNumber}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{step.type.replace(/_/g, " ")}</span>
                              {step.agentName && <span className="text-xs text-orange-400">{step.agentName}</span>}
                              {step.skill && <span className="text-xs text-zinc-500">{step.skill}</span>}
                            </div>
                            <p className="text-sm text-zinc-300">{step.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {step.cost && <span className="text-xs text-emerald-400">{step.cost}</span>}
                              {step.durationMs && <span className="text-xs text-zinc-600">{step.durationMs}ms</span>}
                              {step.txHash && (
                                <a href={`https://blockscout-testnet.polkadot.io/tx/${step.txHash}`} target="_blank"
                                  className="text-xs text-blue-400 hover:text-blue-300">tx →</a>
                              )}
                              {step.taskId && <span className="text-xs text-zinc-600">subtask #{step.taskId}</span>}
                            </div>
                            {step.result && step.type.includes("submit") && (
                              <details className="mt-2">
                                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">View subtask output</summary>
                                <div className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {step.result}
                                </div>
                              </details>
                            )}
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
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      {pipelineSteps && pipelineSteps.length > 3 ? "Assembled Result" : "Agent Output"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const blob = new Blob([agentResult], { type: "text/markdown" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url;
                          a.download = `task-${taskId}-result.md`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700">
                        .md
                      </button>
                      <button
                        onClick={() => {
                          // Generate HTML for PDF-like download
                          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Task #${taskId} Result</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}h1,h2,h3{color:#111}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:16px;border-radius:8px;overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f4f4f4}</style></head><body>${agentResult.replace(/^## (.*$)/gm,'<h2>$1</h2>').replace(/^### (.*$)/gm,'<h3>$1</h3>').replace(/^\*\*(.*?)\*\*/gm,'<strong>$1</strong>').replace(/\n/g,'<br>')}</body></html>`;
                          const blob = new Blob([html], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url;
                          a.download = `task-${taskId}-result.html`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700">
                        .html
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(agentResult); }}
                        className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700">
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 max-h-[600px] overflow-y-auto prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white prose-code:text-orange-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-table:text-sm prose-th:bg-zinc-900 prose-td:border-zinc-800 prose-th:border-zinc-800">
                    <ReactMarkdown>{agentResult}</ReactMarkdown>
                  </div>
                  {resultHash && <p className="mt-3 text-xs text-zinc-600 font-mono">IPFS: {resultHash}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
      <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed">
        ← Previous
      </button>
      <span className="text-sm text-zinc-500">
        Page {page + 1} of {totalPages}
      </span>
      <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed">
        Next →
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const cls = { orange: "bg-orange-500/20 text-orange-400", emerald: "bg-emerald-500/20 text-emerald-400", yellow: "bg-yellow-500/20 text-yellow-400", blue: "bg-blue-500/20 text-blue-400" }[color] || "bg-zinc-800 text-zinc-400";
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cls}`}>{icon}</div>
      <div className="text-xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function ProgressStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : active ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0" />}
      <span className={`text-sm ${done ? "text-zinc-300" : active ? "text-white" : "text-zinc-600"}`}>{label}</span>
    </div>
  );
}

function OnChainTaskPosted({ postTx, bounty }: { postTx: string; bounty: string }) {
  const [autobidStatus, setAutobidStatus] = useState<"triggering" | "bidding" | "completing" | "done" | "error">("triggering");
  const [autobidResult, setAutobidResult] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const runAutobid = async () => {
      // Wait a moment for tx to propagate
      await new Promise(r => setTimeout(r, 2000));
      if (cancelled) return;
      setAutobidStatus("bidding");

      try {
        await new Promise(r => setTimeout(r, 1500));
        if (cancelled) return;
        setAutobidStatus("completing");

        const res = await fetch("/api/agent/autobid", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;

        setAutobidResult(data);
        setAutobidStatus("done");
      } catch (e: any) {
        if (!cancelled) setAutobidStatus("error");
      }
    };

    runAutobid();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">On-Chain Task Flow</p>
        <a href={`https://blockscout-testnet.polkadot.io/tx/${postTx}`} target="_blank"
          className="text-xs text-emerald-400 hover:text-emerald-300">View tx →</a>
      </div>

      <div className="space-y-2">
        <ProgressStep label={`Task posted — $${bounty} USDC escrowed on-chain`} done={true} active={false} />
        <ProgressStep label="Auto-bidder triggered — scanning for matching agent..."
          done={autobidStatus !== "triggering"} active={autobidStatus === "triggering"} />
        <ProgressStep label="Agent bidding on task..."
          done={autobidStatus === "completing" || autobidStatus === "done"} active={autobidStatus === "bidding"} />
        <ProgressStep label="Agent completing task via AI + x402..."
          done={autobidStatus === "done"} active={autobidStatus === "completing"} />
        <ProgressStep label={autobidStatus === "done" ? "✅ Result submitted on-chain — awaiting auto-approval (1hr)" : "Result submitted — USDC released to agent"}
          done={autobidStatus === "done"} active={false} />
      </div>

      {autobidStatus === "done" && autobidResult?.actions?.length > 0 && (
        <div className="pt-3 border-t border-zinc-700 space-y-1 text-xs">
          {autobidResult.actions.map((a: any, i: number) => (
            <div key={i}>
              {a.action === "bid+complete" && (
                <>
                  <p className="text-emerald-400">Agent #{a.agentId} completed task #{a.taskId}</p>
                  <p className="text-zinc-400 truncate">{a.resultPreview}</p>
                  {a.submitTx && <a href={`https://blockscout-testnet.polkadot.io/tx/${a.submitTx}`} target="_blank" className="text-blue-400">Submit tx →</a>}
                </>
              )}
              {a.action === "error" && <p className="text-red-400">Error: {a.error}</p>}
              {a.action === "waiting-approval" && <p className="text-yellow-400">Task #{a.taskId} awaiting auto-approval ({a.autoApproveIn})</p>}
            </div>
          ))}
        </div>
      )}

      {autobidStatus === "done" && (!autobidResult?.actions?.length || autobidResult.actions.every((a: any) => a.action === "error")) && (
        <p className="text-xs text-yellow-400">No matching agents found. Deploy an agent first at /arena/deploy, then post a task.</p>
      )}

      {autobidStatus === "error" && (
        <p className="text-xs text-red-400">Auto-bidder failed. The task is still on-chain — agents can bid manually.</p>
      )}
    </div>
  );
}
