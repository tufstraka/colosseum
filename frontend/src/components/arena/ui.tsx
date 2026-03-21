"use client";

import { cn } from "@/lib/utils";

// Stat Card Component
export function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    orange: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    yellow: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  };

  const iconColorClasses: Record<string, string> = {
    orange: "text-orange-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border bg-gradient-to-br",
      colorClasses[color] || colorClasses.blue
    )}>
      <div className={cn("mb-2", iconColorClasses[color] || iconColorClasses.blue)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

// Progress Step Component
export function ProgressStep({ 
  label, 
  done, 
  active 
}: { 
  label: string; 
  done: boolean; 
  active: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      done ? "text-emerald-400" : active ? "text-indigo-400" : "text-zinc-600"
    )}>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-xs border",
        done 
          ? "bg-emerald-500 border-emerald-500 text-white" 
          : active 
            ? "border-indigo-500 text-indigo-400" 
            : "border-zinc-700"
      )}>
        {done ? "✓" : ""}
      </div>
      {label}
    </div>
  );
}

// Pagination Component
export function Pagination({ 
  page, 
  totalPages, 
  onPageChange 
}: { 
  page: number; 
  totalPages: number; 
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      <span className="text-sm text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}

// On-chain Task Posted Confirmation
export function OnChainTaskPosted({ 
  postTx, 
  bounty 
}: { 
  postTx: string; 
  bounty: string;
}) {
  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          ✓
        </div>
        <div>
          <p className="font-medium text-emerald-400">Task Posted On-Chain!</p>
          <p className="text-xs text-zinc-500">${bounty} USDC escrowed</p>
        </div>
      </div>
      <a
        href={`https://blockscout-testnet.polkadot.io/tx/${postTx}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-emerald-400 hover:underline font-mono"
      >
        View transaction →
      </a>
    </div>
  );
}

// Skill Badge Component
export function SkillBadge({ 
  skillTag, 
  size = "sm" 
}: { 
  skillTag: number; 
  size?: "sm" | "md";
}) {
  const { SKILL_LABELS, SKILL_ICONS, SKILL_COLORS } = require("./constants");
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
      SKILL_COLORS[skillTag] || SKILL_COLORS[0],
      size === "md" ? "text-sm px-3 py-1" : "text-xs"
    )}>
      <span>{SKILL_ICONS[skillTag]}</span>
      <span>{SKILL_LABELS[skillTag]}</span>
    </span>
  );
}

// Status Badge Component
export function StatusBadge({ status }: { status: number }) {
  const { STATUS_LABELS, STATUS_COLORS } = require("./constants");
  
  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded-full",
      STATUS_COLORS[status] || STATUS_COLORS[0]
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// Loading Skeleton
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse bg-zinc-800 rounded",
      className
    )} />
  );
}

// Card Skeleton for loading states
export function CardSkeleton() {
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
export function EmptyState({ 
  icon, 
  title, 
  description,
  action
}: { 
  icon: React.ReactNode;
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
      <div className="text-zinc-600 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
