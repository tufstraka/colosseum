// Task results store — persists pipeline results so they only run once
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STORE_PATH = join(process.cwd(), ".task-results.json");

interface TaskResult {
  taskId: number;
  pipeline: "single" | "multi-agent";
  orchestrator?: string;
  finalResult: string;
  steps: any[];
  totalDurationMs: number;
  completedAt: string;
}

function loadStore(): Record<string, TaskResult> {
  try {
    if (existsSync(STORE_PATH)) return JSON.parse(readFileSync(STORE_PATH, "utf-8"));
  } catch {}
  return {};
}

function saveStore(store: Record<string, TaskResult>) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// POST: Save task result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, pipeline, orchestrator, finalResult, steps, totalDurationMs } = body;
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const store = loadStore();
    store[String(taskId)] = {
      taskId: Number(taskId),
      pipeline: pipeline || "single",
      orchestrator,
      finalResult: finalResult || "",
      steps: steps || [],
      totalDurationMs: totalDurationMs || 0,
      completedAt: new Date().toISOString(),
    };
    saveStore(store);
    return NextResponse.json({ success: true, taskId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Retrieve task result
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  const store = loadStore();
  if (taskId) {
    const result = store[taskId];
    if (result) return NextResponse.json(result);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ tasks: Object.values(store), total: Object.keys(store).length });
}
