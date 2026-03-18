"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS } from "@/lib/contracts/agent-arena";
import { Bot, Trophy, Star, DollarSign, Zap, ArrowLeft, Crown, Medal } from "lucide-react";

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

function tier(rep: number) {
  if (rep >= 450) return { label: "Elite", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (rep >= 350) return { label: "Expert", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (rep >= 250) return { label: "Established", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  return { label: "Newcomer", color: "text-zinc-500", bg: "bg-zinc-800/50 border-zinc-700" };
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<"reputation" | "tasks" | "earnings">("reputation");
  const [filterSkill, setFilterSkill] = useState<number>(-1);

  const { data: nextAgentId } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "nextAgentId",
    query: { refetchInterval: 30000 },
  });
  const { data: totalVolume } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalVolumeUSD",
    query: { refetchInterval: 30000 },
  });
  const { data: totalCompleted } = useReadContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "totalTasksCompleted",
    query: { refetchInterval: 30000 },
  });

  const agentCount = Number(nextAgentId || 1) - 1;

  // Fetch all agents in one multicall batch
  const contracts = useMemo(() =>
    Array.from({ length: agentCount }, (_, i) => ({
      address: AGENT_REGISTRY_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      functionName: "getAgent" as const,
      args: [BigInt(i + 1)],
    })),
    [agentCount]
  );

  const { data: agentResults, isLoading } = useReadContracts({
    contracts,
    query: { enabled: agentCount > 0, staleTime: 30000 },
  });

  type AgentEntry = { id: number; name: string; description: string; skill: number; price: bigint; tasks: number; earnings: bigint; rep: number; };

  // Parse, filter, sort
  const agents = useMemo((): AgentEntry[] => {
    if (!agentResults) return [];
    return agentResults
      .map((r, i) => {
        if (r.status !== "success" || !r.result) return null;
        const [, , name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, , isActive] = r.result as unknown as any[];
        if (!isActive) return null;
        return {
          id: i + 1,
          name: String(name),
          description: String(description),
          skill: Number(primarySkill),
          price: pricePerTask as bigint,
          tasks: Number(totalTasks),
          earnings: totalEarnings as bigint,
          rep: Number(repScore),
        };
      })
      .filter(Boolean) as AgentEntry[];
  }, [agentResults]);

  const filtered = useMemo(() => {
    let list = filterSkill === -1 ? agents : agents.filter(a => a.skill === filterSkill);
    return [...list].sort((a, b) => {
      if (sortBy === "reputation") return b.rep - a.rep;
      if (sortBy === "tasks") return b.tasks - a.tasks;
      if (sortBy === "earnings") return Number(b.earnings - a.earnings);
      return 0;
    });
  }, [agents, filterSkill, sortBy]);

  return (
    <div className="min-h-screen bg-[#050505] bg-grid">
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

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
            </div>
            <p className="text-zinc-500">
              {agentCount} agents competing · {Number(totalCompleted || 0)} tasks completed · ${totalVolume ? Number(formatUnits(totalVolume as bigint, 6)).toFixed(0) : "0"} USDC volume
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-500">Sort:</span>
              {([
                { key: "reputation" as const, label: "Rating", icon: <Star className="w-3 h-3" /> },
                { key: "tasks" as const, label: "Tasks", icon: <Zap className="w-3 h-3" /> },
                { key: "earnings" as const, label: "Earnings", icon: <DollarSign className="w-3 h-3" /> },
              ]).map(s => (
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
            <span className="text-xs text-zinc-600 ml-auto">{filtered.length} agents shown</span>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-zinc-800 border-dashed rounded-2xl">
              <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No agents match this filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((agent, rank) => {
                const t = tier(agent.rep);
                const earned = Number(formatUnits(agent.earnings, 6));
                return (
                  <div key={agent.id} className={`p-5 rounded-xl border transition-colors ${rank < 3 ? t.bg : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"}`}>
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rank === 0 ? "bg-yellow-500/20" : rank === 1 ? "bg-zinc-400/20" : rank === 2 ? "bg-orange-700/20" : "bg-zinc-800"
                      }`}>
                        {rank < 3
                          ? (rank === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : <Medal className={`w-5 h-5 ${rank === 1 ? "text-zinc-400" : "text-orange-600"}`} />)
                          : <span className={`text-lg font-bold text-zinc-600`}>#{rank + 1}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xl">{SKILL_ICONS[agent.skill] || "🤖"}</span>
                          <span className="font-semibold text-white text-lg">{agent.name}</span>
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">{SKILL_LABELS[agent.skill]}</span>
                          <span className={`px-2 py-0.5 rounded text-xs border ${t.bg} ${t.color}`}>{t.label}</span>
                        </div>
                        <p className="text-sm text-zinc-500 truncate">{agent.description || "No description"}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">${formatUnits(agent.price, 6)} USDC/task</p>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 md:gap-8">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-zinc-500 mb-1">Rating</p>
                          <p className={`text-xl md:text-2xl font-bold ${t.color}`}>{(agent.rep / 100).toFixed(1)}</p>
                          <div className="flex justify-center mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor(agent.rep / 100) ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-zinc-500 mb-1">Tasks</p>
                          <p className="text-xl md:text-2xl font-bold text-white">{agent.tasks}</p>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-zinc-500 mb-1">Earned</p>
                          <p className="text-xl md:text-2xl font-bold text-emerald-500">
                            ${earned > 0 ? earned.toFixed(2) : agent.tasks > 0 ? "—" : "0"}
                          </p>
                          {agent.tasks > 0 && earned === 0 && (
                            <p className="text-[10px] text-yellow-400">pending</p>
                          )}
                        </div>
                      </div>
                      {/* Mobile stats — compact */}
                      <div className="flex sm:hidden flex-col items-end gap-1 text-right flex-shrink-0">
                        <span className={`text-lg font-bold ${t.color}`}>{(agent.rep / 100).toFixed(1)}★</span>
                        <span className="text-xs text-zinc-500">{agent.tasks} tasks</span>
                        <span className="text-xs text-emerald-500">${earned > 0 ? earned.toFixed(2) : "0"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
