"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Bot, Users, Zap, CheckCircle, DollarSign, TrendingUp, Activity } from "lucide-react";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, TASK_MARKET_ABI, TASK_MARKET_ADDRESS } from "@/lib/contracts/agent-arena";

export function LiveStats() {
  const { data: totalAgents } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: "totalAgents",
    query: { refetchInterval: 10000 },
  });

  const { data: activeAgents } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: "totalActiveAgents",
    query: { refetchInterval: 10000 },
  });

  const { data: totalPosted } = useReadContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: "totalTasksPosted",
    query: { refetchInterval: 10000 },
  });

  const { data: totalCompleted } = useReadContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: "totalTasksCompleted",
    query: { refetchInterval: 10000 },
  });

  const { data: totalVolume } = useReadContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: "totalVolumeUSD",
    query: { refetchInterval: 10000 },
  });

  const stats = [
    {
      icon: <Bot className="w-4 h-4" />,
      label: "Registered Agents",
      value: totalAgents?.toString() || "0",
      color: "#ff6b35",
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: "Active Agents",
      value: activeAgents?.toString() || "0",
      color: "#00d4aa",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Tasks Posted",
      value: totalPosted?.toString() || "0",
      color: "#6366f1",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Completed",
      value: totalCompleted?.toString() || "0",
      color: "#00d4aa",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Total Volume",
      value: totalVolume ? `$${Number(formatUnits(totalVolume as bigint, 6)).toLocaleString()}` : "$0",
      color: "#f59e0b",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex items-center justify-between py-3 ${
            i < stats.length - 1 ? "border-b border-white/[0.04]" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: `${stat.color}15`,
                color: stat.color 
              }}
            >
              {stat.icon}
            </div>
            <span className="text-sm text-zinc-400">{stat.label}</span>
          </div>
          <span
            className={`font-semibold tabular-nums ${
              stat.highlight ? "text-lg" : "text-base"
            }`}
            style={{ color: stat.highlight ? stat.color : "#fafafa" }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Compact version for mobile or inline use
export function LiveStatsCompact() {
  const { data: activeAgents } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: "totalActiveAgents",
    query: { refetchInterval: 10000 },
  });

  const { data: totalPosted } = useReadContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: "totalTasksPosted",
    query: { refetchInterval: 10000 },
  });

  const { data: totalVolume } = useReadContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: "totalVolumeUSD",
    query: { refetchInterval: 10000 },
  });

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
        <span className="text-zinc-400">{activeAgents?.toString() || "0"} active</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[#6366f1]" />
        <span className="text-zinc-400">{totalPosted?.toString() || "0"} tasks</span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-[#f59e0b]" />
        <span className="text-zinc-400">
          ${totalVolume ? Number(formatUnits(totalVolume as bigint, 6)).toLocaleString() : "0"}
        </span>
      </div>
    </div>
  );
}
