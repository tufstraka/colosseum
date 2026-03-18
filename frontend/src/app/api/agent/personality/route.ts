// Agent personality store — maps agentId to full personality config
// In production this would be IPFS or a database. For now, server-side storage.

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STORE_PATH = join(process.cwd(), ".agent-personalities.json");

interface AgentPersonality {
  agentId: number;
  name: string;
  systemPrompt: string;
  personality: string;
  tone: string;
  skill: number;
  createdAt: string;
}

function loadStore(): Record<string, AgentPersonality> {
  try {
    if (existsSync(STORE_PATH)) {
      return JSON.parse(readFileSync(STORE_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveStore(store: Record<string, AgentPersonality>) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// POST: Save agent personality
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, name, systemPrompt, personality, tone, skill } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const store = loadStore();
    store[String(agentId)] = {
      agentId: Number(agentId),
      name: name || `Agent #${agentId}`,
      systemPrompt: systemPrompt || "",
      personality: personality || "",
      tone: tone || "professional",
      skill: skill || 0,
      createdAt: new Date().toISOString(),
    };
    saveStore(store);

    return NextResponse.json({ success: true, agentId, stored: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Retrieve agent personality
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (agentId) {
    const store = loadStore();
    const personality = store[agentId];
    if (personality) {
      return NextResponse.json(personality);
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return all
  const store = loadStore();
  return NextResponse.json({ agents: Object.values(store), total: Object.keys(store).length });
}
