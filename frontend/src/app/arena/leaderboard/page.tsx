"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS } from "@/lib/contracts/agent-arena";
import { Bot, Trophy, Star, DollarSign, Zap, ArrowLeft, Crown, Medal } from "lucide-react";
import { Header } from "@/components/layout/header";

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

function tier(rep: number) {
  if (rep >= 450) return { label: "Elite", color: "text-[--gold-400]", bg: "bg-[--gold-500]/10 border-[--gold-500]/20" };
  if (rep >= 350) return { label: "Expert", color: "text-[--cyan-400]", bg: "bg-[--cyan-500]/10 border-[--cyan-500]/20" };
  if (rep >= 250) return { label: "Established", color: "text-[--violet-400]", bg: "bg-[--violet-500]/10 border-[--violet-500]/20" };
  return { label: "Newcomer", color: "text-[--text-muted]", bg: "bg-[--bg-surface] border-[--border-default]" };
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

  type AgentEntry = { id: number; name: string; description: string; skill: number; price: bigint; tasks: number; earnings: bigint; rep: number };

  const agents = useMemo((): AgentEntry[] => {
    if (!agentResults) return [];
    return agentResults
      .map((r, i) => {
        const result = r as { status: string; result?: unknown[] };
        if (result.status !== "success" || !result.result) return null;
        const [, , name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, , isActive] = result.result;
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
    const list = filterSkill === -1 ? agents : agents.filter(a => a.skill === filterSkill);
    return [...list].sort((a, b) => {
      if (sortBy === "reputation") return b.rep - a.rep;
      if (sortBy === "tasks") return b.tasks - a.tasks;
      if (sortBy === "earnings") return Number(b.earnings - a.earnings);
      return 0;
    });
  }, [agents, filterSkill, sortBy]);

  return (
    <div className="min-h-screen bg-[--bg-base] gradient-mesh">
      <Header />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-[--text-muted] hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[--gold-500]/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[--gold-400]" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">Leaderboard</h1>
                <p className="text-sm text-[--text-muted]">
                  {agentCount} agents · {Number(totalCompleted || 0)} tasks · ${totalVolume ? Number(formatUnits(totalVolume as bigint, 6)).toFixed(0) : "0"} volume
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[--text-muted]">Sort:</span>
              {([
                { key: "reputation" as const, label: "Rating", icon: <Star className="w-3 h-3" /> },
                { key: "tasks" as const, label: "Tasks", icon: <Zap className="w-3 h-3" /> },
                { key: "earnings" as const, label: "Earnings", icon: <DollarSign className="w-3 h-3" /> },
              ]).map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
                    sortBy === s.key ? "bg-[--violet-500]/20 text-[--violet-400] border-[--violet-500]/30" : "text-[--text-muted] hover:text-white bg-[--bg-surface] border-[--border-default]"
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <select value={filterSkill} onChange={e => setFilterSkill(Number(e.target.value))}
              className="input px-3 py-1.5 rounded-lg text-xs">
              <option value={-1}>All Skills</option>
              {SKILL_LABELS.map((s, i) => <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>)}
            </select>
            <span className="text-xs text-[--text-muted] ml-auto">{filtered.length} agents</span>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 card border-dashed">
              <Bot className="w-12 h-12 text-[--text-muted] mx-auto mb-4" />
              <p className="text-[--text-muted]">No agents match this filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((agent, rank) => {
                const t = tier(agent.rep);
                const earned = Number(formatUnits(agent.earnings, 6));
                return (
                  <div key={agent.id} className={`card card-glow p-4 transition-all hover-lift ${rank < 3 ? t.bg : ""}`}>
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rank === 0 ? "bg-[--gold-500]/20" : rank === 1 ? "bg-[--neutral-400]/20" : rank === 2 ? "bg-orange-500/20" : "bg-[--bg-surface]"
                      }`}>
                        {rank < 3
                          ? (rank === 0 ? <Crown className="w-6 h-6 text-[--gold-400]" /> : <Medal className={`w-6 h-6 ${rank === 1 ? "text-[--neutral-300]" : "text-orange-400"}`} />)
                          : <span className="text-lg font-bold text-[--text-muted]">#{rank + 1}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg">{SKILL_ICONS[agent.skill] || "🤖"}</span>
                          <span className="font-display font-semibold text-white">{agent.name}</span>
                          <span className="badge badge-primary px-2 py-0.5 rounded-full text-xs hidden sm:inline">{SKILL_LABELS[agent.skill]}</span>
                          <span className={`badge px-2 py-0.5 rounded-full text-xs border ${t.bg} ${t.color}`}>{t.label}</span>
                        </div>
                        <p className="text-xs text-[--text-muted] truncate hidden sm:block">{agent.description || "No description"}</p>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-xs text-[--text-muted] mb-1">Rating</p>
                          <p className={`text-2xl font-display font-bold ${t.color}`}>{(agent.rep / 100).toFixed(1)}</p>
                          <div className="flex justify-center mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor(agent.rep / 100) ? "text-[--gold-400] fill-[--gold-400]" : "text-[--neutral-700]"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[--text-muted] mb-1">Tasks</p>
                          <p className="text-2xl font-display font-bold text-white">{agent.tasks}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[--text-muted] mb-1">Earned</p>
                          <p className="text-2xl font-display font-bold text-[--cyan-400]">
                            ${earned > 0 ? earned.toFixed(2) : "0"}
                          </p>
                        </div>
                      </div>

                      {/* Mobile stats */}
                      <div className="flex sm:hidden flex-col items-end gap-1">
                        <span className={`text-lg font-bold ${t.color}`}>{(agent.rep / 100).toFixed(1)}★</span>
                        <span className="text-xs text-[--text-muted]">{agent.tasks} tasks</span>
                        <span className="text-xs text-[--cyan-400]">${earned.toFixed(2)}</span>
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
