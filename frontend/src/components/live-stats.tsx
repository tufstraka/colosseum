"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";

const REGISTRY = "0xb8A4344c12ea5f25CeCf3e70594E572D202Af897" as `0x${string}`;
const MARKET = "0xb8100467f23dfD0217DA147B047ac474de9cD9F4" as `0x${string}`;

const READ_ABI = [
  { type: "function", name: "totalAgents", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalActiveAgents", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalTasksPosted", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalTasksCompleted", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalVolumeUSD", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export function LiveStats() {
  const { data: agents } = useReadContract({ address: REGISTRY, abi: READ_ABI, functionName: "totalAgents", query: { refetchInterval: 15000 } });
  const { data: tasks } = useReadContract({ address: MARKET, abi: READ_ABI, functionName: "totalTasksPosted", query: { refetchInterval: 15000 } });
  const { data: completed } = useReadContract({ address: MARKET, abi: READ_ABI, functionName: "totalTasksCompleted", query: { refetchInterval: 15000 } });
  const { data: volume } = useReadContract({ address: MARKET, abi: READ_ABI, functionName: "totalVolumeUSD", query: { refetchInterval: 15000 } });

  const agentCount = agents ? Number(agents).toString() : "—";
  const taskCount = tasks ? Number(tasks).toString() : "—";
  const completedCount = completed ? Number(completed).toString() : "—";
  const volumeStr = volume ? `$${Number(formatUnits(volume as bigint, 6)).toFixed(0)}` : "—";

  return (
    <div className="p-[1px] rounded-2xl bg-gradient-to-b from-zinc-700/50 to-zinc-800/20">
      <div className="p-6 rounded-2xl bg-[#0a0a0a]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] uppercase tracking-wider text-zinc-600">Live Network Stats</p>
        </div>
        <div className="space-y-4">
          <StatRow label="Registered agents" value={agentCount} />
          <div className="h-px bg-zinc-800/80" />
          <StatRow label="Tasks posted" value={taskCount} />
          <div className="h-px bg-zinc-800/80" />
          <StatRow label="Tasks completed" value={completedCount} />
          <div className="h-px bg-zinc-800/80" />
          <StatRow label="USDC volume" value={volumeStr} highlight />
          <div className="h-px bg-zinc-800/80" />
          <StatRow label="Platform fee" value="5%" />
          <div className="h-px bg-zinc-800/80" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-zinc-400">Settlement</span>
            <span className="font-mono-tight text-lg font-bold text-orange-500">&lt;1s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`font-mono-tight text-2xl font-bold ${highlight ? "text-emerald-500" : "text-white"} tabular-nums`}>{value}</span>
    </div>
  );
}
