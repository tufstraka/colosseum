// Auto-bidding backend — watches for new tasks, assigns best agent, completes work, submits on-chain
// Agent selection uses semantic scoring: skill match + keyword relevance + reputation + task history
// Scans last 20 tasks only (avoids full history scan and 504s)

export const maxDuration = 60; // Next.js route timeout in seconds (requires Vercel Pro or self-hosted)

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = "https://eth-rpc-testnet.polkadot.io/";
const KEY = "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";
const REGISTRY = "0xb8A4344c12ea5f25CeCf3e70594E572D202Af897";
const MARKET = "0xb8100467f23dfD0217DA147B047ac474de9cD9F4";

const chain = { id: 420420417, name: "Polkadot Hub TestNet", nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } } as const;

const MARKET_ABI = parseAbi([
  "function nextTaskId() view returns (uint256)",
  "function getTask(uint256) view returns (address poster, string description, uint8 skillTag, uint256 bounty, uint256 deadline, uint8 status, uint256 assignedAgent, string resultHash, uint256 postedAt, uint256 submittedAt, uint256 approvedAt, uint256 rating, bool autoApproved)",
  "function bidOnTask(uint256 taskId, uint256 agentId)",
  "function submitResult(uint256 taskId, string resultHash)",
  "function autoApprove(uint256 taskId)",
  "function totalTasksCompleted() view returns (uint256)",
]);

const REGISTRY_ABI = parseAbi([
  "function nextAgentId() view returns (uint256)",
  "function getAgent(uint256) view returns (address owner, address wallet, string name, string description, uint8 primarySkill, uint256 pricePerTask, uint256 totalTasksCompleted, uint256 totalEarnings, uint256 reputationScore, uint256 totalRatings, bool isActive, uint256 registeredAt, uint256 lastActiveAt, uint256 stakedAmount)",
]);

// ────────────────────────────────────────────────
// SEMANTIC AGENT SCORING
// ────────────────────────────────────────────────

// Keywords associated with each skill category
const SKILL_KEYWORDS: Record<number, string[]> = {
  0: ["research", "find", "investigate", "explore", "discover", "look up", "facts", "information", "study", "analyze sources"],
  1: ["write", "draft", "compose", "essay", "article", "blog", "content", "copy", "prose", "narrative", "story"],
  2: ["data", "analyze", "statistics", "metrics", "numbers", "trend", "chart", "dataset", "correlation", "quantitative"],
  3: ["code", "review", "bug", "refactor", "programming", "function", "logic", "algorithm", "implementation", "pull request"],
  4: ["translate", "language", "spanish", "french", "chinese", "german", "japanese", "localize", "multilingual"],
  5: ["summarize", "summary", "tldr", "overview", "brief", "condense", "key points", "digest", "executive"],
  6: ["creative", "poem", "story", "fiction", "imagine", "brainstorm", "idea", "concept", "art", "design"],
  7: ["documentation", "docs", "readme", "api reference", "technical", "spec", "manual", "guide", "how-to"],
  8: ["solidity", "smart contract", "audit", "vulnerability", "reentrancy", "erc20", "defi", "security", "exploit", "bytecode"],
  9: ["market", "price", "token", "crypto", "trading", "liquidity", "tvl", "onchain", "blockchain", "protocol", "defi analytics"],
};

// Agent name → contextual keyword hints
const AGENT_CONTEXT_HINTS: Record<string, string[]> = {
  // Research
  "Archimedes": ["mathematics", "physics", "geometry", "principles"],
  "Darwin": ["biology", "evolution", "science", "species"],
  "Galileo": ["astronomy", "physics", "experiment", "telescope"],
  "Curie": ["chemistry", "physics", "radiation", "elements"],
  "Tesla": ["electrical", "engineering", "inventor", "AC"],
  "Newton": ["physics", "mathematics", "calculus", "gravity"],
  "Turing": ["computer science", "algorithm", "computation", "AI"],
  "Lovelace": ["programming", "algorithm", "computer", "mathematics"],
  // Writing
  "Shakespeare": ["drama", "poetry", "literature", "play", "sonnet"],
  "Orwell": ["political", "satire", "essay", "dystopia", "journalism"],
  "Tolkien": ["fantasy", "world-building", "fiction", "narrative"],
  "Austen": ["social", "novel", "character", "romance", "prose"],
  "Hemingway": ["minimalist", "journalism", "fiction", "direct"],
  "Cervantes": ["spanish", "fiction", "satire", "classic"],
  "Goethe": ["german", "philosophy", "poetry", "romantic"],
  "Mishima": ["japanese", "literature", "philosophy"],
  "Pushkin": ["russian", "poetry", "literature"],
  // Summarization
  "Cliff": ["cliffnotes", "summary", "condensed", "overview"],
  "Abstract": ["abstract", "academic", "overview", "paper"],
  "Headlines": ["news", "headline", "bullet", "brief"],
  "BLUF": ["bottom line", "direct", "military", "executive"],
  "Précis": ["précis", "condensed", "formal", "academic"],
  // Math/Data
  "Gauss": ["statistics", "mathematics", "probability", "distribution"],
  "Bernoulli": ["probability", "statistics", "fluid", "mathematics"],
  "Knuth": ["algorithms", "programming", "computer science", "data structures"],
  "Dijkstra": ["algorithms", "graph", "programming", "computer science"],
  "Hopper": ["programming", "compiler", "navy", "COBOL"],
  "Ritchie": ["C programming", "Unix", "systems", "operating system"],
  // Art/Creative
  "Banksy": ["street art", "satire", "graffiti", "political"],
  "Warhol": ["pop art", "culture", "celebrity", "commercial"],
  "Dali": ["surrealism", "abstract", "imagination", "art"],
  "Basquiat": ["neo-expressionism", "street", "culture", "art"],
  "Kusama": ["avant-garde", "minimalist", "art", "installation"],
  // Technical Writing
  "Strunk": ["grammar", "style", "writing", "clear", "concise"],
  "RFC": ["protocol", "internet", "standards", "specification"],
  "Javadoc": ["java", "documentation", "API", "code"],
  "Wiki": ["encyclopedia", "neutral", "informational", "comprehensive"],
  // Smart Contract Audit
  "Mythril": ["ethereum", "security", "vulnerability", "bytecode", "symbolic execution"],
  "Slither": ["solidity", "static analysis", "vulnerability", "audit"],
  "Echidna": ["fuzzing", "property testing", "smart contract", "EVM"],
  "Certora": ["formal verification", "specification", "invariant", "proof"],
  "Manticore": ["symbolic execution", "security", "vulnerability", "EVM"],
  // Market Analysis
  "Bloomberg": ["financial", "market", "trading", "macroeconomic", "news"],
  "Nansen": ["onchain", "wallet", "token", "NFT", "smart money"],
  "Glassnode": ["bitcoin", "ethereum", "onchain", "metrics", "HODL"],
  "Dune": ["onchain", "SQL", "analytics", "protocol", "DEX"],
  "Chainalysis": ["compliance", "trace", "blockchain forensics", "AML"],
};

/**
 * Score an agent against a task description.
 * Returns a score from 0-100:
 *  - 40 pts: primary skill matches task skill
 *  - 30 pts: semantic keyword overlap between task description and agent domain
 *  - 20 pts: reputation score (normalised to 0-5 scale → 0-20 pts)
 *  - 10 pts: task completion count (capped at 50 tasks → 10 pts)
 */
function scoreAgent(
  agentId: bigint,
  agentName: string,
  agentDesc: string,
  primarySkill: number,
  repScore: bigint,
  tasksCompleted: bigint,
  isActive: boolean,
  taskSkill: number,
  taskDescription: string,
): number {
  if (!isActive) return -1;

  const descLower = taskDescription.toLowerCase();
  let score = 0;

  // 1. Skill match (40 pts)
  if (Number(primarySkill) === taskSkill) score += 40;

  // 2. Semantic keyword match (30 pts)
  const agentKeywords = [
    ...(AGENT_CONTEXT_HINTS[agentName] || []),
    ...agentName.toLowerCase().split(/[\s-_]+/),
    ...agentDesc.toLowerCase().split(/[\s.,]+/).filter(w => w.length > 4),
    ...(SKILL_KEYWORDS[Number(primarySkill)] || []),
  ];

  const taskKeywords = descLower.split(/[\s.,;:!?]+/).filter(w => w.length > 3);
  const taskBigrams = taskKeywords.map((w, i) => i < taskKeywords.length - 1 ? `${w} ${taskKeywords[i+1]}` : "").filter(Boolean);

  let keywordHits = 0;
  for (const kw of agentKeywords) {
    if (descLower.includes(kw.toLowerCase())) keywordHits++;
  }
  // Also check if task explicitly contains the agent's name or domain
  if (descLower.includes(agentName.toLowerCase())) keywordHits += 3;

  score += Math.min(30, keywordHits * 3);

  // 3. Reputation (20 pts) — repScore is stored as score * 100 (e.g. 250 = 2.50/5.00)
  const rep = Number(repScore) / 100; // 0-5 scale
  score += Math.round((rep / 5) * 20);

  // 4. Task completion history (10 pts)
  const tasks = Math.min(Number(tasksCompleted), 50);
  score += Math.round((tasks / 50) * 10);

  return score;
}

// ────────────────────────────────────────────────
// AI COMPLETION
// ────────────────────────────────────────────────

async function completeTask(description: string, skillTag: number, agentId?: bigint): Promise<{ result: string; hash: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/agent/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, skillTag, agentId: agentId ? Number(agentId) : undefined }),
  });
  const data = await res.json();
  const resultText = data.result || "Task completed.";
  const hash = data.resultHash || `Qm${Buffer.from(resultText.slice(0, 32)).toString("hex").slice(0, 44)}`;
  return { result: resultText, hash };
}

// ────────────────────────────────────────────────
// MAIN AUTO-BIDDER
// ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const account = privateKeyToAccount(KEY as `0x${string}`);
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const pub = createPublicClient({ chain, transport: http(RPC) });

    const nextTaskId = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "nextTaskId" });
    const nextAgentId = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "nextAgentId" });

    // Hard deadline: abort gracefully if we're close to the 30s serverless limit
    const DEADLINE = Date.now() + 25000;
    const overBudget = () => Date.now() > DEADLINE;

    // Only scan the last 20 tasks (newest first) — avoids full history scan on every call
    const SCAN_LIMIT = 20;
    const totalTasks = Number(nextTaskId) - 1;
    const scanStart = BigInt(Math.max(1, totalTasks - SCAN_LIMIT + 1));

    // Load all active agents once (avoid fetching per-task)
    const agents: Array<{
      id: bigint; name: string; description: string; primarySkill: number;
      repScore: bigint; tasksCompleted: bigint; isActive: boolean;
    }> = [];

    for (let agentId = BigInt(1); agentId < nextAgentId && !overBudget(); agentId++) {
      try {
        const a = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "getAgent", args: [agentId] }) as unknown as any[];
        const [, , name, description, primarySkill, , tasksCompleted, , repScore, , isActive] = a;
        if (isActive) {
          agents.push({ id: agentId, name, description, primarySkill: Number(primarySkill), repScore, tasksCompleted, isActive });
        }
      } catch {}
    }

    const actions: any[] = [];

    // ── PHASE 1: Process OPEN tasks (newest first — prioritize fresh tasks) ──
    for (let taskId = nextTaskId - BigInt(1); taskId >= scanStart && !overBudget(); taskId--) {
      let task: any[];
      try {
        task = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "getTask", args: [taskId] }) as unknown as any[];
      } catch { continue; }

      const [poster, description, skillTag, bounty, deadline, status] = task;

      // Only process OPEN tasks in phase 1
      if (Number(status) !== 0) continue;

      // Score all agents against this task
      const scored = agents.map(a => ({
        ...a,
        score: scoreAgent(
          a.id, a.name, a.description, a.primarySkill,
          a.repScore, a.tasksCompleted, a.isActive,
          Number(skillTag), description,
        ),
      })).filter(a => a.score >= 0).sort((a, b) => b.score - a.score);

      if (scored.length === 0) continue;

      const best = scored[0];

      // Log for debugging
      console.log(`Task #${Number(taskId)}: Attempting to bid with Agent #${Number(best.id)} (${best.name}, skill: ${best.primarySkill}, active: ${best.isActive})`);

      try {
        const isComplex = description.split(/\s+/).length > 15 ||
          bounty >= BigInt(5000000) ||
          /\b(full|comprehensive|detailed|complete|report|analysis|in-depth)\b/i.test(description);

        if (isComplex) {
          const bidHash = await wallet.writeContract({
            address: MARKET as `0x${string}`, abi: MARKET_ABI,
            functionName: "bidOnTask", args: [taskId, best.id],
          });
          await pub.waitForTransactionReceipt({ hash: bidHash });

          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          const pipelineRes = await fetch(`${baseUrl}/api/agent/pipeline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: Number(taskId), description, skillTag: Number(skillTag), bounty: Number(bounty) }),
          });
          const pipelineData = await pipelineRes.json();

          actions.push({
            taskId: Number(taskId),
            action: "pipeline",
            selectedAgent: { id: Number(best.id), name: best.name, score: best.score, skill: best.primarySkill },
            runnerUp: scored[1] ? { id: Number(scored[1].id), name: scored[1].name, score: scored[1].score } : null,
            pipeline: pipelineData.pipeline,
            bidTx: bidHash,
          });
        } else {
          const bidHash = await wallet.writeContract({
            address: MARKET as `0x${string}`, abi: MARKET_ABI,
            functionName: "bidOnTask", args: [taskId, best.id],
          });
          await pub.waitForTransactionReceipt({ hash: bidHash });

          const { result, hash } = await completeTask(description, Number(skillTag), best.id);

          const submitHash = await wallet.writeContract({
            address: MARKET as `0x${string}`, abi: MARKET_ABI,
            functionName: "submitResult", args: [taskId, hash],
          });
          await pub.waitForTransactionReceipt({ hash: submitHash });

          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
            await fetch(`${baseUrl}/api/agent/results`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: Number(taskId), pipeline: "single", finalResult: result,
                steps: [{ stepNumber: 1, type: "subtask_complete", description: `Agent #${Number(best.id)} (${best.name}) completed task`, agentId: Number(best.id), agentName: best.name, result, timestamp: new Date().toISOString() }],
                totalDurationMs: 0,
              }),
            });
          } catch {}

          actions.push({
            taskId: Number(taskId),
            action: "bid+complete",
            selectedAgent: { id: Number(best.id), name: best.name, score: best.score, skill: best.primarySkill },
            runnerUp: scored[1] ? { id: Number(scored[1].id), name: scored[1].name, score: scored[1].score } : null,
            scoringBreakdown: {
              totalScore: best.score,
              skillMatch: Number(best.primarySkill) === Number(skillTag),
              taskDescription: description.slice(0, 80),
            },
            resultPreview: result.slice(0, 200),
            bidTx: bidHash,
            submitTx: submitHash,
          });
        }
      } catch (e: any) {
        let errorMsg = e.message?.slice(0, 200);
        
        // Decode common contract errors
        if (e.message?.includes("0x70f65caa")) {
          errorMsg = `AgentNotActive (0x70f65caa) — Agent #${best?.id || '?'} exists but may be inactive, or the auto-bidder lacks ARBITER_ROLE permission. Check contract roles.`;
        } else if (e.message?.includes("TaskNotOpen")) {
          errorMsg = "Task is no longer open (already assigned or completed)";
        } else if (e.message?.includes("DeadlinePassed")) {
          errorMsg = "Task deadline has passed";
        } else if (e.message?.includes("Not agent owner/wallet/operator")) {
          errorMsg = "Auto-bidder wallet lacks permission (needs ARBITER_ROLE or agent ownership)";
        }
        
        actions.push({ 
          taskId: Number(taskId), 
          action: "error", 
          error: errorMsg,
          attemptedAgent: best ? { id: Number(best.id), name: best.name } : null,
        });
      }
    }

    // ── PHASE 2: Auto-approve SUBMITTED tasks (only if time remains) ──
    if (!overBudget()) {
      for (let taskId = nextTaskId - BigInt(1); taskId >= scanStart && !overBudget(); taskId--) {
        let task: any[];
        try {
          task = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "getTask", args: [taskId] }) as unknown as any[];
        } catch { continue; }

        const status = Number(task[5]);
        const submittedAt = task[9] as bigint;

        if (status === 2) {
          const now = BigInt(Math.floor(Date.now() / 1000));
          const autoApproveTime = submittedAt + BigInt(3600);
          if (now >= autoApproveTime) {
            try {
              const approveTx = await wallet.writeContract({
                address: MARKET as `0x${string}`, abi: MARKET_ABI,
                functionName: "autoApprove", args: [taskId],
              });
              await pub.waitForTransactionReceipt({ hash: approveTx });
              actions.push({ taskId: Number(taskId), action: "auto-approved", tx: approveTx });
            } catch (e: any) {
              // Skip approve errors silently — don't waste time
              actions.push({ taskId: Number(taskId), action: "approve-error", error: e.message?.slice(0, 100) });
              break; // If one approve fails, the rest probably will too (RPC issue)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tasksScanned: totalTasks - Number(scanStart) + 1,
      taskScanRange: `#${Number(scanStart)}-#${totalTasks} (last ${SCAN_LIMIT})`,
      agentsAvailable: agents.length,
      actions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pub = createPublicClient({ chain, transport: http(RPC) });
    const nextTaskId = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "nextTaskId" });
    const nextAgentId = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "nextAgentId" });
    const completed = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "totalTasksCompleted" });
    let openTasks = 0, submittedTasks = 0;
    const total = Number(nextTaskId) - 1;
    const from = BigInt(Math.max(1, total - 50 + 1)); // check last 50 for status
    for (let i = from; i < nextTaskId; i++) {
      const task = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "getTask", args: [i] }) as unknown as any[];
      if (Number(task[5]) === 0) openTasks++;
      if (Number(task[5]) === 2) submittedTasks++;
    }
    return NextResponse.json({
      name: "Colosseum Auto-Bidder",
      status: "active",
      selectionAlgorithm: "semantic scoring: skill match (40) + keyword relevance (30) + reputation (20) + history (10)",
      totalTasks: Number(nextTaskId) - 1,
      openTasks, submittedAwaitingApproval: submittedTasks,
      totalCompleted: Number(completed),
      registeredAgents: Number(nextAgentId) - 1,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


