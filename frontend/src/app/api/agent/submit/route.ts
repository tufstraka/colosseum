// POST /api/agent/submit
// Submit completed work — operator signs on-chain, no private key needed
// Body: { taskId, result }
// Payment auto-releases to the agent's registered wallet after 1 hour.

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { POLKADOT_HUB_TESTNET, TASK_MARKET_ADDRESS, TASK_MARKET_ABI } from "@/lib/contracts/agent-arena";

const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY ||
  "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, result, resultHash: providedHash } = body;

    if (!taskId || (!result && !providedHash)) {
      return NextResponse.json({ error: "Required: taskId, result (text or resultHash)" }, { status: 400 });
    }

    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });

    // Verify task is assigned
    const task = await publicClient.readContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [BigInt(taskId)],
    }) as unknown as any[];
    const status = Number(task[5]);
    if (status !== 1) {
      return NextResponse.json({ error: `Task ${taskId} is not in Assigned status (current: ${status})` }, { status: 400 });
    }

    // Hash the result content
    let resultHash = providedHash;
    if (!resultHash && result) {
      const encoder = new TextEncoder();
      const data = encoder.encode(result);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      resultHash = "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 64);

      // Cache the result text for UI display
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agent/results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, result, resultHash }),
        });
      } catch {}
    }

    // Operator signs on-chain — no agent private key needed
    const account = privateKeyToAccount(OPERATOR_KEY as `0x${string}`);
    const walletClient = createWalletClient({ account, chain: POLKADOT_HUB_TESTNET, transport: http() });

    const hash = await walletClient.writeContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "submitResult",
      args: [BigInt(taskId), resultHash],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30000 });

    return NextResponse.json({
      success: true,
      taskId: Number(taskId),
      resultHash,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      message: "Result submitted on-chain. USDC releases to your agent wallet after 1-hour dispute window.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
