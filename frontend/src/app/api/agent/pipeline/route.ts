// Agent Task Planner — decomposes complex tasks into subtasks
// Orchestrates multi-agent pipelines with full step tracking

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://eth-rpc-testnet.polkadot.io/";
const KEY = process.env.OPERATOR_PRIVATE_KEY!;
const REGISTRY = "0xb8A4344c12ea5f25CeCf3e70594E572D202Af897";
const MARKET = "0xb8100467f23dfD0217DA147B047ac474de9cD9F4";
const USDC = "0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f";

const chain = { id: 420420417, name: "Polkadot Hub TestNet", nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } } as const;

const MARKET_ABI = parseAbi([
  "function postTask(string description, uint8 skillTag, uint256 bounty, uint256 deadlineSeconds) returns (uint256)",
  "function bidOnTask(uint256 taskId, uint256 agentId)",
  "function submitResult(uint256 taskId, string resultHash)",
  "function getTask(uint256) view returns (address poster, string description, uint8 skillTag, uint256 bounty, uint256 deadline, uint8 status, uint256 assignedAgent, string resultHash, uint256 postedAt, uint256 submittedAt, uint256 approvedAt, uint256 rating, bool autoApproved)",
  "function nextTaskId() view returns (uint256)",
]);

const REGISTRY_ABI = parseAbi([
  "function nextAgentId() view returns (uint256)",
  "function getAgent(uint256) view returns (address owner, address wallet, string name, string description, uint8 primarySkill, uint256 pricePerTask, uint256 totalTasksCompleted, uint256 totalEarnings, uint256 reputationScore, uint256 totalRatings, bool isActive, uint256 registeredAt, uint256 lastActiveAt, uint256 stakedAmount)",
]);

const USDC_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];

interface PipelineStep {
  stepNumber: number;
  type: "plan" | "subtask_post" | "subtask_bid" | "subtask_complete" | "subtask_submit" | "assemble" | "final_submit";
  description: string;
  agentId?: number;
  agentName?: string;
  skill?: string;
  cost?: string;
  txHash?: string;
  taskId?: number;
  result?: string;
  timestamp: string;
  durationMs?: number;
}

// Analyze task and decide if it needs decomposition
function planTask(description: string, bounty: number): { needsDecomposition: boolean; subtasks: { desc: string; skill: number; budgetRatio: number }[] } {
  const desc = description.toLowerCase();
  const wordCount = description.split(/\s+/).length;
  
  // Complex tasks that benefit from multi-agent
  const isComplex = wordCount > 15 || 
    desc.includes("full") || desc.includes("comprehensive") || desc.includes("complete") ||
    desc.includes("report") || desc.includes("analyze and") || desc.includes("research and") ||
    desc.includes("audit") || desc.includes("review and") || bounty >= 5000000; // >= $5

  if (!isComplex || bounty < 2000000) { // Don't decompose tasks under $2
    return { needsDecomposition: false, subtasks: [] };
  }

  // Determine subtask breakdown based on task content
  const subtasks: { desc: string; skill: number; budgetRatio: number }[] = [];

  if (desc.includes("market") || desc.includes("report") || desc.includes("analysis")) {
    subtasks.push({ desc: `Research and gather data: ${description}`, skill: 0, budgetRatio: 0.3 });
    subtasks.push({ desc: `Analyze data and identify key metrics for: ${description}`, skill: 2, budgetRatio: 0.3 });
    subtasks.push({ desc: `Write executive summary and final report for: ${description}`, skill: 1, budgetRatio: 0.25 });
  } else if (desc.includes("audit") || desc.includes("security")) {
    subtasks.push({ desc: `Static analysis and vulnerability scan: ${description}`, skill: 8, budgetRatio: 0.4 });
    subtasks.push({ desc: `Code quality and gas optimization review: ${description}`, skill: 3, budgetRatio: 0.3 });
    subtasks.push({ desc: `Write audit report with findings and recommendations: ${description}`, skill: 7, budgetRatio: 0.15 });
  } else if (desc.includes("translate") || desc.includes("localize")) {
    subtasks.push({ desc: `Research context and terminology for: ${description}`, skill: 0, budgetRatio: 0.2 });
    subtasks.push({ desc: `Translate content: ${description}`, skill: 4, budgetRatio: 0.5 });
    subtasks.push({ desc: `Review and quality check translation: ${description}`, skill: 1, budgetRatio: 0.15 });
  } else {
    // Generic decomposition
    subtasks.push({ desc: `Research background information for: ${description}`, skill: 0, budgetRatio: 0.25 });
    subtasks.push({ desc: `Perform core analysis: ${description}`, skill: 2, budgetRatio: 0.35 });
    subtasks.push({ desc: `Compile findings into final deliverable: ${description}`, skill: 1, budgetRatio: 0.25 });
  }

  return { needsDecomposition: true, subtasks };
}

async function findBestAgent(pub: any, skillTag: number, nextAgentId: bigint): Promise<{ agentId: bigint; name: string } | null> {
  let bestAgent: bigint | null = null;
  let bestName = "";
  let bestPrice = BigInt(0);
  let bestSkillMatch = false;

  for (let id = BigInt(1); id < nextAgentId; id++) {
    const agent = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "getAgent", args: [id] });
    const [, , aName, , aPrimarySkill, aPricePerTask, , , , , aIsActive] = agent;
    if (!aIsActive) continue;

    const skillMatch = Number(aPrimarySkill) === skillTag;
    if (skillMatch && (!bestSkillMatch || aPricePerTask < bestPrice)) {
      bestAgent = id;
      bestName = aName as string;
      bestPrice = aPricePerTask;
      bestSkillMatch = true;
    } else if (!bestSkillMatch && bestAgent === null) {
      bestAgent = id;
      bestName = aName as string;
      bestPrice = aPricePerTask;
    }
  }

  return bestAgent ? { agentId: bestAgent, name: bestName } : null;
}

// Save result to persistent store
async function saveResult(taskId: any, data: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/agent/results`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: Number(taskId), ...data }),
    });
  } catch {}
}

// POST: Execute a full pipeline for a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, description, skillTag, bounty } = body;

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const account = privateKeyToAccount(KEY as `0x${string}`);
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const pub = createPublicClient({ chain, transport: http(RPC) });
    const nextAgentId = await pub.readContract({ address: REGISTRY as `0x${string}`, abi: REGISTRY_ABI, functionName: "nextAgentId" });

    const bountyNum = bounty || 2000000;
    const steps: PipelineStep[] = [];
    const startTime = Date.now();

    // Step 1: Plan
    const plan = planTask(description, bountyNum);
    steps.push({
      stepNumber: 1,
      type: "plan",
      description: plan.needsDecomposition
        ? `Task decomposed into ${plan.subtasks.length} subtasks (budget: $${(bountyNum / 1e6).toFixed(2)} USDC)`
        : `Task is simple enough for single-agent completion`,
      timestamp: new Date().toISOString(),
    });

    if (!plan.needsDecomposition) {
      // Simple task — single agent
      const agent = await findBestAgent(pub, Number(skillTag || 0), nextAgentId);
      if (!agent) {
        return NextResponse.json({ error: "No agents available", steps }, { status: 400 });
      }

      // Complete directly
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const aiRes = await fetch(`${baseUrl}/api/agent/complete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, skillTag: Number(skillTag || 0), agentId: Number(agent.agentId), agentName: agent.name }),
      });
      const aiData = await aiRes.json();

      steps.push({
        stepNumber: 2,
        type: "subtask_complete",
        description: `${agent.name} completed task directly`,
        agentId: Number(agent.agentId),
        agentName: agent.name,
        skill: SKILL_LABELS[Number(skillTag || 0)],
        result: aiData.result,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });

      const singleResult = {
        success: true,
        taskId,
        pipeline: "single" as const,
        totalSteps: steps.length,
        totalDurationMs: Date.now() - startTime,
        finalResult: aiData.result,
        steps,
      };
      if (taskId) await saveResult(taskId, singleResult);
      return NextResponse.json(singleResult);
    }

    // Multi-agent pipeline
    const subtaskResults: string[] = [];
    let orchestratorAgent = await findBestAgent(pub, 0, nextAgentId); // Research agent as orchestrator
    const orchestratorName = orchestratorAgent?.name || "Athena";

    steps.push({
      stepNumber: 2,
      type: "plan",
      description: `${orchestratorName} (Agent #${orchestratorAgent?.agentId}) is orchestrating this pipeline`,
      agentId: orchestratorAgent ? Number(orchestratorAgent.agentId) : undefined,
      agentName: orchestratorName,
      timestamp: new Date().toISOString(),
    });

    // Ensure USDC approval for subtask posting
    const allowance = await pub.readContract({
      address: USDC as `0x${string}`, abi: USDC_ABI, functionName: "allowance",
      args: [account.address, MARKET as `0x${string}`],
    });
    if ((allowance as bigint) < BigInt(bountyNum)) {
      const approveTx = await wallet.writeContract({
        address: USDC as `0x${string}`, abi: USDC_ABI,
        functionName: "approve", args: [MARKET as `0x${string}`, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")],
      });
      await pub.waitForTransactionReceipt({ hash: approveTx });
    }

    let stepNum = 3;
    for (let i = 0; i < plan.subtasks.length; i++) {
      const sub = plan.subtasks[i];
      const subBounty = BigInt(Math.floor(bountyNum * sub.budgetRatio));
      const subBountyStr = (Number(subBounty) / 1e6).toFixed(2);

      // Find agent for this subtask
      const subAgent = await findBestAgent(pub, sub.skill, nextAgentId);
      if (!subAgent) {
        steps.push({
          stepNumber: stepNum++,
          type: "subtask_post",
          description: `No agent found for ${SKILL_LABELS[sub.skill]} subtask — skipping`,
          skill: SKILL_LABELS[sub.skill],
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Post subtask on-chain (agent-to-agent!)
      let postTxHash = "";
      let subTaskId = 0;
      try {
        const tx = await wallet.writeContract({
          address: MARKET as `0x${string}`, abi: MARKET_ABI,
          functionName: "postTask", args: [sub.desc, sub.skill, subBounty, BigInt(3600)],
        });
        const receipt = await pub.waitForTransactionReceipt({ hash: tx });
        postTxHash = tx;

        // Get the subtask ID
        const nextTask = await pub.readContract({ address: MARKET as `0x${string}`, abi: MARKET_ABI, functionName: "nextTaskId" });
        subTaskId = Number(nextTask) - 1;
      } catch (e: any) {
        steps.push({
          stepNumber: stepNum++,
          type: "subtask_post",
          description: `Failed to post subtask on-chain: ${e.message?.slice(0, 80)}`,
          skill: SKILL_LABELS[sub.skill],
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      steps.push({
        stepNumber: stepNum++,
        type: "subtask_post",
        description: `${orchestratorName} posted subtask #${subTaskId}: "${sub.desc.slice(0, 80)}..."`,
        skill: SKILL_LABELS[sub.skill],
        cost: `$${subBountyStr} USDC`,
        txHash: postTxHash,
        taskId: subTaskId,
        timestamp: new Date().toISOString(),
      });

      // Agent bids on subtask
      try {
        const bidTx = await wallet.writeContract({
          address: MARKET as `0x${string}`, abi: MARKET_ABI,
          functionName: "bidOnTask", args: [BigInt(subTaskId), subAgent.agentId],
        });
        await pub.waitForTransactionReceipt({ hash: bidTx });

        steps.push({
          stepNumber: stepNum++,
          type: "subtask_bid",
          description: `${subAgent.name} (Agent #${Number(subAgent.agentId)}) claimed subtask #${subTaskId}`,
          agentId: Number(subAgent.agentId),
          agentName: subAgent.name,
          skill: SKILL_LABELS[sub.skill],
          txHash: bidTx,
          taskId: subTaskId,
          timestamp: new Date().toISOString(),
        });
      } catch (e: any) {
        steps.push({
          stepNumber: stepNum++,
          type: "subtask_bid",
          description: `${subAgent.name} failed to bid: ${e.message?.slice(0, 80)}`,
          agentId: Number(subAgent.agentId),
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Agent completes subtask with AI — pass full pipeline context
      const subStart = Date.now();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      // Build a richer description: tell the AI exactly what role this subtask plays
      const pipelineContext = `You are completing subtask ${i + 1} of ${plan.subtasks.length} in a multi-agent pipeline.

ORIGINAL TASK: ${description}

YOUR ROLE IN THIS PIPELINE: ${sub.desc}

WHAT OTHER AGENTS ARE DOING:
${plan.subtasks.map((s, j) => j === i ? null : `- Subtask ${j + 1}: ${s.desc}`).filter(Boolean).join("\n")}

Focus specifically on YOUR assigned role. Be specific to the original task — not generic boilerplate. Produce concrete, actionable insights that an orchestrator agent can synthesize with the other outputs into a final deliverable.`;

      const aiRes = await fetch(`${baseUrl}/api/agent/complete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: pipelineContext, skillTag: sub.skill, agentId: Number(subAgent.agentId), agentName: subAgent.name }),
      });
      const aiData = await aiRes.json();
      const subResult = aiData.result || "Subtask completed.";
      subtaskResults.push(subResult);

      // Submit result on-chain
      const resultHash = `Qm${Buffer.from(subResult.slice(0, 44)).toString("hex").padEnd(44, "0")}`;
      try {
        const submitTx = await wallet.writeContract({
          address: MARKET as `0x${string}`, abi: MARKET_ABI,
          functionName: "submitResult", args: [BigInt(subTaskId), resultHash],
        });
        await pub.waitForTransactionReceipt({ hash: submitTx });

        steps.push({
          stepNumber: stepNum++,
          type: "subtask_submit",
          description: `${subAgent.name} submitted result for subtask #${subTaskId}`,
          agentId: Number(subAgent.agentId),
          agentName: subAgent.name,
          skill: SKILL_LABELS[sub.skill],
          cost: `earned $${subBountyStr} USDC`,
          txHash: submitTx,
          taskId: subTaskId,
          result: subResult,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - subStart,
        });
      } catch (e: any) {
        steps.push({
          stepNumber: stepNum++,
          type: "subtask_submit",
          description: `Failed to submit subtask result: ${e.message?.slice(0, 80)}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // SYNTHESIZE — orchestrator reads all subtask outputs and produces a unified final document
    // This is not just concatenation: the orchestrator agent calls the AI model with all context
    let assembledResult = "";

    // Clean up subtask results — strip pipeline metadata that shouldn't appear in final output
    const cleanedSubtaskResults = subtaskResults.map(r => {
      return r
        // Remove pipeline context echoes
        .replace(/^#*\s*You are completing subtask \d+ of \d+ in a multi-agent pipeline\.?\s*/gi, "")
        .replace(/ORIGINAL TASK:.*?\n/gi, "")
        .replace(/YOUR ROLE IN THIS PIPELINE:.*?\n/gi, "")
        .replace(/WHAT OTHER AGENTS ARE DOING:[\s\S]*?Focus specifically on YOUR assigned role\.[^\n]*/gi, "")
        .replace(/^- Subtask \d+:.*\n/gm, "")
        .replace(/Focus specifically on YOUR assigned role\..*?deliverable\.\s*/gi, "")
        // Remove confidence levels and internal metadata from outputs
        .replace(/\(Confidence: (?:High|Medium|Low)\)/gi, "")
        .replace(/\*[^\*]+\| Colosseum Network[^\*]*\*/g, "")
        .replace(/\*Analysis by [^\*]+\*/g, "")
        .replace(/\*Written by [^\*]+\*/g, "")
        // Clean up excessive whitespace
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    });

    try {
      const subtaskContext = cleanedSubtaskResults.map((r, i) => {
        const st = plan.subtasks[i];
        const roleLabel = SKILL_LABELS[st?.skill ?? 0] || "Specialist";
        return `=== ${roleLabel.toUpperCase()} AGENT OUTPUT ===\n\n${r}`;
      }).join("\n\n---\n\n");

      const synthesisSystem = `You are ${orchestratorName}, a senior orchestrator agent on Colosseum. You have received outputs from ${subtaskResults.length} specialized sub-agents who each worked on a different aspect of a complex task.

Your job is to synthesize their outputs into a SINGLE, POLISHED, PROFESSIONAL DOCUMENT that:

1. **READS AS ONE UNIFIED DELIVERABLE** — not a collection of parts. No "Part 1" or "Agent 1 found..." labels.
2. **INTEGRATES insights** — weave findings together, don't just concatenate them
3. **RESOLVES redundancies** — if multiple agents covered similar ground, consolidate to the best version
4. **ADDS YOUR ORCHESTRATOR ANALYSIS** — patterns across agent outputs, overall conclusions, strategic recommendations
5. **REMOVES ALL INTERNAL METADATA** — no mention of subtasks, pipelines, agent names, confidence levels, "compiled by", etc.
6. **IS WORTHY OF A SENIOR PROFESSIONAL** — this should look like it came from a top-tier consultancy

The final output should be something the user can immediately share with stakeholders — clean, authoritative, actionable.

FORMAT: Use clear markdown with proper headings, bullet points where appropriate, and a professional structure (Executive Summary → Key Findings → Analysis → Recommendations).`;

      const synthesisUser = `TASK FROM CLIENT: ${description}

RAW AGENT OUTPUTS (for your synthesis — do not include these verbatim):

${subtaskContext}

---

Now produce a SINGLE, POLISHED FINAL DOCUMENT for the client. 
- Start with an Executive Summary
- Do NOT mention agents, subtasks, pipelines, or internal process
- Do NOT include confidence levels or "compiled by" footers
- Make it look like a professional deliverable from a consultancy
- Be specific to "${description}" — no generic boilerplate`;

      const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
      const client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });

      const response = await client.send(new InvokeModelCommand({
        modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 3000,
          system: synthesisSystem,
          messages: [{ role: "user", content: synthesisUser }],
        }),
      }));

      const synthesisData = JSON.parse(new TextDecoder().decode(response.body));
      const synthesizedText = synthesisData.content?.[0]?.text;

      if (!synthesizedText || synthesizedText.length < 200) {
        return NextResponse.json({
          error: "Synthesis failed - AI model did not generate sufficient output",
          details: "Bedrock synthesis call returned empty or too short response",
          subtaskCount: subtaskResults.length,
          steps,
        }, { status: 500 });
      }

      // Clean final output — remove any remaining metadata that slipped through
      assembledResult = synthesizedText
        .replace(/\(Confidence: (?:High|Medium|Low)\)/gi, "")
        .replace(/\*[^\*]+\| Colosseum Network[^\*]*\*/g, "")
        .replace(/---\s*\*Synthesized by[^\*]*\*/g, "")
        .replace(/---\s*\*Compiled by[^\*]*\*/g, "")
        .trim();

    } catch (bedrockErr: any) {
      console.error("❌ Synthesis Bedrock call failed:", bedrockErr.message);
      return NextResponse.json({
        error: "Synthesis failed - unable to call AI model",
        details: bedrockErr.message,
        subtaskCount: subtaskResults.length,
        steps,
      }, { status: 500 });
    }

    steps.push({
      stepNumber: stepNum++,
      type: "assemble",
      description: `${orchestratorName} synthesized insights from ${subtaskResults.length} specialist agents into final report`,
      agentName: orchestratorName,
      result: assembledResult,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    });

    // Submit final assembled result for the original task
    if (taskId) {
      const finalHash = `Qm${Buffer.from(assembledResult.slice(0, 44)).toString("hex").padEnd(44, "0")}`;
      try {
        const finalTx = await wallet.writeContract({
          address: MARKET as `0x${string}`, abi: MARKET_ABI,
          functionName: "submitResult", args: [BigInt(taskId), finalHash],
        });
        await pub.waitForTransactionReceipt({ hash: finalTx });

        steps.push({
          stepNumber: stepNum++,
          type: "final_submit",
          description: `Final report submitted on-chain for task #${taskId}`,
          txHash: finalTx,
          taskId: Number(taskId),
          timestamp: new Date().toISOString(),
        });
      } catch (e: any) {
        steps.push({
          stepNumber: stepNum++,
          type: "final_submit",
          description: `Failed to submit final result: ${e.message?.slice(0, 80)}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const multiResult = {
      success: true,
      taskId,
      pipeline: "multi-agent" as const,
      orchestrator: orchestratorName,
      subtasksExecuted: subtaskResults.length,
      totalSteps: steps.length,
      totalDurationMs: Date.now() - startTime,
      finalResult: assembledResult,
      steps,
    };
    if (taskId) await saveResult(taskId, multiResult);
    return NextResponse.json(multiResult);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Colosseum Pipeline Orchestrator",
    description: "Decomposes complex tasks into subtasks, delegates to specialized agents, assembles results",
    triggers: "Tasks with bounty >= $5 or complex descriptions",
    flow: [
      "1. Analyze task complexity",
      "2. Decompose into subtasks with skill requirements",
      "3. Post each subtask on-chain with USDC bounty (agent-to-agent)",
      "4. Match and assign specialized agents",
      "5. Each agent completes its subtask via AI",
      "6. Submit each result on-chain",
      "7. Orchestrator assembles final deliverable",
      "8. Submit final result on-chain",
    ],
  });
}
