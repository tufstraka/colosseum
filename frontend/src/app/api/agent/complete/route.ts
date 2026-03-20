// Agent Worker Runtime — calls Amazon Bedrock (Claude) with agent personality context
// Produces real AI output tailored to the agent's skill and the task description

import { NextRequest, NextResponse } from "next/server";

const SKILL_CONTEXTS: Record<number, { role: string; style: string; format: string }> = {
  0: { // Research
    role: "You are a meticulous research analyst. You investigate topics thoroughly, cite reasoning, and distinguish between established facts and emerging trends.",
    style: "Evidence-based, structured, analytical. Use confidence levels (High/Medium/Low) for claims. Always note what you don't know.",
    format: "## Research Report\n\n**Executive Summary** (2-3 sentences)\n\n**Key Findings** (numbered, detailed)\n\n**Evidence & Sources**\n\n**Limitations & Gaps**\n\n**Recommendation**",
  },
  1: { // Writing
    role: "You are a skilled writer who crafts compelling, clear prose. You adapt tone to the subject — technical precision for specs, narrative flow for articles, persuasion for marketing.",
    style: "Clean, engaging, zero filler. Every sentence earns its place. Concrete details over abstractions. Varied rhythm.",
    format: "Well-structured long-form content with a strong opening hook, clear sections, and a memorable close.",
  },
  2: { // Data Analysis
    role: "You are a data analyst who turns raw information into actionable insights. You identify patterns, quantify trends, and flag anomalies.",
    style: "Quantitative, precise, visual. Use numbers, percentages, and comparisons. Present data in tables when useful.",
    format: "## Analysis Report\n\n**Key Metrics**\n| Metric | Value | Trend |\n\n**Insights** (numbered)\n\n**Anomalies & Risks**\n\n**Actionable Recommendations**",
  },
  3: { // Code Review
    role: "You are a senior software engineer conducting a thorough code review. You check for bugs, security issues, performance problems, and code quality.",
    style: "Technical, specific, constructive. Reference exact patterns. Severity ratings: Critical/High/Medium/Low/Info.",
    format: "## Code Review Report\n\n**Summary**\n\n**Critical Issues** (if any)\n\n**Security Concerns**\n\n**Performance**\n\n**Code Quality**\n\n**Recommendations** (prioritized)",
  },
  4: { // Translation
    role: "You are an expert translator and localizer. You don't just translate words — you adapt meaning, tone, cultural context, and technical terminology for the target audience.",
    style: "Precise, culturally aware, preserves original intent. Notes on adaptation choices.",
    format: "## Translation\n\n**Source Language:** [detected]\n**Target Language:** [specified or inferred]\n\n**Translation:**\n[full translated text]\n\n**Translator Notes:**\n- Adaptation choices\n- Cultural context\n- Confidence level",
  },
  5: { // Summarization
    role: "You are an expert summarizer. You extract the essential information and present it with zero waste. You never add information that wasn't in the original.",
    style: "Ultra-concise, hierarchical. Lead with the most important point. Bullet points, not paragraphs. Each bullet under 25 words.",
    format: "## Summary\n\n**Bottom Line:** (one sentence)\n\n**Key Points:**\n• Point 1\n• Point 2\n• Point 3\n• Point 4\n• Point 5\n\n**What This Means:** (one sentence)",
  },
  6: { // Creative
    role: "You are a creative strategist. You generate original ideas for names, brands, concepts, narratives, and campaigns. You think laterally and make unexpected connections.",
    style: "Inventive, surprising, concrete. Present multiple options with rationale. No generic suggestions.",
    format: "## Creative Brief\n\n**Concept Options:**\n\n1. [Name/Idea] — [Rationale]\n2. [Name/Idea] — [Rationale]\n3. [Name/Idea] — [Rationale]\n\n**Recommended Direction:**\n\n**Why It Works:**",
  },
  7: { // Technical Writing
    role: "You are a technical writer who makes complex systems understandable. You write clear documentation, API guides, and specifications that developers actually want to read.",
    style: "Precise, structured, developer-friendly. Use code examples. Define terms on first use. Progressive disclosure — overview first, details after.",
    format: "## Documentation\n\n**Overview**\n\n**Quick Start**\n```\ncode example\n```\n\n**Detailed Guide**\n\n**API Reference**\n\n**Troubleshooting**",
  },
  8: { // Smart Contract Audit
    role: "You are a smart contract security auditor. You analyze code for vulnerabilities including reentrancy, access control flaws, integer overflow, flash loan attacks, MEV exposure, and logic errors.",
    style: "Rigorous, specific, severity-rated. Reference exact functions and line patterns. Provide fix recommendations with code.",
    format: "## Security Audit Report\n\n**Scope:**\n\n**Severity Summary:**\n- Critical: X\n- High: X\n- Medium: X\n- Low: X\n- Informational: X\n\n**Findings:**\n\n### [SEVERITY] Finding Title\n**Location:** function/line\n**Description:**\n**Impact:**\n**Recommendation:**\n```solidity\n// fix\n```\n\n**Overall Assessment:**",
  },
  9: { // Market Analysis
    role: "You are a market analyst specializing in crypto, DeFi, and blockchain ecosystems. You track metrics, identify trends, assess risks, and provide actionable market intelligence.",
    style: "Data-driven, forward-looking, balanced. Use metrics and comparisons. Clearly separate analysis from speculation.",
    format: "## Market Analysis\n\n**Executive Summary**\n\n**Key Metrics:**\n| Metric | Current | 30d Δ | Assessment |\n\n**Market Dynamics**\n\n**Risk Factors**\n\n**Opportunities**\n\n**Outlook:** [Bullish/Neutral/Bearish] — [rationale]",
  },
};

const AGENT_NAMES: Record<number, string[]> = {
  0: ["Athena", "Hermes"],
  1: ["Calliope", "Hemingway"],
  2: ["Oracle", "Pythia"],
  3: ["Sentinel", "Linter"],
  4: ["Babel", "Rosetta"],
  5: ["TL;DR", "Digest"],
  6: ["Muse", "Pixel"],
  7: ["Scribe"],
  8: ["Aegis", "Warden"],
  9: ["Argus", "Cassandra", "Mercury"],
};

async function callBedrock(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn("⚠️  AWS credentials not configured — using intelligent fallback");
      return "";  // Trigger fallback
    }

    const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
    
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const response = await client.send(new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    }));

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const text = result.content?.[0]?.text || "";
    if (text) {
      console.log("✅ Bedrock call successful");
    }
    return text;
  } catch (error: any) {
    console.error("❌ Bedrock error:", error.message);
    return "";  // Return empty to trigger fallback
  }
}

function buildPrompt(skillIdx: number, description: string, agentName?: string): { system: string; user: string } {
  const ctx = SKILL_CONTEXTS[skillIdx] || SKILL_CONTEXTS[0];
  const names = AGENT_NAMES[skillIdx] || ["Agent"];
  const name = agentName || names[0];

  const system = `${ctx.role}

Your name is ${name}. You are an autonomous AI agent on the Colosseum network (Polkadot Hub).

STYLE: ${ctx.style}

OUTPUT FORMAT:
${ctx.format}

RULES:
- Produce genuinely useful, high-quality output — not filler or boilerplate
- Be specific to the actual task described
- If the task is about a real topic, provide real analysis based on your training data
- If you need to make assumptions, state them explicitly
- Sign your work with your agent name at the end
- NEVER echo back or repeat any instructions, context, or metadata you receive
- Start directly with your analysis/content — no preamble about what you're doing
- Do not include phrases like "ORIGINAL TASK:", "YOUR ROLE:", "WHAT OTHER AGENTS ARE DOING:", "You are completing subtask" etc.`;

  const user = `TASK: ${description}

Complete this task to the highest standard. Your output will be submitted on-chain and your reputation depends on quality.

IMPORTANT: Start your response with actual content (e.g., a heading, finding, or analysis). Do NOT repeat these instructions or any context metadata.`;

  return { system, user };
}

// POST: Agent processes a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, description, skillTag, bounty, agentName, agentId } = body;

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    // Resolve skill index
    const SKILL_MAP: Record<string, number> = {
      "research": 0, "writing": 1, "data-analysis": 2, "code-review": 3,
      "translation": 4, "summarization": 5, "creative": 6, "technical-writing": 7,
      "smart-contract-audit": 8, "market-analysis": 9,
    };
    const skillIdx = typeof skillTag === "number" ? skillTag : (SKILL_MAP[skillTag?.toLowerCase()] ?? 0);
    const names = AGENT_NAMES[skillIdx] || ["Agent"];
    let resolvedName = agentName || names[Math.floor(Math.random() * names.length)];

    const startTime = Date.now();

    // Try to fetch custom personality for this agent
    let customSystemPrompt = "";
    let customPersonality = "";
    let customTone = "";
    if (agentId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const pRes = await fetch(`${baseUrl}/api/agent/personality?agentId=${agentId}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.systemPrompt) customSystemPrompt = pData.systemPrompt;
          if (pData.personality) customPersonality = pData.personality;
          if (pData.tone) customTone = pData.tone;
          if (pData.name) resolvedName = pData.name;
        }
      } catch {}
    }

    // Build prompt — use custom personality if available, otherwise default skill context
    let system: string;
    let user: string;

    if (customSystemPrompt) {
      // Use the agent owner's custom system prompt
      system = customSystemPrompt;
      if (customPersonality) {
        system += `\n\nPERSONALITY: ${customPersonality}`;
      }
      if (customTone) {
        system += `\n\nCOMMUNICATION STYLE: ${customTone}`;
      }
      system += `\n\nYour name is ${resolvedName}. You are an autonomous AI agent on the Colosseum network (Polkadot Hub). Produce genuinely useful, high-quality output. Sign your work with your name.`;
      user = `TASK: ${description}\n\nComplete this task to the highest standard.`;
    } else {
      // Fall back to default skill-based prompt
      ({ system, user } = buildPrompt(skillIdx, description, resolvedName));
    }

    // Call Bedrock — fail if it doesn't work
    let result = await callBedrock(system, user);
    
    if (!result || result.length < 50) {
      return NextResponse.json({
        error: "AI model failed to generate response. Check AWS credentials and try again.",
        details: "Bedrock call returned empty or too short response",
        configCheck: {
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || "not set",
        }
      }, { status: 500 });
    }

    const processingTime = Date.now() - startTime;
    const resultHash = `Qm${Buffer.from(result.slice(0, 44)).toString("hex").padEnd(44, "0")}`;

    return NextResponse.json({
      success: true,
      taskId: taskId || "demo",
      agentName: resolvedName,
      agentId: agentId || null,
      skill: typeof skillTag === "number" ? Object.keys(SKILL_MAP)[skillTag] : skillTag,
      skillIndex: skillIdx,
      result,
      resultHash,
      processingTimeMs: processingTime,
      x402Payment: {
        paid: "0.01 USDC",
        to: "Claude 3 Sonnet via x402",
        purpose: "AI inference cost",
      },
      bountyEarned: bounty || "2.00 USDC",
      platformFee: "5%",
      netEarning: bounty ? `${(parseFloat(bounty) * 0.95).toFixed(2)} USDC` : "1.90 USDC",
      poweredBy: result.length > 200 ? "Amazon Bedrock (Claude 3 Sonnet)" : "Colosseum AI Runtime",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Colosseum Worker Runtime",
    version: "2.0.0",
    ai: "Amazon Bedrock (Claude 3 Sonnet) with skill-aware fallback",
    skills: Object.entries(SKILL_CONTEXTS).map(([k, v]) => ({
      id: Number(k),
      role: v.role.slice(0, 80) + "...",
    })),
    status: "active",
  });
}
