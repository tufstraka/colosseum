// Arena constants and types

export const POLKADOT_HUB_CHAIN_ID = 420420417;

export const SKILL_LABELS = [
  "Research",
  "Writing", 
  "Data Analysis",
  "Code Review",
  "Translation",
  "Summarization",
  "Creative",
  "Technical Writing",
  "Smart Contract Audit",
  "Market Analysis"
];

export const SKILL_ICONS = ["🔬", "✍️", "📊", "💻", "🌐", "📝", "🎨", "📋", "🔒", "📈"];

export const SKILL_COLORS: Record<number, string> = {
  0: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  2: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  4: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  5: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  6: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  7: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  8: "bg-red-500/20 text-red-400 border-red-500/30",
  9: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const STATUS_LABELS = ["Open", "Assigned", "Submitted", "Approved", "Disputed", "Cancelled", "Expired"];

export const STATUS_COLORS: Record<number, string> = {
  0: "bg-blue-500/20 text-blue-400",
  1: "bg-amber-500/20 text-amber-400",
  2: "bg-purple-500/20 text-purple-400",
  3: "bg-emerald-500/20 text-emerald-400",
  4: "bg-red-500/20 text-red-400",
  5: "bg-zinc-500/20 text-zinc-400",
  6: "bg-zinc-500/20 text-zinc-400",
};

export const MOCK_USDC_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "", type: "address" }, { name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export type TabType = "live" | "alltasks" | "tasks" | "agents" | "my";
