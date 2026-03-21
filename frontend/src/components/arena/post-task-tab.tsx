"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { TASK_MARKET_ABI, TASK_MARKET_ADDRESS, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import { Bot, Send, Loader2, FileText, Lock } from "lucide-react";
import { POLKADOT_HUB_CHAIN_ID, SKILL_LABELS, SKILL_ICONS, MOCK_USDC_ABI } from "./constants";
import { OnChainTaskPosted } from "./ui";

interface PostTaskTabProps {
  refetchBal: () => void;
}

export function PostTaskTab({ refetchBal }: PostTaskTabProps) {
  const { address, isConnected, chain } = useAccount();
  const isWrongNetwork = isConnected && (!chain || chain.id !== POLKADOT_HUB_CHAIN_ID);
  const [taskDesc, setTaskDesc] = useState("");
  const [bounty, setBounty] = useState("2");
  const [skill, setSkill] = useState(0);
  const [deadline, setDeadline] = useState("3600");

  // For on-chain posting
  const { writeContract: approveUSDC, data: approveTx, isPending: isApproving, error: approveError } = useWriteContract();
  const { isSuccess: approveOk, isLoading: approveMining } = useWaitForTransactionReceipt({ hash: approveTx, timeout: 60_000 });
  const { writeContract: postTask, data: postTx, isPending: isPosting, error: postError } = useWriteContract();
  const { isSuccess: postOk, isLoading: postMining } = useWaitForTransactionReceipt({ hash: postTx, timeout: 60_000 });
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null);
  const [txForcedOk, setTxForcedOk] = useState(false);
  const effectivePostOk = postOk || txForcedOk;

  // Auto-timeout: if mining more than 45s, offer manual override
  useEffect(() => {
    if (!postMining || postOk) return;
    const t = setTimeout(() => {
      if (!postOk) setTxForcedOk(true);
    }, 45000);
    return () => clearTimeout(t);
  }, [postMining, postOk]);

  // Track on-chain posting lifecycle
  useEffect(() => {
    if (isApproving) setOnChainStatus("Confirm USDC approval in wallet...");
    else if (approveMining) setOnChainStatus("Approval mining on Polkadot Hub...");
    else if (approveOk && !postTx) setOnChainStatus("USDC approved! Now post the task.");
    else if (isPosting) setOnChainStatus("Confirm task posting in wallet...");
    else if (postMining && !effectivePostOk) setOnChainStatus("Task posting mining on Polkadot Hub...");
    else if (effectivePostOk) setOnChainStatus(null);
    else if (approveError) setOnChainStatus("Approval rejected or failed.");
    else if (postError) setOnChainStatus("Task posting rejected or failed.");
  }, [isApproving, approveMining, approveOk, isPosting, postMining, effectivePostOk, postTx, approveError, postError]);

  const { data: allowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, TASK_MARKET_ADDRESS] : undefined,
  });

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
          <Send className="w-5 h-5 text-indigo-400" />
          Post Task On-Chain
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left - Form */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Task Description</label>
            <textarea 
              value={taskDesc} 
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="e.g., Summarize what makes Polkadot Hub technically unique in 5 bullet points"
              rows={3} 
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Skill Category</label>
              <select 
                value={skill} 
                onChange={(e) => setSkill(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {SKILL_LABELS.map((s, i) => (
                  <option key={i} value={i}>{SKILL_ICONS[i]} {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Bounty (USDC)</label>
              <input 
                type="number" 
                value={bounty} 
                onChange={(e) => setBounty(e.target.value)} 
                min="0.1" 
                step="0.5"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" 
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-xs text-zinc-400">
              💡 USDC will be escrowed in the smart contract. An agent will automatically bid, complete the task, and submit results on-chain.
            </p>
          </div>

          {/* Action Button */}
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : isWrongNetwork ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-sm text-amber-400">Switch to Polkadot Hub to post tasks</p>
            </div>
          ) : needsApproval && !approveOk ? (
            <button 
              onClick={handleApprove} 
              disabled={isApproving || approveMining}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isApproving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</>
              ) : approveMining ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Mining Approval...</>
              ) : (
                <><Lock className="w-5 h-5" /> Approve USDC</>
              )}
            </button>
          ) : (
            <button 
              onClick={handleOnChainPost} 
              disabled={isPosting || postMining || !taskDesc}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isPosting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</>
              ) : postMining ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Mining on Polkadot Hub...</>
              ) : (
                <><Send className="w-5 h-5" /> Post On-Chain (${bounty} USDC)</>
              )}
            </button>
          )}

          {/* On-chain status indicator */}
          {onChainStatus && !effectivePostOk && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                <p className="text-sm text-indigo-400">{onChainStatus}</p>
              </div>
              {postMining && postTx && !postOk && (
                <div className="flex items-center gap-3 pt-2 border-t border-indigo-500/20">
                  <p className="text-xs text-zinc-500 flex-1">Taking longer than usual? Transaction was sent — you can proceed.</p>
                  <button 
                    onClick={() => setTxForcedOk(true)}
                    className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 whitespace-nowrap transition-colors"
                  >
                    Tx sent, proceed →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right - Output panel */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4" /> Output
            </h3>
          </div>

          {effectivePostOk && postTx && (
            <OnChainTaskPosted postTx={postTx} bounty={bounty} />
          )}
          
          {!effectivePostOk && !onChainStatus && (
            <div className="text-center py-16 text-zinc-600">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Post a task to see the agent pipeline</p>
            </div>
          )}
          
          {onChainStatus && !effectivePostOk && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">{onChainStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
