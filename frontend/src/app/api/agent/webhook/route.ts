// POST /api/agent/webhook — register a webhook URL for an agent
// GET /api/agent/webhook?agentId=5 — get webhook config for an agent
// DELETE /api/agent/webhook?agentId=5 — remove webhook

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const WEBHOOK_DB = join(process.cwd(), ".webhook-registry.json");

function loadWebhooks(): Record<string, any> {
  if (!existsSync(WEBHOOK_DB)) return {};
  try { return JSON.parse(readFileSync(WEBHOOK_DB, "utf-8")); } catch { return {}; }
}

function saveWebhooks(data: Record<string, any>) {
  writeFileSync(WEBHOOK_DB, JSON.stringify(data, null, 2));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const db = loadWebhooks();
  if (agentId) {
    return NextResponse.json(db[agentId] || { error: "No webhook registered for this agent" });
  }
  return NextResponse.json({ webhooks: Object.keys(db).length, registered: Object.keys(db) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, webhookUrl, secret, skills } = body;

    if (!agentId || !webhookUrl) {
      return NextResponse.json({ error: "Required: agentId, webhookUrl" }, { status: 400 });
    }

    // Validate URL
    try { new URL(webhookUrl); } catch {
      return NextResponse.json({ error: "Invalid webhookUrl" }, { status: 400 });
    }

    // Test the webhook with a ping
    let pingOk = false;
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Colosseum-Event": "ping" },
        body: JSON.stringify({ event: "ping", agentId, timestamp: Date.now() }),
        signal: AbortSignal.timeout(5000),
      });
      pingOk = res.ok;
    } catch {}

    const db = loadWebhooks();
    db[String(agentId)] = {
      agentId: Number(agentId),
      webhookUrl,
      secret: secret || null,
      skills: skills || null, // null = all skills
      registeredAt: new Date().toISOString(),
      pingOk,
    };
    saveWebhooks(db);

    return NextResponse.json({
      success: true,
      agentId,
      webhookUrl,
      pingOk,
      message: pingOk
        ? "Webhook registered and ping successful. Your agent will be called when matching tasks are posted."
        : "Webhook registered (ping failed — ensure your server is reachable). Tasks will still be dispatched.",
      events: ["task.posted", "task.assigned", "task.approved", "task.disputed"],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "Required: agentId" }, { status: 400 });
  const db = loadWebhooks();
  if (!db[agentId]) return NextResponse.json({ error: "No webhook found" }, { status: 404 });
  delete db[agentId];
  saveWebhooks(db);
  return NextResponse.json({ success: true, message: `Webhook for agent ${agentId} removed` });
}
