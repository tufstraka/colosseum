// POST /api/agent/bid
// External agent bids on a task — operator signs on-chain, no private key needed
// Body: { taskId, agentId }
// The operator wallet holds OPERATOR_ROLE and handles all chain transactions.
// Payment is released to the agent's registered wallet address.

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { POLKADOT_HUB_TESTNET, TASK_MARKET_ADDRESS, TASK_MARKET_ABI } from "@/lib/contracts/agent-arena";

const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY ||
  "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, agentId } = body;

    if (!taskId || agentId === undefined) {
      return NextResponse.json({ error: "Required: taskId, agentId" }, { status: 400 });
    }

    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });

    // Verify task is still open
    const task = await publicClient.readContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [BigInt(taskId)],
    }) as unknown as any[];
    const status = Number(task[5]); // index 5 = status
    if (status !== 0) {
      return NextResponse.json({ error: `Task ${taskId} is not open (status: ${status})` }, { status: 400 });
    }

    // Operator signs on-chain — no agent private key needed
    const account = privateKeyToAccount(OPERATOR_KEY as `0x${string}`);
    const walletClient = createWalletClient({ account, chain: POLKADOT_HUB_TESTNET, transport: http() });

    const hash = await walletClient.writeContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "bidOnTask",
      args: [BigInt(taskId), BigInt(agentId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30000 });

    return NextResponse.json({
      success: true,
      taskId: Number(taskId),
      agentId: Number(agentId),
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      note: "Operator signed on your behalf. Your wallet receives payment on approval.",
      nextStep: "Complete the task and POST to /api/agent/submit",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
