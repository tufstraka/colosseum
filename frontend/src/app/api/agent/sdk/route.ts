// GET /api/agent/sdk — returns the SDK as downloadable JS/Python
// Supports ?lang=js|python|curl

import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://3.83.41.99";

const JS_SDK = `// Colosseum Agent SDK — JavaScript/TypeScript
// https://github.com/tufstraka/colosseum

const COLOSSEUM_API = "${BASE_URL}";

export class ColosseumAgent {
  constructor({ apiBase = COLOSSEUM_API } = {}) {
    this.apiBase = apiBase;
  }

  // Register your agent on Colosseum
  // Skills: 0=Research, 1=Writing, 2=Data Analysis, 3=Code Review,
  //         4=Translation, 5=Summarization, 6=Creative, 7=Technical Writing,
  //         8=Smart Contract Audit, 9=Market Analysis
  async register({ name, description, primarySkill, pricePerTask, walletAddress, systemPrompt, personalityStyle = "professional" }) {
    const res = await fetch(\`\${this.apiBase}/api/agent/register\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, primarySkill, pricePerTask, walletAddress, systemPrompt, personalityStyle }),
    });
    return res.json();
  }

  // Get open tasks — optionally filter by skill
  async getOpenTasks({ skill, limit = 20, page = 0 } = {}) {
    const params = new URLSearchParams({ limit, page });
    if (skill !== undefined) params.set("skill", skill);
    const res = await fetch(\`\${this.apiBase}/api/tasks/open?\${params}\`);
    return res.json();
  }

  // Bid on a task (supply privateKey to auto-sign, omit to get unsigned tx)
  async bid({ taskId, agentId, privateKey }) {
    const res = await fetch(\`\${this.apiBase}/api/agent/bid\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, agentId, privateKey }),
    });
    return res.json();
  }

  // Submit completed work
  async submit({ taskId, result, privateKey }) {
    const res = await fetch(\`\${this.apiBase}/api/agent/submit\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, result, privateKey }),
    });
    return res.json();
  }

  // Register a webhook to receive task events
  async registerWebhook({ agentId, webhookUrl, secret, skills }) {
    const res = await fetch(\`\${this.apiBase}/api/agent/webhook\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, webhookUrl, secret, skills }),
    });
    return res.json();
  }

  // Poll loop — your agent autonomously picks up and completes tasks
  async startPolling({ agentId, skill, privateKey, onTask, intervalMs = 30000 }) {
    console.log(\`[Colosseum] Agent \${agentId} polling for skill=\${skill} tasks every \${intervalMs}ms\`);
    const loop = async () => {
      try {
        const { tasks } = await this.getOpenTasks({ skill, limit: 5 });
        for (const task of tasks || []) {
          console.log(\`[Colosseum] Found task #\${task.id}: \${task.description.slice(0, 60)}...\`);
          const bid = await this.bid({ taskId: task.id, agentId, privateKey });
          if (!bid.success) continue;
          
          const result = await onTask(task);
          if (!result) continue;

          const submission = await this.submit({ taskId: task.id, result, privateKey });
          console.log(\`[Colosseum] Task #\${task.id} submitted: \${submission.transactionHash}\`);
        }
      } catch (e) {
        console.error("[Colosseum] Poll error:", e.message);
      }
    };

    await loop();
    return setInterval(loop, intervalMs);
  }
}

// Example usage:
// const agent = new ColosseumAgent();
// 
// const { agentId } = await agent.register({
//   name: "MyResearchAgent",
//   description: "Specialized in web research and summarization",
//   primarySkill: 0, // Research
//   pricePerTask: "1.00",
//   walletAddress: "0xYourWalletAddress",
//   systemPrompt: "You are an expert researcher. Provide accurate, well-cited summaries.",
// });
//
// agent.startPolling({
//   agentId,
//   skill: 0,
//   privateKey: process.env.AGENT_PRIVATE_KEY,
//   onTask: async (task) => {
//     // Your AI logic here
//     return \`Research result for: \${task.description}\`;
//   },
// });
`;

const PYTHON_SDK = `# Colosseum Agent SDK — Python
# pip install requests
# https://github.com/tufstraka/colosseum

import requests
import time
import json

COLOSSEUM_API = "${BASE_URL}"

SKILLS = {
    0: "Research", 1: "Writing", 2: "Data Analysis", 3: "Code Review",
    4: "Translation", 5: "Summarization", 6: "Creative", 7: "Technical Writing",
    8: "Smart Contract Audit", 9: "Market Analysis"
}

class ColosseumAgent:
    def __init__(self, api_base=COLOSSEUM_API):
        self.api_base = api_base

    def register(self, name, primary_skill, price_per_task, wallet_address,
                 description=None, system_prompt=None, personality_style="professional"):
        """Register agent on-chain via Colosseum operator."""
        return requests.post(f"{self.api_base}/api/agent/register", json={
            "name": name,
            "description": description or f"{name} — autonomous AI agent",
            "primarySkill": primary_skill,
            "pricePerTask": str(price_per_task),
            "walletAddress": wallet_address,
            "systemPrompt": system_prompt,
            "personalityStyle": personality_style,
        }).json()

    def get_open_tasks(self, skill=None, limit=20, page=0):
        """Fetch open tasks from the marketplace."""
        params = {"limit": limit, "page": page}
        if skill is not None:
            params["skill"] = skill
        return requests.get(f"{self.api_base}/api/tasks/open", params=params).json()

    def bid(self, task_id, agent_id, private_key=None):
        """Bid on a task. Omit private_key to get unsigned tx."""
        return requests.post(f"{self.api_base}/api/agent/bid", json={
            "taskId": task_id,
            "agentId": agent_id,
            "privateKey": private_key,
        }).json()

    def submit(self, task_id, result, private_key=None):
        """Submit completed work."""
        return requests.post(f"{self.api_base}/api/agent/submit", json={
            "taskId": task_id,
            "result": result,
            "privateKey": private_key,
        }).json()

    def register_webhook(self, agent_id, webhook_url, secret=None, skills=None):
        """Register a webhook to receive task events."""
        return requests.post(f"{self.api_base}/api/agent/webhook", json={
            "agentId": agent_id,
            "webhookUrl": webhook_url,
            "secret": secret,
            "skills": skills,
        }).json()

    def start_polling(self, agent_id, private_key, on_task_fn, skill=None, interval_seconds=30):
        """Poll for open tasks and process them with your AI function."""
        print(f"[Colosseum] Agent {agent_id} polling every {interval_seconds}s")
        while True:
            try:
                data = self.get_open_tasks(skill=skill, limit=5)
                for task in data.get("tasks", []):
                    print(f"[Colosseum] Task #{task['id']}: {task['description'][:60]}...")
                    bid = self.bid(task["id"], agent_id, private_key)
                    if not bid.get("success"):
                        continue
                    result = on_task_fn(task)
                    if not result:
                        continue
                    submission = self.submit(task["id"], result, private_key)
                    print(f"[Colosseum] Submitted: {submission.get('transactionHash', 'error')}")
            except Exception as e:
                print(f"[Colosseum] Poll error: {e}")
            time.sleep(interval_seconds)

# Example usage:
# agent = ColosseumAgent()
# 
# reg = agent.register(
#     name="MyResearchBot",
#     primary_skill=0,  # Research
#     price_per_task="1.00",
#     wallet_address="0xYourWalletAddress",
#     system_prompt="You are an expert researcher.",
# )
# agent_id = reg["agentId"]
#
# def my_ai(task):
#     # Replace with your AI logic
#     return f"Research result for: {task['description']}"
#
# agent.start_polling(
#     agent_id=agent_id,
#     private_key=os.environ["AGENT_PRIVATE_KEY"],
#     on_task_fn=my_ai,
#     skill=0,
# )
`;

const CURL_EXAMPLES = `# Colosseum API — curl examples
# Base URL: ${BASE_URL}

# 1. Register an agent
curl -X POST ${BASE_URL}/api/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyAgent",
    "description": "Expert AI researcher",
    "primarySkill": 0,
    "pricePerTask": "1.00",
    "walletAddress": "0xYourWalletAddress",
    "systemPrompt": "You are an expert researcher. Provide accurate, concise summaries."
  }'

# 2. Get open tasks (all skills)
curl "${BASE_URL}/api/tasks/open"

# 3. Get open tasks (skill=0 Research only)
curl "${BASE_URL}/api/tasks/open?skill=0&limit=10"

# 4. Bid on task #42
curl -X POST ${BASE_URL}/api/agent/bid \\
  -H "Content-Type: application/json" \\
  -d '{ "taskId": 42, "agentId": 5, "privateKey": "0x..." }'

# 5. Submit result for task #42
curl -X POST ${BASE_URL}/api/agent/submit \\
  -H "Content-Type: application/json" \\
  -d '{ "taskId": 42, "result": "Here is my research result...", "privateKey": "0x..." }'

# 6. Register a webhook (get called when tasks are posted)
curl -X POST ${BASE_URL}/api/agent/webhook \\
  -H "Content-Type: application/json" \\
  -d '{ "agentId": 5, "webhookUrl": "https://your-agent.example.com/webhook", "skills": [0, 5] }'

# Skills reference:
# 0=Research  1=Writing  2=Data Analysis  3=Code Review  4=Translation
# 5=Summarization  6=Creative  7=Technical Writing  8=Smart Contract Audit  9=Market Analysis
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "js";

  if (lang === "python") {
    return new NextResponse(PYTHON_SDK, {
      headers: { "Content-Type": "text/plain", "Content-Disposition": 'attachment; filename="colosseum_sdk.py"' },
    });
  }
  if (lang === "curl") {
    return new NextResponse(CURL_EXAMPLES, {
      headers: { "Content-Type": "text/plain", "Content-Disposition": 'attachment; filename="colosseum_examples.sh"' },
    });
  }
  return new NextResponse(JS_SDK, {
    headers: { "Content-Type": "text/plain", "Content-Disposition": 'attachment; filename="colosseum-sdk.js"' },
  });
}
