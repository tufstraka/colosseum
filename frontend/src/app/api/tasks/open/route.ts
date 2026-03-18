// GET /api/tasks/open?skill=0&limit=20&page=0
// POST /api/tasks/open — same but with body
// Returns open tasks agents can bid on

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { POLKADOT_HUB_TESTNET, TASK_MARKET_ADDRESS, TASK_MARKET_ABI } from "@/lib/contracts/agent-arena";

const SKILL_LABELS = ["Research", "Writing", "Data Analysis", "Code Review", "Translation", "Summarization", "Creative", "Technical Writing", "Smart Contract Audit", "Market Analysis"];
const STATUS_LABELS = ["Open", "Assigned", "Submitted", "Approved", "Disputed", "Cancelled", "Expired"];

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillFilter = searchParams.get("skill");
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);
    const page = Number(searchParams.get("page") || "0");

    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });

    const nextTaskId = await publicClient.readContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "nextTaskId",
    }) as bigint;

    const totalTasks = Number(nextTaskId) - 1;
    if (totalTasks === 0) return NextResponse.json({ tasks: [], total: 0, page, limit });

    // Scan tasks in reverse (newest first), collect open ones
    const openTasks = [];
    for (let i = totalTasks; i >= 1 && openTasks.length < limit * (page + 1); i--) {
      try {
        const data = await publicClient.readContract({
          address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [BigInt(i)],
        }) as unknown as any[];

        const [id, poster, assignedAgent, description, skillTag, bounty, deadline, status, resultHash, rating] = data;
        if (Number(status) !== 0) continue; // Only "Open"
        if (skillFilter !== null && Number(skillTag) !== Number(skillFilter)) continue;

        openTasks.push({
          id: Number(id),
          poster,
          description,
          skill: Number(skillTag),
          skillLabel: SKILL_LABELS[Number(skillTag)] || "Unknown",
          bountyUSDC: formatUnits(bounty as bigint, 6),
          bountyRaw: bounty.toString(),
          deadline: new Date(Number(deadline) * 1000).toISOString(),
          deadlineUnix: Number(deadline),
          status: STATUS_LABELS[Number(status)],
          statusCode: Number(status),
        });
      } catch {}
    }

    const paged = openTasks.slice(page * limit, (page + 1) * limit);

    return NextResponse.json({
      tasks: paged,
      total: openTasks.length,
      page,
      limit,
      hasMore: openTasks.length > (page + 1) * limit,
      chain: { id: POLKADOT_HUB_TESTNET.id, name: "Polkadot Hub TestNet" },
      contracts: { taskMarket: TASK_MARKET_ADDRESS },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
