// Auto-bidding backend — watches for new tasks, assigns best agent, completes work, submits on-chain
// Runs as a polling loop via API route (called by cron or frontend)

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi, decodeEventLog } from "viem";
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

const SKILL_LABELS = ["research", "writing", "data-analysis", "code-review", "translation", "summarization", "creative", "technical-writing", "smart-contract-audit", "market-analysis"];

// Agent AI completion (same as /api/agent/complete but inline)
async function completeTask(description: string, skillTag: number, agentId?: bigint): Promise<{ result: string; hash: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/agent/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      skillTag,
      agentId: agentId ? Number(agentId) : undefined,
    }),
  });
  const data = await res.json();
  const resultText = data.result || "Task completed.";
  const hash = data.resultHash || `Qm${Buffer.from(resultText.slice(0, 32)).toString("hex").slice(0, 44)}`;
  return { result: resultText, hash };
}

// POST: Run one cycle of the auto-bidder
export async function POST(request: NextRequest) {
  try {
    const account = privateKeyToAccount(KEY as `0x${string}`);
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const pub = createPublicClient({ chain, transport: http(RPC) });

    // 1. Get all open tasks
    const nextTaskId = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "nextTaskId" });
    const nextAgentId = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "nextAgentId" });

    const actions: any[] = [];

    for (let taskId = BigInt(1); taskId < nextTaskId; taskId++) {
      const task = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "getTask", args: [taskId] });
      const [poster, description, skillTag, bounty, deadline, status, assignedAgent, resultHash, postedAt, submittedAt] = task;

      // Status: 0=Open, 1=Assigned, 2=Submitted, 3=Approved
      if (Number(status) === 0) {
        // OPEN — find the best matching agent (any owner — operator can bid for all)
        let bestAgent: bigint | null = null;
        let bestPrice = BigInt(0);
        let bestSkillMatch = false;

        for (let agentId = BigInt(1); agentId < nextAgentId; agentId++) {
          const agent = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "getAgent", args: [agentId] });
          const [aOwner, aWallet, aName, aDesc, aPrimarySkill, aPricePerTask, , , aRepScore, , aIsActive] = agent;

          if (!aIsActive) continue;

          const skillMatch = Number(aPrimarySkill) === Number(skillTag);
          
          // Prefer: 1) skill match + highest rep, 2) skill match + lowest price, 3) any active agent
          if (skillMatch) {
            if (!bestSkillMatch || aPricePerTask < bestPrice) {
              bestAgent = agentId;
              bestPrice = aPricePerTask;
              bestSkillMatch = true;
            }
          } else if (!bestSkillMatch && bestAgent === null) {
            bestAgent = agentId;
            bestPrice = aPricePerTask;
          }
        }

        if (bestAgent !== null) {
          try {
            // Check if task is complex enough for multi-agent pipeline
            const isComplex = description.split(/\s+/).length > 15 || 
              bounty >= BigInt(5000000) ||
              description.toLowerCase().includes("full") ||
              description.toLowerCase().includes("comprehensive") ||
              description.toLowerCase().includes("report");

            if (isComplex) {
              // Use pipeline orchestrator for complex tasks
              // First bid with the orchestrator agent
              const bidHash = await wallet.writeContract({
                address: MARKET as `0x${string}`, abi: MARKET_ABI,
                functionName: "bidOnTask", args: [taskId, bestAgent],
              });
              await pub.waitForTransactionReceipt({ hash: bidHash });

              // Run the pipeline
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
              const pipelineRes = await fetch(`${baseUrl}/api/agent/pipeline`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskId: Number(taskId),
                  description,
                  skillTag: Number(skillTag),
                  bounty: Number(bounty),
                }),
              });
              const pipelineData = await pipelineRes.json();

              actions.push({
                taskId: Number(taskId),
                action: "pipeline",
                pipeline: pipelineData.pipeline,
                orchestrator: pipelineData.orchestrator,
                subtasksExecuted: pipelineData.subtasksExecuted,
                totalSteps: pipelineData.totalSteps,
                steps: pipelineData.steps,
                resultPreview: pipelineData.finalResult?.slice(0, 200) + "...",
                bidTx: bidHash,
              });
            } else {
              // Simple task — single agent
              const bidHash = await wallet.writeContract({
                address: MARKET as `0x${string}`, abi: MARKET_ABI,
                functionName: "bidOnTask", args: [taskId, bestAgent],
              });
              await pub.waitForTransactionReceipt({ hash: bidHash });

              const { result, hash } = await completeTask(description, Number(skillTag), bestAgent);

              const submitHash = await wallet.writeContract({
                address: MARKET as `0x${string}`, abi: MARKET_ABI,
                functionName: "submitResult", args: [taskId, hash],
              });
              await pub.waitForTransactionReceipt({ hash: submitHash });

              // Save result to store
              try {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                await fetch(`${baseUrl}/api/agent/results`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    taskId: Number(taskId),
                    pipeline: "single",
                    finalResult: result,
                    steps: [{ stepNumber: 1, type: "subtask_complete", description: `Agent #${Number(bestAgent)} completed task`, agentId: Number(bestAgent), result, timestamp: new Date().toISOString() }],
                    totalDurationMs: 0,
                  }),
                });
              } catch {}

              actions.push({
                taskId: Number(taskId),
                action: "bid+complete",
                agentId: Number(bestAgent),
                resultPreview: result.slice(0, 200) + "...",
                resultHash: hash,
                bidTx: bidHash,
                submitTx: submitHash,
              });
            }
          } catch (e: any) {
            actions.push({ taskId: Number(taskId), action: "error", error: e.message?.slice(0, 100) });
          }
        }
      } else if (Number(status) === 2) {
        // SUBMITTED — try auto-approve if past deadline
        const now = BigInt(Math.floor(Date.now() / 1000));
        const autoApproveTime = submittedAt + BigInt(3600); // 1 hour
        if (now >= autoApproveTime) {
          try {
            const approveTx = await wallet.writeContract({
              address: MARKET as `0x${string}`, abi: MARKET_ABI,
              functionName: "autoApprove", args: [taskId],
            });
            await pub.waitForTransactionReceipt({ hash: approveTx });
            actions.push({ taskId: Number(taskId), action: "auto-approved", tx: approveTx });
          } catch (e: any) {
            actions.push({ taskId: Number(taskId), action: "approve-error", error: e.message?.slice(0, 100) });
          }
        } else {
          actions.push({
            taskId: Number(taskId),
            action: "waiting-approval",
            autoApproveIn: `${Number(autoApproveTime - now)}s`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tasksScanned: Number(nextTaskId) - 1,
      agentsAvailable: Number(nextAgentId) - 1,
      actions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Status
export async function GET() {
  try {
    const pub = createPublicClient({ chain, transport: http(RPC) });
    const nextTaskId = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "nextTaskId" });
    const nextAgentId = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "nextAgentId" });
    const completed = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "totalTasksCompleted" });

    // Count open tasks
    let openTasks = 0;
    let submittedTasks = 0;
    for (let i = BigInt(1); i < nextTaskId; i++) {
      const task = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "getTask", args: [i] });
      if (Number(task[5]) === 0) openTasks++;
      if (Number(task[5]) === 2) submittedTasks++;
    }

    return NextResponse.json({
      name: "Colosseum Auto-Bidder",
      status: "active",
      totalTasks: Number(nextTaskId) - 1,
      openTasks,
      submittedAwaitingApproval: submittedTasks,
      totalCompleted: Number(completed),
      registeredAgents: Number(nextAgentId) - 1,
      usage: "POST to run one auto-bid cycle",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
