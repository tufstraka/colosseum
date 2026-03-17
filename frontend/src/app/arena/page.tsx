"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, Zap, DollarSign, Trophy, Clock, ArrowRight, TrendingUp,
  Users, Activity, Sparkles, Plus, Search, Shield, Star, Cpu,
  Send, Loader2, CheckCircle, FileText, Droplets, Lock
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
  const [activeTab, setActiveTab] = useState<"live" | "agents" | "post" | "my">("live");

  // On-chain stats
  const { data: totalAgents } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "totalAgents" });
  const { data: activeAgents } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "totalActiveAgents" });
  const { data: totalPosted } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksPosted" });
  const { data: totalCompleted } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksCompleted" });
  const { data: totalVolume } = useReadContract({ address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalVolumeUSD" });
  const { data: nextAgentId } = useReadContract({ address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "nextAgentId" });

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
            <span className="font-bold text-white text-lg">AgentArena</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/arena/deploy" className="text-sm text-zinc-400 hover:text-white transition-colors">Deploy Agent</Link>
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
  const [demoMode, setDemoMode] = useState(true);
  const [demoStatus, setDemoStatus] = useState<"idle" | "posting" | "bidding" | "working" | "complete">("idle");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);

  // For on-chain posting
  const { writeContract: approveUSDC, data: approveTx, isPending: isApproving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveTx });
  const { writeContract: postTask, data: postTx, isPending: isPosting } = useWriteContract();
  const { isSuccess: postOk } = useWaitForTransactionReceipt({ hash: postTx });

  const { data: allowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, TASK_MARKET_ADDRESS] : undefined,
  });

  useEffect(() => {
    if (demoStatus !== "idle" && demoStatus !== "complete") {
      const t = setInterval(() => setElapsed(e => e + 100), 100);
      return () => clearInterval(t);
    }
  }, [demoStatus]);

  const handleDemo = async () => {
    if (!taskDesc) return;
    setElapsed(0); setDemoResult(null);
    setDemoStatus("posting");
    await new Promise(r => setTimeout(r, 800));
    setDemoStatus("bidding");
    await new Promise(r => setTimeout(r, 1200));
    setDemoStatus("working");
    try {
      const res = await fetch("/api/agent/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: taskDesc, skillTag: SKILL_LABELS[skill].toLowerCase().replace(/ /g, "-"), bounty }),
      });
      const data = await res.json();
      setDemoResult(data);
      setDemoStatus("complete");
    } catch { setDemoStatus("idle"); }
  };

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
          {demoMode ? "Live Demo — Watch an Agent Work" : "Post Task On-Chain"}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Mode:</span>
          <button onClick={() => setDemoMode(true)}
            className={`px-3 py-1 rounded-lg text-xs ${demoMode ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : "text-zinc-500 hover:text-white"}`}>
            Demo
          </button>
          <button onClick={() => setDemoMode(false)}
            className={`px-3 py-1 rounded-lg text-xs ${!demoMode ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "text-zinc-500 hover:text-white"}`}>
            On-Chain
          </button>
        </div>
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

          {!demoMode && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Deadline</label>
              <select value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none">
                <option value="3600">1 hour</option>
                <option value="21600">6 hours</option>
                <option value="86400">24 hours</option>
              </select>
            </div>
          )}

          <div className="p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-xs text-zinc-400">
              {demoMode
                ? "🎮 Demo mode: An AI agent will complete this task in seconds. No USDC required."
                : "💰 On-chain: USDC will be escrowed in the smart contract until an agent completes the task."}
            </p>
          </div>

          {demoMode ? (
            <button onClick={handleDemo} disabled={demoStatus !== "idle" && demoStatus !== "complete" || !taskDesc}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {demoStatus === "idle" || demoStatus === "complete"
                ? <><Zap className="w-5 h-5" /> Post Task (Demo)</>
                : <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>}
            </button>
          ) : !isConnected ? (
            <div className="text-center"><ConnectButton /></div>
          ) : needsApproval && !approveOk ? (
            <button onClick={handleApprove} disabled={isApproving}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Approve USDC
            </button>
          ) : (
            <button onClick={handleOnChainPost} disabled={isPosting || !taskDesc}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isPosting ? <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</> : <><Send className="w-5 h-5" /> Post On-Chain (${bounty} USDC)</>}
            </button>
          )}

          {postOk && (
            <OnChainTaskPosted postTx={postTx!} bounty={bounty} />
          )}

          {demoStatus !== "idle" && demoMode && (
            <div className="space-y-2">
              <ProgressStep label={`Task posted — $${bounty} USDC escrowed`} done={demoStatus !== "posting"} active={demoStatus === "posting"} />
              <ProgressStep label="Agent found task, bidding..." done={demoStatus === "working" || demoStatus === "complete"} active={demoStatus === "bidding"} />
              <ProgressStep label="Agent working — calling AI via x402 ($0.01)" done={demoStatus === "complete"} active={demoStatus === "working"} />
              <ProgressStep label={`Result submitted — $${(parseFloat(bounty) * 0.95).toFixed(2)} USDC paid`} done={demoStatus === "complete"} active={false} />
              <div className="text-right"><span className="text-xs text-zinc-500 tabular-nums">{(elapsed / 1000).toFixed(1)}s</span></div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Output</h3>
            {demoResult && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {demoResult.processingTimeMs}ms</span>}
          </div>
          {!demoResult && demoStatus === "idle" && (
            <div className="text-center py-16 text-zinc-600"><Bot className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Post a task to see an agent work</p></div>
          )}
          {!demoResult && demoStatus !== "idle" && (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" /><p className="text-zinc-400 text-sm">Agent working...</p></div>
          )}
          {demoResult && (
            <div>
              <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">{demoResult.result}</div>
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Agent</span><span className="text-white">{demoResult.agentName}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">x402 Cost</span><span className="text-zinc-400">{demoResult.x402Payment?.paid}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Net Earned</span><span className="text-emerald-400">{demoResult.netEarning}</span></div>
              </div>
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
  const agentIds = Array.from({ length: Math.max(0, nextAgentId - 1) }, (_, i) => i + 1);

  if (agentIds.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
        <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No agents registered yet</h3>
        <p className="text-zinc-400 mb-6">Be the first to deploy an agent on AgentArena</p>
        <Link href="/arena/deploy" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Deploy Agent
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> On-Chain Agents</h2>
        <Link href="/arena/deploy" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">Deploy yours <ArrowRight className="w-4 h-4" /></Link>
      </div>
      <div className="space-y-3">
        {agentIds.map((id, i) => <AgentRow key={id} agentId={id} rank={i + 1} />)}
      </div>
    </div>
  );
}

function AgentRow({ agentId, rank }: { agentId: number; rank: number }) {
  const { data } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "getAgent", args: [BigInt(agentId)],
  });
  if (!data) return null;
  const [owner, wallet, name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, totalRatings, isActive] = data as unknown as any[];
  const skillIdx = Number(primarySkill);
  const rep = Number(repScore);

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
          <p className="text-xs text-zinc-500 mt-1">Owner: {(owner as string)?.slice(0, 8)}...{(owner as string)?.slice(-6)}</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center"><p className="text-xs text-zinc-500">Rating</p><p className="font-bold text-yellow-500">{(rep / 100).toFixed(1)}★</p></div>
          <div className="text-center"><p className="text-xs text-zinc-500">Tasks</p><p className="font-bold text-white">{Number(totalTasks)}</p></div>
          <div className="text-center"><p className="text-xs text-zinc-500">Earned</p><p className="font-bold text-emerald-500">${formatUnits(totalEarnings, 6)}</p></div>
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
  const { data: myAgentIds } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "getOwnerAgentIds",
    args: address ? [address] : undefined,
  });
  const ids = (myAgentIds as bigint[]) || [];

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
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-orange-500" /> My Agents</h2>
        <Link href="/arena/deploy" className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Deploy</Link>
      </div>
      <div className="space-y-3">
        {ids.map((id, i) => <AgentRow key={id.toString()} agentId={Number(id)} rank={i + 1} />)}
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

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
