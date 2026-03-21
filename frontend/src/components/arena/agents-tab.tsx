"use client";

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS } from "@/lib/contracts/agent-arena";
import { Bot, Trophy, Plus, ArrowRight, Star } from "lucide-react";
import { SKILL_LABELS, SKILL_ICONS } from "./constants";
import { Pagination, EmptyState, CardSkeleton } from "./ui";

interface AgentsTabProps {
  nextAgentId: number;
}

export function AgentsTab({ nextAgentId }: AgentsTabProps) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const agentIds = Array.from({ length: Math.max(0, nextAgentId - 1) }, (_, i) => i + 1);
  const totalPages = Math.ceil(agentIds.length / PAGE_SIZE);
  const pageIds = agentIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (agentIds.length === 0) {
    return (
      <EmptyState
        icon={<Bot className="w-12 h-12" />}
        title="No agents registered yet"
        description="Be the first to deploy an agent on Colosseum"
        action={
          <Link 
            href="/arena/deploy" 
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Deploy Agent
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> 
          On-Chain Agents 
          <span className="text-sm text-zinc-500 font-normal">({agentIds.length})</span>
        </h2>
        <Link 
          href="/arena/deploy" 
          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          Deploy yours <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {pageIds.map((id, i) => (
          <AgentRow key={id} agentId={id} rank={page * PAGE_SIZE + i + 1} />
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
      )}
    </div>
  );
}

function AgentRow({ agentId, rank }: { agentId: number; rank: number }) {
  const { data, isLoading } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS, 
    abi: AGENT_REGISTRY_ABI, 
    functionName: "getAgent", 
    args: [BigInt(agentId)],
    query: { refetchInterval: 10000 },
  });

  const { data: agentTaskIds } = useReadContract({
    address: TASK_MARKET_ADDRESS, 
    abi: TASK_MARKET_ABI, 
    functionName: "getAgentTaskIds", 
    args: [BigInt(agentId)],
    query: { refetchInterval: 10000 },
  });

  if (isLoading) return <CardSkeleton />;
  if (!data) return null;

  const [owner, wallet, name, description, primarySkill, pricePerTask, totalTasks, totalEarnings, repScore, totalRatings, isActive] = data as unknown as any[];
  const skillIdx = Number(primarySkill);
  const rep = Number(repScore);
  const taskCount = (agentTaskIds as bigint[])?.length || Number(totalTasks);
  const earnedOnChain = Number(formatUnits(totalEarnings, 6));
  const pendingCount = taskCount - Number(totalTasks);

  const rankColors: Record<number, string> = {
    1: "bg-yellow-500/20 text-yellow-500",
    2: "bg-zinc-400/20 text-zinc-400",
    3: "bg-orange-700/20 text-orange-500",
  };

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors group">
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          rankColors[rank] || "bg-zinc-800 text-zinc-500"
        }`}>
          #{rank}
        </div>
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg">{SKILL_ICONS[skillIdx] || "🤖"}</span>
            <span className="font-semibold text-white">{name || `Agent #${agentId}`}</span>
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
              {SKILL_LABELS[skillIdx] || "General"}
            </span>
            {!isActive && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Inactive</span>
            )}
            {rep >= 400 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs flex items-center gap-0.5">
                <Star className="w-3 h-3" /> Top Rated
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 truncate">{description || "No description"}</p>
        </div>
        
        {/* Stats - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <StatColumn label="Rating" value={`${(rep / 100).toFixed(1)}★`} color="text-yellow-500" />
          <StatColumn 
            label="Tasks" 
            value={taskCount.toString()} 
            subValue={pendingCount > 0 ? `(${pendingCount} pending)` : undefined}
            color="text-white" 
          />
          <StatColumn 
            label="Earned" 
            value={earnedOnChain > 0 ? `$${earnedOnChain.toFixed(2)}` : taskCount > 0 ? "pending" : "$0.00"} 
            color="text-emerald-500" 
          />
          <StatColumn label="Price" value={`$${formatUnits(pricePerTask, 6)}`} color="text-white" />
        </div>
      </div>
      
      {/* Stats - Mobile */}
      <div className="flex md:hidden items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
        <StatColumn label="Rating" value={`${(rep / 100).toFixed(1)}★`} color="text-yellow-500" />
        <StatColumn label="Tasks" value={taskCount.toString()} color="text-white" />
        <StatColumn 
          label="Earned" 
          value={earnedOnChain > 0 ? `$${earnedOnChain.toFixed(2)}` : "$0"} 
          color="text-emerald-500" 
        />
      </div>
    </div>
  );
}

function StatColumn({ 
  label, 
  value, 
  subValue, 
  color = "text-white" 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="text-center min-w-[60px]">
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className={`font-bold ${color}`}>
        {value}
        {subValue && <span className="text-xs text-yellow-400 ml-1">{subValue}</span>}
      </p>
    </div>
  );
}
