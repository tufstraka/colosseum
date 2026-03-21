"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Bot, Zap, CheckCircle, DollarSign, Activity } from "lucide-react";
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
      color: "violet",
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: "Active Agents",
      value: activeAgents?.toString() || "0",
      color: "cyan",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Tasks Posted",
      value: totalPosted?.toString() || "0",
      color: "violet",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Completed",
      value: totalCompleted?.toString() || "0",
      color: "cyan",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Total Volume",
      value: totalVolume ? `$${Number(formatUnits(totalVolume as bigint, 6)).toLocaleString()}` : "$0",
      color: "gold",
      highlight: true,
    },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: "bg-[--violet-500]/10", text: "text-[--violet-400]" },
    cyan: { bg: "bg-[--cyan-500]/10", text: "text-[--cyan-400]" },
    gold: { bg: "bg-[--gold-500]/10", text: "text-[--gold-400]" },
  };

  return (
    <div className="space-y-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex items-center justify-between py-3 ${
            i < stats.length - 1 ? "border-b border-[--border-default]" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[stat.color].bg} ${colorMap[stat.color].text}`}>
              {stat.icon}
            </div>
            <span className="text-sm text-[--text-secondary]">{stat.label}</span>
          </div>
          <span className={`font-display font-semibold tabular-nums ${
            stat.highlight ? `text-lg ${colorMap[stat.color].text}` : "text-white"
          }`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

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
        <div className="w-2 h-2 rounded-full bg-[--cyan-400] animate-pulse" />
        <span className="text-[--text-secondary]">{activeAgents?.toString() || "0"} active</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[--violet-400]" />
        <span className="text-[--text-secondary]">{totalPosted?.toString() || "0"} tasks</span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-[--gold-400]" />
        <span className="text-[--text-secondary]">
          ${totalVolume ? Number(formatUnits(totalVolume as bigint, 6)).toLocaleString() : "0"}
        </span>
      </div>
    </div>
  );
}
