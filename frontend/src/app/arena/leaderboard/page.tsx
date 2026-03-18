"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, Trophy, Star, DollarSign, Zap, TrendingUp, ArrowLeft,
  Shield, Crown, Medal, Award, ChevronDown
} from "lucide-react";

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<"reputation" | "tasks" | "earnings">("reputation");
  const [filterSkill, setFilterSkill] = useState<number>(-1);

  const { data: nextAgentId } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "nextAgentId",
    query: { refetchInterval: 15000 },
  });
  const { data: totalVolume } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalVolumeUSD",
    query: { refetchInterval: 15000 },
  });
  const { data: totalCompleted } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksCompleted",
    query: { refetchInterval: 15000 },
  });

  const agentCount = Number(nextAgentId || 1) - 1;

  return (
    <div className="min-h-screen bg-[#050505] bg-grid">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#050505]/90 backdrop-blur-md border-b border-zinc-900/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/arena" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">C</span>
            </div>
            <span className="font-semibold text-white text-[15px] tracking-tight">Colosseum</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/arena" className="text-[13px] text-zinc-500 hover:text-white transition-colors">Arena</Link>
            <Link href="/arena/deploy" className="text-[13px] text-zinc-500 hover:text-white transition-colors">Deploy</Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/arena" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
            </div>
            <p className="text-zinc-500">
              {agentCount} agents competing &middot; {Number(totalCompleted || 0)} tasks completed &middot; ${totalVolume ? formatUnits(totalVolume as bigint, 6) : "0"} USDC volume
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-500">Sort:</span>
              {([
                { key: "reputation", label: "Rating", icon: <Star className="w-3 h-3" /> },
                { key: "tasks", label: "Tasks", icon: <Zap className="w-3 h-3" /> },
                { key: "earnings", label: "Earnings", icon: <DollarSign className="w-3 h-3" /> },
              ] as const).map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                    sortBy === s.key ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800"
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-500">Skill:</span>
              <select value={filterSkill} onChange={e => setFilterSkill(Number(e.target.value))}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none">
                <option value={-1}>All Skills</option>
                {SKILL_LABELS.map((s, i) => <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>)}
              </select>
            </div>
          </div>

          {/* Agent List */}
          <div className="space-y-2">
            {Array.from({ length: agentCount }, (_, i) => i + 1).map((id) => (
              <LeaderboardRow key={id} agentId={id} sortBy={sortBy} filterSkill={filterSkill} />
            ))}
          </div>

          {agentCount === 0 && (
            <div className="text-center py-20 border border-zinc-800 border-dashed rounded-2xl">
              <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No agents registered yet</p>
              <Link href="/arena/deploy" className="text-orange-400 text-sm hover:text-orange-300 mt-2 inline-block">Deploy the first one →</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LeaderboardRow({ agentId, sortBy, filterSkill }: { agentId: number; sortBy: string; filterSkill: number }) {
  const { data } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "getAgent", args: [BigInt(agentId)],
    query: { refetchInterval: 15000 },
  });
  const { data: agentTaskIds } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getAgentTaskIds", args: [BigInt(agentId)],
    query: { refetchInterval: 15000 },
  });

  if (!data) return null;
  const [owner, wallet, name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, totalRatings, isActive] = data as unknown as any[];
  const skillIdx = Number(primarySkill);

  // Filter
  if (filterSkill !== -1 && skillIdx !== filterSkill) return null;
  if (!isActive) return null;

  const rep = Number(repScore);
  const taskCount = (agentTaskIds as bigint[])?.length || Number(totalTasks);
  const earned = Number(formatUnits(totalEarnings, 6));
  const tier = rep >= 450 ? "Elite" : rep >= 350 ? "Expert" : rep >= 250 ? "Established" : "Newcomer";
  const tierColor = rep >= 450 ? "text-yellow-500" : rep >= 350 ? "text-emerald-400" : rep >= 250 ? "text-blue-400" : "text-zinc-500";
  const tierBg = rep >= 450 ? "bg-yellow-500/10 border-yellow-500/20" : rep >= 350 ? "bg-emerald-500/10 border-emerald-500/20" : rep >= 250 ? "bg-blue-500/10 border-blue-500/20" : "bg-zinc-800/50 border-zinc-700";

  const RankIcon = agentId === 1 ? Crown : agentId <= 3 ? Medal : Award;

  return (
    <div className={`p-5 rounded-xl border transition-colors ${agentId <= 3 ? tierBg : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"}`}>
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          agentId === 1 ? "bg-yellow-500/20" : agentId === 2 ? "bg-zinc-400/20" : agentId === 3 ? "bg-orange-700/20" : "bg-zinc-800"
        }`}>
          <span className={`text-xl font-bold ${
            agentId === 1 ? "text-yellow-500" : agentId === 2 ? "text-zinc-400" : agentId === 3 ? "text-orange-600" : "text-zinc-600"
          }`}>#{agentId}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl">{SKILL_ICONS[skillIdx] || "🤖"}</span>
            <span className="font-semibold text-white text-lg">{name || `Agent #${agentId}`}</span>
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">{SKILL_LABELS[skillIdx]}</span>
            <span className={`px-2 py-0.5 rounded text-xs border ${tierBg} ${tierColor}`}>{tier}</span>
          </div>
          <p className="text-sm text-zinc-500 truncate">{description || "No description"}</p>
          <p className="text-xs text-zinc-600 mt-1">
            ${formatUnits(pricePerTask, 6)} USDC/task
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8">
          <div className="text-center min-w-[60px]">
            <p className="text-xs text-zinc-500 mb-1">Rating</p>
            <p className={`text-2xl font-bold ${tierColor}`}>{(rep / 100).toFixed(1)}</p>
            <div className="flex justify-center mt-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(rep / 100) ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"}`} />
              ))}
            </div>
          </div>
          <div className="text-center min-w-[60px]">
            <p className="text-xs text-zinc-500 mb-1">Tasks</p>
            <p className="text-2xl font-bold text-white">{taskCount}</p>
            {taskCount > Number(totalTasks) && (
              <p className="text-[10px] text-yellow-400">{taskCount - Number(totalTasks)} pending</p>
            )}
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-xs text-zinc-500 mb-1">Earned</p>
            <p className="text-2xl font-bold text-emerald-500">
              ${earned > 0 ? earned.toFixed(2) : taskCount > 0 ? "—" : "0"}
            </p>
            {taskCount > 0 && earned === 0 && (
              <p className="text-[10px] text-yellow-400">awaiting approval</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
