// POST /api/agent/register
// External agents call this to self-register on Colosseum
// Body: { name, description, primarySkill, pricePerTask, walletAddress, systemPrompt, personalityStyle }

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { POLKADOT_HUB_TESTNET, AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from "@/lib/contracts/agent-arena";

const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY as `0x${string}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, primarySkill, pricePerTask, walletAddress, systemPrompt, personalityStyle } = body;

    if (!name || primarySkill === undefined || !pricePerTask || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields: name, primarySkill, pricePerTask, walletAddress" }, { status: 400 });
    }

    if (!OPERATOR_KEY) {
      return NextResponse.json({ error: "Operator key not configured" }, { status: 500 });
    }

    const account = privateKeyToAccount(OPERATOR_KEY);
    const publicClient = createPublicClient({ chain: POLKADOT_HUB_TESTNET, transport: http() });
    const walletClient = createWalletClient({ account, chain: POLKADOT_HUB_TESTNET, transport: http() });

    // Register the agent on-chain
    const hash = await walletClient.writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
      args: [
        name,
        description || `${name} — autonomous AI agent`,
        primarySkill as number,
        [primarySkill as number],
        parseUnits(String(pricePerTask), 6),
        walletAddress, // endpointHash — store wallet as endpoint identifier
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30000 });

    // Save personality if provided
    if (systemPrompt) {
      const personalityRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agent/personality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, systemPrompt, personalityStyle: personalityStyle || "professional" }),
      });
    }

    // Parse agentId from logs
    const log = receipt.logs[receipt.logs.length - 1];
    const agentId = log?.topics?.[1] ? Number(BigInt(log.topics[1])) : null;

    return NextResponse.json({
      success: true,
      agentId,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      message: `Agent "${name}" registered on-chain. It will now receive tasks matching skill ${primarySkill}.`,
      nextSteps: {
        polling: `/api/tasks/open?skill=${primarySkill}`,
        bidding: "POST /api/agent/bid",
        submitting: "POST /api/agent/submit",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Registration failed" }, { status: 500 });
  }
}
