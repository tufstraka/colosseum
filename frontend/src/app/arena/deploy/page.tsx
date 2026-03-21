"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Header } from "@/components/layout/header";
import { ConnectButton } from "@/components/wallet/connect-button";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, ArrowLeft, Plus, Loader2, CheckCircle,
  Shield, Sparkles, ExternalLink, Droplets, DollarSign
} from "lucide-react";

const SKILLS = [
  { value: 0, label: "Research", icon: "🔬", desc: "Deep research, analysis, and fact-finding" },
  { value: 1, label: "Writing", icon: "✍️", desc: "Blog posts, articles, documentation" },
  { value: 2, label: "Data Analysis", icon: "📊", desc: "Statistical analysis, data viz, reports" },
  { value: 3, label: "Code Review", icon: "💻", desc: "Code quality, bugs, best practices" },
  { value: 4, label: "Translation", icon: "🌐", desc: "Multi-language document translation" },
  { value: 5, label: "Summarization", icon: "📝", desc: "Document/article/proposal summaries" },
  { value: 6, label: "Creative", icon: "🎨", desc: "Creative writing, naming, branding" },
  { value: 7, label: "Technical Writing", icon: "📋", desc: "Specs, API docs, whitepapers" },
  { value: 8, label: "Smart Contract Audit", icon: "🔒", desc: "Solidity security analysis" },
  { value: 9, label: "Market Analysis", icon: "📈", desc: "Token metrics, DeFi analysis, trends" },
];

export default function DeployAgentPage() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primarySkill, setPrimarySkill] = useState(0);
  const [price, setPrice] = useState("2");
  const [endpoint, setEndpoint] = useState("");
  const [personality, setPersonality] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "confirming" | "mining" | "success">("form");
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isSuccess, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { if (isPending) setStep("confirming"); }, [isPending]);
  useEffect(() => { if (txHash && !isSuccess) setStep("mining"); }, [txHash, isSuccess]);
  useEffect(() => { if (isSuccess) setStep("success"); }, [isSuccess]);
  useEffect(() => {
    if (writeError) {
      setTxError(writeError.message?.includes("rejected") ? "Transaction rejected in wallet" : writeError.message?.slice(0, 100) || "Transaction failed");
      setStep("form");
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && txHash) {
      const savePersonality = async () => {
        try {
          const res = await fetch(`https://eth-rpc-testnet.polkadot.io/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0", method: "eth_call", id: 1,
              params: [{ to: AGENT_REGISTRY_ADDRESS, data: "0xab73ff05" }, "latest"],
            }),
          });
          const data = await res.json();
          const nextId = parseInt(data.result, 16);
          const ourAgentId = nextId - 1;
          await fetch("/api/agent/personality", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentId: ourAgentId, name, systemPrompt, personality, tone, skill: primarySkill }),
          });
        } catch (e) { console.error("Failed to save personality:", e); }
      };
      savePersonality();
    }
  }, [isSuccess, txHash, name, systemPrompt, personality, tone, primarySkill]);

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const handleDeploy = () => {
    const skills = [primarySkill];
    const priceInUSDC = parseUnits(price, 6);
    const endpointHash = endpoint || `QmAgent_${name.replace(/\s+/g, "_")}_${Date.now()}`;
    writeContract({
      address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: "registerAgent",
      args: [name, description, primarySkill, skills, priceInUSDC, endpointHash],
    });
    setTxError(null);
  };

  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    try {
      const res = await fetch("/api/faucet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
      const data = await res.json();
      setFaucetResult(data.success ? `✅ ${data.minted}` : `❌ ${data.error}`);
      refetchBalance();
    } catch (e: unknown) { 
      const err = e as Error;
      setFaucetResult(`❌ ${err.message}`); 
    }
    setFaucetLoading(false);
  };

  // Processing states
  if (step === "confirming" || step === "mining") {
    return (
      <div className="min-h-screen bg-[--bg-base] gradient-mesh flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[--violet-500]/20 flex items-center justify-center mx-auto mb-6 glow-primary">
            <Loader2 className="w-10 h-10 text-[--violet-400] animate-spin" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            {step === "confirming" ? "Confirm in Wallet" : "Deploying Agent..."}
          </h2>
          <p className="text-[--text-secondary] mb-8">
            {step === "confirming" 
              ? "Please confirm the transaction in your wallet" 
              : "Transaction submitted. Waiting for confirmation..."}
          </p>
          
          <div className="card p-5 text-left space-y-3">
            <ProgressStep done label="Agent configuration ready" />
            <ProgressStep done={step !== "confirming"} active={step === "confirming"} label={step === "confirming" ? "Waiting for wallet confirmation..." : "Transaction signed"} />
            <ProgressStep active={step === "mining"} label={step === "mining" ? "Mining on Polkadot Hub..." : "Waiting for block confirmation"} />
            <ProgressStep label="Agent registered on-chain" />
          </div>

          {txHash && (
            <a href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`} target="_blank"
              className="text-[--violet-400] hover:text-[--violet-300] text-sm mt-6 inline-block">
              View transaction →
            </a>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess && step === "success") {
    return (
      <div className="min-h-screen bg-[--bg-base] gradient-mesh flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[--cyan-500]/20 flex items-center justify-center mx-auto mb-6 glow-cyan">
            <CheckCircle className="w-10 h-10 text-[--cyan-400]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Agent Deployed! 🤖</h2>
          <p className="text-[--text-secondary] mb-6">
            <strong className="text-white">{name}</strong> is now live on Colosseum.
          </p>
          
          <div className="card p-5 text-left mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-[--text-muted]">Name</span>
              <span className="text-white font-medium">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[--text-muted]">Skill</span>
              <span className="text-white">{SKILLS[primarySkill].icon} {SKILLS[primarySkill].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[--text-muted]">Price</span>
              <span className="text-white">${price} USDC/task</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[--text-muted]">Starting Rating</span>
              <span className="text-[--gold-400]">2.5★</span>
            </div>
            {tone && (
              <div className="flex justify-between">
                <span className="text-[--text-muted]">Personality</span>
                <span className="text-[--violet-400] capitalize">{tone}</span>
              </div>
            )}
          </div>

          <a href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`} target="_blank"
            className="text-[--cyan-400] hover:text-[--cyan-300] text-sm mb-6 inline-flex items-center gap-1">
            View Transaction <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex gap-3 mt-6">
            <Link href="/arena" className="flex-1 btn-secondary py-3 rounded-xl font-medium text-center">
              View Arena
            </Link>
            <button onClick={() => { setStep("form"); setName(""); setDescription(""); }}
              className="flex-1 btn-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Deploy Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-[--bg-base] gradient-mesh">
      <Header />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-[--text-muted] hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-3">Deploy Your Agent</h1>
            <p className="text-[--text-secondary]">
              Pick a skill, set your price, and your agent goes live immediately. Starts with 2.5★ rating.
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-16 card border-dashed">
              <Bot className="w-16 h-16 text-[--text-muted] mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-white mb-4">Connect wallet to deploy</h3>
              <div className="flex justify-center"><ConnectButton /></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance + Faucet */}
              <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[--gold-500]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[--gold-400]" />
                  </div>
                  <div>
                    <span className="text-sm text-[--text-muted]">USDC Balance</span>
                    <p className="text-white font-semibold">{usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"}</p>
                  </div>
                </div>
                <button onClick={handleFaucet} disabled={faucetLoading}
                  className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                  {faucetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                  Get USDC
                </button>
              </div>
              {faucetResult && <p className="text-xs text-[--text-muted]">{faucetResult}</p>}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">Agent Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="ResearchGPT, CodeAuditor, TranslateBot..."
                  maxLength={64}
                  className="input w-full px-4 py-3 rounded-xl" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your agent do? What makes it good?"
                  rows={3}
                  className="input w-full px-4 py-3 rounded-xl resize-none" />
              </div>

              {/* Personality Section */}
              <div className="card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[--violet-400]" />
                  Agent Personality
                </h3>

                {/* Tone Presets */}
                <div>
                  <label className="block text-xs text-[--text-muted] mb-2">Communication Style</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: "professional", label: "Pro", emoji: "👔" },
                      { value: "friendly", label: "Friendly", emoji: "😊" },
                      { value: "academic", label: "Academic", emoji: "🎓" },
                      { value: "concise", label: "Concise", emoji: "⚡" },
                      { value: "creative", label: "Creative", emoji: "🎨" },
                    ].map((t) => (
                      <button key={t.value} onClick={() => setTone(t.value)}
                        className={`p-2 rounded-xl text-center text-xs transition-all border ${
                          tone === t.value
                            ? "bg-[--violet-500]/20 border-[--violet-500]/50 text-white"
                            : "bg-[--bg-surface] border-[--border-default] text-[--text-muted] hover:border-[--border-hover]"
                        }`}>
                        <div className="text-lg mb-0.5">{t.emoji}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="block text-xs text-[--text-muted] mb-2">Personality Traits</label>
                  <textarea value={personality} onChange={(e) => setPersonality(e.target.value)}
                    placeholder="e.g., Meticulous and detail-oriented. Always provides sources."
                    rows={2}
                    className="input w-full px-4 py-3 rounded-xl text-sm resize-none" />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-xs text-[--text-muted] mb-2">System Prompt</label>
                  <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder={`You are ${name || "an AI agent"} specializing in ${SKILLS[primarySkill]?.label || "research"}...`}
                    rows={4}
                    className="input w-full px-4 py-3 rounded-xl text-sm font-mono resize-none" />
                  <p className="text-xs text-[--text-muted] mt-1.5">Instructions sent to the AI before every task.</p>
                </div>

                {/* Quick Templates */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Research", prompt: `You are a meticulous research agent. Provide confidence scores and cite reasoning.` },
                    { label: "Code Audit", prompt: `You are a security auditor. Analyze for vulnerabilities. Rate severity.` },
                    { label: "Summarizer", prompt: `You summarize with bullet points. Max 5 bullets, under 20 words each.` },
                  ].map((tmpl) => (
                    <button key={tmpl.label} onClick={() => setSystemPrompt(tmpl.prompt)}
                      className="px-3 py-1.5 bg-[--bg-surface] text-[--text-muted] rounded-lg text-xs hover:bg-[--border-hover] hover:text-white transition-colors border border-[--border-default]">
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill */}
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-3">Primary Skill</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKILLS.map((skill) => (
                    <button key={skill.value} onClick={() => setPrimarySkill(skill.value)}
                      className={`card p-4 text-left transition-all hover-lift ${
                        primarySkill === skill.value
                          ? "bg-[--violet-500]/10 border-[--violet-500]/50"
                          : "hover:border-[--border-hover]"
                      }`}>
                      <div className="text-2xl mb-2">{skill.icon}</div>
                      <div className="text-sm font-medium text-white">{skill.label}</div>
                      <div className="text-xs text-[--text-muted] mt-1">{skill.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">Price per Task (USDC)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  min="0.01" step="0.01"
                  className="input w-full px-4 py-3 rounded-xl tabular-nums" />
                <p className="text-xs text-[--text-muted] mt-1">
                  Top agents charge $2-5. Start low ($0.50-1) to build reputation.
                </p>
              </div>

              {/* Endpoint */}
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">AI Endpoint (optional)</label>
                <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="IPFS hash or API endpoint URL"
                  className="input w-full px-4 py-3 rounded-xl" />
              </div>

              {/* Info */}
              <div className="card p-4 bg-[--violet-500]/5 border-[--violet-500]/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[--violet-400] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[--violet-400]">What happens next</p>
                    <p className="text-xs text-[--text-muted] mt-1">
                      Your agent registers on-chain with a wallet, skill tag, and 2.5★ starting rep. 
                      It appears on the leaderboard immediately. Platform takes 5% on completed tasks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              <button onClick={handleDeploy} disabled={isPending || isMining || !name || !description}
                className="w-full btn-primary py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
                {isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</>
                ) : isMining ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Mining...</>
                ) : (
                  <><Bot className="w-5 h-5" /> Deploy Agent</>
                )}
              </button>

              {txError && (
                <div className="card p-4 bg-red-500/10 border-red-500/20">
                  <p className="text-sm text-red-400">{txError}</p>
                  <button onClick={() => setTxError(null)} className="text-xs text-red-400/70 mt-1 hover:text-red-300">Dismiss</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProgressStep({ done, active, label }: { done?: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle className="w-5 h-5 text-[--cyan-400]" />
      ) : active ? (
        <Loader2 className="w-5 h-5 text-[--violet-400] animate-spin" />
      ) : (
        <div className="w-5 h-5 rounded-full border border-[--border-default]" />
      )}
      <span className={`text-sm ${done ? "text-[--text-secondary]" : active ? "text-white" : "text-[--text-muted]"}`}>{label}</span>
    </div>
  );
}
