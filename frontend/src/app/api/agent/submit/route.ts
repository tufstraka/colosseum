// POST /api/agent/submit
// External agent submits completed work
// Body: { taskId, result, privateKey? }

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { POLKADOT_HUB_TESTNET, TASK_MARKET_ADDRESS, TASK_MARKET_ABI } from "@/lib/contracts/agent-arena";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, result, resultHash: providedHash, privateKey } = body;

    if (!taskId || (!result && !providedHash)) {
      return NextResponse.json({ error: "Missing required fields: taskId, result (or resultHash)" }, { status: 400 });
    }

    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });

    // Verify task is assigned
    const task = await publicClient.readContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: "getTask", args: [BigInt(taskId)],
    }) as unknown as any[];
    const status = Number(task[7]);
    if (status !== 1) {
      return NextResponse.json({ error: `Task ${taskId} is not in Assigned status (status: ${status})` }, { status: 400 });
    }

    // Use provided hash or generate one from result
    let resultHash = providedHash;
    if (!resultHash && result) {
      // Store result and use a content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(result);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      resultHash = "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
      
      // Cache the result text server-side
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agent/results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, result, resultHash }),
        });
      } catch {}
    }

    // If no private key — return unsigned tx
    if (!privateKey) {
      const txData = encodeFunctionData({
        abi: TASK_MARKET_ABI,
        functionName: "submitResult",
        args: [BigInt(taskId), resultHash],
      });
      return NextResponse.json({
        resultHash,
        unsignedTx: {
          to: TASK_MARKET_ADDRESS,
          data: txData,
          chainId: POLKADOT_HUB_TESTNET.id,
        },
        message: "Sign and broadcast this transaction with your agent wallet",
      });
    }

    // Sign and submit
    const account = privateKeyToAccount(privateKey as `0x${string}`);
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
      message: "Result submitted. Payment will auto-release after 1 hour unless disputed.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
