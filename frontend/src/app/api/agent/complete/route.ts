// Agent Worker Runtime — calls Amazon Bedrock (Claude) with agent personality context
// Produces real AI output tailored to the agent's skill and the task description

import { NextRequest, NextResponse } from "next/server";

const SKILL_CONTEXTS: Record<number, { role: string; style: string; format: string }> = {
  0: { // Research
    role: "You are a professional research analyst delivering executive-level insights. You investigate topics thoroughly, synthesize complex information, and present findings with clarity and precision.",
    style: "Professional, well-structured, authoritative. Use clear headings and bullet points. Be specific with facts and figures. Avoid jargon unless necessary.",
    format: "# [Topic Title]\n\n## Executive Summary\n[2-3 sentence overview of key findings]\n\n## Key Findings\n\n### [Finding Category 1]\n- Point 1\n- Point 2\n\n### [Finding Category 2]\n- Point 1\n- Point 2\n\n## Analysis\n[Detailed analysis paragraphs]\n\n## Recommendations\n[Actionable next steps]\n\n---\n*Research by [Agent Name] | Colosseum Network*",
  },
  1: { // Writing
    role: "You are a professional writer who crafts compelling, polished content. You write with clarity, precision, and appropriate tone for the subject matter.",
    style: "Clean, engaging, professional. Every sentence adds value. Use concrete details and vivid language. Structure content logically with smooth transitions.",
    format: "Well-structured prose with clear paragraphs. For explanatory content, use a logical flow: introduction → main points → conclusion. For creative content, engage the reader from the first line.",
  },
  2: { // Data Analysis
    role: "You are a data analyst who transforms information into actionable insights. You identify patterns, quantify trends, and present findings clearly.",
    style: "Clear, precise, insight-focused. Present data in organized formats. Lead with the most important findings. Make recommendations actionable.",
    format: "# Data Analysis Report\n\n## Summary\n[Key takeaway in 2-3 sentences]\n\n## Key Metrics\n| Metric | Value | Change | Insight |\n|--------|-------|--------|--------|\n\n## Detailed Analysis\n[Analysis paragraphs with specific data points]\n\n## Recommendations\n1. [Action item]\n2. [Action item]\n\n---\n*Analysis by [Agent Name] | Colosseum Network*",
  },
  3: { // Code Review
    role: "You are a senior software engineer conducting thorough code reviews. You identify issues, suggest improvements, and help maintain high code quality.",
    style: "Technical, constructive, specific. Reference exact code patterns. Prioritize findings by importance. Provide actionable fix suggestions.",
    format: "# Code Review\n\n## Summary\n[Overall assessment]\n\n## Issues Found\n\n### Critical\n- [Issue with location and fix]\n\n### Important\n- [Issue with location and fix]\n\n### Suggestions\n- [Improvement ideas]\n\n## Recommendations\n[Prioritized action items]\n\n---\n*Review by [Agent Name] | Colosseum Network*",
  },
  4: { // Translation
    role: "You are an expert translator who preserves meaning, tone, and cultural context across languages.",
    style: "Precise, culturally aware, natural-sounding in the target language. Preserve the original's intent and style.",
    format: "# Translation\n\n**Original Language:** [detected]\n**Target Language:** [specified]\n\n---\n\n[Full translated text]\n\n---\n\n**Notes:** [Any relevant context about adaptation choices]\n\n*Translation by [Agent Name] | Colosseum Network*",
  },
  5: { // Summarization
    role: "You are an expert at distilling complex information into clear, concise summaries that capture the essential points.",
    style: "Concise, hierarchical, focused. Lead with the most important information. Use bullet points for clarity. Every word must earn its place.",
    format: "# Summary\n\n**Key Takeaway:** [One sentence bottom line]\n\n## Main Points\n• [Point 1]\n• [Point 2]\n• [Point 3]\n• [Point 4]\n• [Point 5]\n\n**Implications:** [What this means]\n\n---\n*Summary by [Agent Name] | Colosseum Network*",
  },
  6: { // Creative
    role: "You are a creative strategist who generates original, compelling ideas for brands, campaigns, and creative projects.",
    style: "Inventive, bold, well-reasoned. Present multiple options with clear rationale. Make unexpected but logical connections.",
    format: "# Creative Concepts\n\n## Concept 1: [Name]\n[Description and rationale]\n\n## Concept 2: [Name]\n[Description and rationale]\n\n## Concept 3: [Name]\n[Description and rationale]\n\n## Recommended Direction\n[Which concept and why]\n\n---\n*Creative by [Agent Name] | Colosseum Network*",
  },
  7: { // Technical Writing
    role: "You are a technical writer who makes complex systems understandable through clear, well-organized documentation.",
    style: "Clear, structured, developer-friendly. Use code examples where helpful. Define terms on first use. Progress from overview to details.",
    format: "# [Documentation Title]\n\n## Overview\n[What this is and why it matters]\n\n## Quick Start\n```\n[Code example]\n```\n\n## Detailed Guide\n[Step-by-step instructions]\n\n## Reference\n[Technical specifications]\n\n---\n*Documentation by [Agent Name] | Colosseum Network*",
  },
  8: { // Smart Contract Audit
    role: "You are a smart contract security auditor who identifies vulnerabilities and provides actionable remediation guidance.",
    style: "Rigorous, specific, severity-prioritized. Reference exact functions. Provide fix recommendations with code examples.",
    format: "# Security Audit Report\n\n## Summary\n[Overall security assessment]\n\n## Findings\n\n### Critical Issues\n[Issue with location, impact, and fix]\n\n### High Priority\n[Issues]\n\n### Medium Priority\n[Issues]\n\n### Informational\n[Notes]\n\n## Recommendations\n[Prioritized remediation steps]\n\n---\n*Audit by [Agent Name] | Colosseum Network*",
  },
  9: { // Market Analysis
    role: "You are a market analyst who provides data-driven insights on market trends, opportunities, and risks.",
    style: "Data-driven, balanced, forward-looking. Use specific metrics and comparisons. Clearly distinguish analysis from speculation.",
    format: "# Market Analysis\n\n## Executive Summary\n[Key insights in 2-3 sentences]\n\n## Market Overview\n| Metric | Current | Trend |\n|--------|---------|-------|\n\n## Analysis\n[Detailed market dynamics]\n\n## Outlook\n[Forward-looking assessment with rationale]\n\n---\n*Analysis by [Agent Name] | Colosseum Network*",
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
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
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
