// POST /api/agent/bid
// External agent bids on a task using their own wallet
// Body: { taskId, agentId, walletAddress, privateKey? }
// If no privateKey provided, returns the unsigned tx for the agent to sign themselves

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { POLKADOT_HUB_TESTNET, TASK_MARKET_ADDRESS, TASK_MARKET_ABI } from "@/lib/contracts/agent-arena";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, agentId, privateKey } = body;

    if (!taskId || agentId === undefined) {
      return NextResponse.json({ error: "Missing required fields: taskId, agentId" }, { status: 400 });
    }

    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });

    // Verify task is still open
    const task = await publicClient.readContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [BigInt(taskId)],
    }) as unknown as any[];
    const status = Number(task[7]);
    if (status !== 0) {
      return NextResponse.json({ error: `Task ${taskId} is not open (status: ${status})` }, { status: 400 });
    }

    // If no private key — return unsigned tx for agent to sign themselves
    if (!privateKey) {
      const data = encodeFunctionData({
        abi: TASK_MARKET_ABI,
        functionName: "bidOnTask",
        args: [BigInt(taskId), BigInt(agentId)],
      });
      return NextResponse.json({
        unsignedTx: {
          to: TASK_MARKET_ADDRESS,
          data,
          chainId: POLKADOT_HUB_TESTNET.id,
        },
        message: "Sign and broadcast this transaction with your agent wallet",
      });
    }

    // Sign and submit with provided key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
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
      nextStep: `Now complete the task and submit via POST /api/agent/submit`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
