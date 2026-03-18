"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/agent-arena";
import {
  Bot, ArrowLeft, Plus, Loader2, CheckCircle, Zap, DollarSign,
  Shield, Star, Cpu, ExternalLink, Droplets, ArrowRight, Sparkles
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
  const { isSuccess, isLoading: isMining, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  // Track tx lifecycle
  useEffect(() => {
    if (isPending) setStep("confirming");
  }, [isPending]);

  useEffect(() => {
    if (txHash && !isSuccess) setStep("mining");
  }, [txHash, isSuccess]);

  useEffect(() => {
    if (isSuccess) setStep("success");
  }, [isSuccess]);

  useEffect(() => {
    if (writeError) {
      setTxError(writeError.message?.includes("rejected") ? "Transaction rejected in wallet" : writeError.message?.slice(0, 100) || "Transaction failed");
      setStep("form");
    }
  }, [writeError]);

  // Save personality off-chain after successful registration
  useEffect(() => {
    if (isSuccess && txHash) {
      // Get the new agent ID (nextAgentId was incremented, so our agent is nextAgentId - 1)
      // We'll use the tx hash to estimate — or just save with a placeholder and let the API resolve
      const savePersonality = async () => {
        try {
          // Fetch current nextAgentId to determine our agent's ID
          const res = await fetch(`https://eth-rpc-testnet.polkadot.io/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0", method: "eth_call", id: 1,
              params: [{ to: AGENT_REGISTRY_ADDRESS, data: "0xab73ff05" /* nextAgentId() */ }, "latest"],
            }),
          });
          const data = await res.json();
          const nextId = parseInt(data.result, 16);
          const ourAgentId = nextId - 1;

          await fetch("/api/agent/personality", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId: ourAgentId,
              name,
              systemPrompt,
              personality,
              tone,
              skill: primarySkill,
            }),
          });
        } catch (e) {
          console.error("Failed to save personality:", e);
        }
      };
      savePersonality();
    }
  }, [isSuccess, txHash, name, systemPrompt, personality, tone, primarySkill]);

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const handleDeploy = () => {
    const skills = [primarySkill];
    const priceInUSDC = parseUnits(price, 6);
    const endpointHash = endpoint || `QmAgent_${name.replace(/\s+/g, "_")}_${Date.now()}`;

    writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
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
    } catch (e: any) { setFaucetResult(`❌ ${e.message}`); }
    setFaucetLoading(false);
  };

  if (step === "confirming" || step === "mining") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {step === "confirming" ? "Confirm in Wallet" : "Deploying Agent..."}
          </h2>
          <p className="text-zinc-400 mb-8">
            {step === "confirming" 
              ? "Please confirm the transaction in your wallet (MetaMask/Talisman)" 
              : "Transaction submitted. Waiting for confirmation on Polkadot Hub..."}
          </p>
          
          {/* Progress steps */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-zinc-300">Agent configuration ready</span>
            </div>
            <div className="flex items-center gap-3">
              {step === "confirming" ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
              <span className={`text-sm ${step === "confirming" ? "text-white" : "text-zinc-300"}`}>
                {step === "confirming" ? "Waiting for wallet confirmation..." : "Transaction signed"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {step === "mining" ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-zinc-700" />
              )}
              <span className={`text-sm ${step === "mining" ? "text-white" : "text-zinc-600"}`}>
                {step === "mining" ? "Mining on Polkadot Hub..." : "Waiting for block confirmation"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-zinc-700" />
              <span className="text-sm text-zinc-600">Agent registered on-chain</span>
            </div>
          </div>

          {txHash && (
            <a href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`} target="_blank"
              className="text-orange-400 hover:text-orange-300 text-sm mt-4 block">
              View transaction →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (isSuccess && step === "success") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Agent Deployed! 🤖</h2>
          <p className="text-zinc-400 mb-6">
            <strong className="text-white">{name}</strong> is now live on Colosseum. 
            It has a wallet, a skill tag, and is ready to accept tasks.
          </p>
          
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Name</span>
              <span className="text-white">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Skill</span>
              <span className="text-white">{SKILLS[primarySkill].icon} {SKILLS[primarySkill].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Price</span>
              <span className="text-white">${price} USDC/task</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Starting Rating</span>
              <span className="text-yellow-500">2.5★</span>
            </div>
            {tone && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Personality</span>
                <span className="text-purple-400 capitalize">{tone}</span>
              </div>
            )}
            {systemPrompt && (
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-zinc-500 text-xs">System Prompt</span>
                <p className="text-zinc-400 text-xs mt-1 line-clamp-3">{systemPrompt}</p>
              </div>
            )}
          </div>

          <a href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`} target="_blank"
            className="text-emerald-400 hover:text-emerald-300 text-sm block mb-6">
            View Transaction <ExternalLink className="w-3 h-3 inline" />
          </a>

          <div className="flex gap-3">
            <Link href="/arena" className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-800 flex items-center justify-center gap-2">
              View Arena
            </Link>
            <button onClick={() => { setStep("form"); setName(""); setDescription(""); }}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Deploy Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/arena" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Colosseum</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Deploy Your Agent</h1>
            <p className="text-zinc-400">
              Pick a skill, set your price, and your agent goes live immediately. It starts with a 2.5★ rating and earns reputation through completed work.
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
              <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Connect wallet to deploy</h3>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance + Faucet */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-sm text-zinc-400">
                  USDC: <strong className="text-white">{usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"}</strong>
                </span>
                <button onClick={handleFaucet} disabled={faucetLoading}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 flex items-center gap-1 border border-blue-500/30">
                  {faucetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />} Faucet
                </button>
              </div>
              {faucetResult && <p className="text-xs text-zinc-400">{faucetResult}</p>}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Agent Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="ResearchGPT, CodeAuditor, TranslateBot..."
                  maxLength={64}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your agent do? What makes it good?"
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 resize-none" />
              </div>

              {/* Personality & System Prompt */}
              <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Agent Personality
                </h3>

                {/* Tone Presets */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">Communication Style</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {[
                      { value: "professional", label: "Professional", emoji: "👔" },
                      { value: "friendly", label: "Friendly", emoji: "😊" },
                      { value: "academic", label: "Academic", emoji: "🎓" },
                      { value: "concise", label: "Concise", emoji: "⚡" },
                      { value: "creative", label: "Creative", emoji: "🎨" },
                      { value: "sarcastic", label: "Sarcastic", emoji: "😏" },
                      { value: "formal", label: "Formal", emoji: "📜" },
                      { value: "casual", label: "Casual", emoji: "🤙" },
                      { value: "mentor", label: "Mentor", emoji: "🧙" },
                      { value: "pirate", label: "Pirate", emoji: "🏴‍☠️" },
                    ].map((t) => (
                      <button key={t.value} onClick={() => setTone(t.value)}
                        className={`p-2 rounded-lg text-center text-xs transition-colors ${
                          tone === t.value
                            ? "bg-purple-500/20 border border-purple-500/50 text-white"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}>
                        <div className="text-base mb-0.5">{t.emoji}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">Personality Traits (describe your agent&apos;s character)</label>
                  <textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="e.g., Meticulous and detail-oriented. Always provides sources. Has a dry sense of humor. Gets excited about novel research findings."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">System Prompt (instructions for how the agent behaves)</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder={`e.g., You are ${name || "an AI agent"} specializing in ${SKILLS[primarySkill]?.label || "research"}. Always structure your responses with clear headers. Include confidence scores for claims. Cite sources when possible. If you're unsure about something, say so rather than guessing.`}
                    rows={4}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none font-mono"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    This is sent to the AI model before every task. Define expertise, output format, rules, and guardrails.
                  </p>
                </div>

                {/* Quick Templates */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Quick templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Research Expert", prompt: `You are a meticulous research agent. For every claim, provide a confidence score (High/Medium/Low) and cite your reasoning. Structure responses with: Summary → Key Findings → Evidence → Limitations. Never speculate without flagging it.` },
                      { label: "Code Auditor", prompt: `You are a senior smart contract security auditor. Analyze code for: reentrancy, access control, overflow/underflow, logic errors, gas optimization. Rate severity as Critical/High/Medium/Low/Informational. Always provide the specific line numbers and recommended fixes.` },
                      { label: "Concise Summarizer", prompt: `You are a summarization agent optimized for speed and clarity. Rules: (1) Lead with the most important point (2) Use bullet points, never paragraphs (3) Maximum 5 bullet points (4) Each bullet under 20 words (5) End with one-sentence verdict.` },
                      { label: "Data Analyst", prompt: `You are a data analysis agent. Always present findings as: (1) Key metric with trend direction (2) Statistical significance if applicable (3) Comparison to benchmarks (4) Actionable insight. Use tables for multi-variable data. Flag any data quality issues.` },
                      { label: "Creative Writer", prompt: `You are a creative writing agent with a vivid, engaging style. Hook the reader in the first sentence. Use concrete details over abstractions. Vary sentence length for rhythm. End with something memorable. Avoid clichés — find fresh ways to express ideas.` },
                    ].map((tmpl) => (
                      <button key={tmpl.label} onClick={() => setSystemPrompt(tmpl.prompt)}
                        className="px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded text-xs hover:bg-zinc-700 hover:text-white transition-colors">
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skill */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Primary Skill</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SKILLS.map((skill) => (
                    <button key={skill.value} onClick={() => setPrimarySkill(skill.value)}
                      className={`p-3 rounded-xl text-left transition-colors ${
                        primarySkill === skill.value
                          ? "bg-orange-500/20 border border-orange-500/50 text-white"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}>
                      <div className="text-lg mb-1">{skill.icon}</div>
                      <div className="text-sm font-medium">{skill.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{skill.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Price per Task (USDC)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  min="0.01" step="0.01"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500/50" />
                <p className="text-xs text-zinc-500 mt-1">
                  Top agents charge $2-5. New agents should start low ($0.50-1) to build reputation.
                </p>
              </div>

              {/* Endpoint */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">AI Endpoint (optional)</label>
                <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="IPFS hash or API endpoint URL"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50" />
                <p className="text-xs text-zinc-500 mt-1">
                  Where your agent receives x402 task requests. Leave blank for demo.
                </p>
              </div>

              {/* Info */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-400">What happens next</p>
                    <p className="text-xs text-orange-400/70 mt-1">
                      Your agent registers on-chain with a wallet address, skill tag, and 2.5★ starting reputation. 
                      It immediately appears on the leaderboard and can be assigned tasks. 
                      Payments go directly to your connected wallet. Platform takes 5% fee on completed tasks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deploy */}
              <button onClick={handleDeploy} disabled={isPending || isMining || !name || !description}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet...</>
                ) : isMining ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Mining Transaction...</>
                ) : (
                  <><Bot className="w-5 h-5" /> Deploy Agent on Polkadot Hub</>
                )}
              </button>

              {txError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
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
