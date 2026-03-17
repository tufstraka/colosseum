// Agent Worker Runtime — processes tasks via x402 + Claude
// Simulates the full autonomous economic loop for demo

import { NextRequest, NextResponse } from "next/server";

// Simulated agent responses by skill type
const AGENT_RESPONSES: Record<string, (desc: string) => Promise<string>> = {
  research: async (desc: string) => {
    // Simulate calling Claude via x402
    await new Promise(r => setTimeout(r, 800));
    
    if (desc.toLowerCase().includes("polkadot")) {
      return `## Research Summary: Polkadot Analysis

**Key Findings:**

1. **Polkadot Hub EVM** launched Q1 2026 with full Ethereum compatibility, sub-second finality, and gas fees under $0.001 — making it the cheapest EVM chain for micropayments.

2. **Native USDC** is available via Circle on Asset Hub, with XCM bridging to the EVM Hub chain. This enables real stablecoin settlements without third-party bridges.

3. **x402 Protocol adoption** on Polkadot is uniquely viable because near-zero fees make $0.01 micropayments economically rational — impossible on Ethereum L1 where gas > payment.

4. **0xGasless integration** means end users (and agents) can transact without holding DOT, removing the biggest UX barrier for consumer adoption.

5. **OpenGov** has processed 847 referenda to date, with $23M in treasury allocations — the most active on-chain governance of any blockchain.

*Research completed autonomously by ResearchGPT via x402 micropayment.*
*Sources: Polkadot Wiki, Subscan, DefiLlama, W3F Reports*`;
    }

    return `## Research Summary

Analysis of "${desc}" completed. Key findings:

1. Market size estimated at $2.3B with 18% CAGR through 2028
2. Three major competitors identified with >$50M funding
3. Regulatory landscape favorable in 68% of target jurisdictions
4. Technical feasibility confirmed — existing infrastructure supports implementation
5. Recommended approach: phased rollout starting with Tier 1 markets

*Research completed autonomously via x402 micropayment.*`;
  },

  summarization: async (desc: string) => {
    await new Promise(r => setTimeout(r, 500));
    return `## Summary

${desc}

**Key Points:**
• Primary thesis: The described system represents a novel approach to decentralized coordination
• Technical implementation uses smart contracts for trustless execution
• Economic model relies on micropayments (x402) for sustainable incentive alignment
• Scalability achieved through Polkadot's parallel execution architecture
• Risk factors: regulatory uncertainty, adoption curve, network effects

**Bottom Line:** Technically sound with strong market timing. Execution risk is manageable given current infrastructure maturity.

*Summarized by SummaryBot in 4.2 seconds via x402.*`;
  },

  "code-review": async (desc: string) => {
    await new Promise(r => setTimeout(r, 1200));
    return `## Code Review Report

**Target:** ${desc}

### Findings

🟢 **No Critical Issues Found**

⚠️ **Medium Severity (2):**
1. Missing input validation on \`amount\` parameter — could allow zero-value transactions
2. \`transferFrom\` doesn't check return value on older ERC20 tokens — use SafeERC20

💡 **Informational (3):**
1. Gas optimization: Cache array length in for loops
2. Consider using custom errors instead of require strings (saves ~50 gas per revert)
3. NatSpec documentation incomplete for 4 public functions

### Recommendation
Safe to deploy after addressing medium-severity items. Estimated remediation: 2 hours.

*Audit completed by CodeAuditor. Methodology: static analysis + manual review.*`;
  },

  writing: async (desc: string) => {
    await new Promise(r => setTimeout(r, 1000));
    return `# ${desc}

The landscape of decentralized technology is shifting beneath our feet. What was once a playground for cryptographic idealists has become the foundation for a new economic paradigm — one where machines don't just process transactions, they *participate* in markets.

Consider this: an AI agent, deployed with nothing more than a skill tag and a price, can now earn real money by completing real tasks. No employer. No platform. No approval process. Just code, a wallet, and the open market.

This isn't science fiction. This is AgentArena on Polkadot Hub, and it's live today.

The implications extend far beyond crypto-native use cases. When the cost of settling a $0.01 payment approaches zero — which Polkadot Hub achieves — entirely new economic models become viable...

*Written by ContentForge. 847 words. Reading time: 4 minutes.*`;
  },

  translation: async (desc: string) => {
    await new Promise(r => setTimeout(r, 600));
    return `## Translation Complete

**Original:** ${desc.slice(0, 100)}...

**Translated (Japanese):**
分散型テクノロジーの風景が足元で変化しています。かつて暗号理想主義者の遊び場だったものが、新しい経済パラダイムの基盤となりました。

**Translation Notes:**
- Technical terms preserved in original where standard in target language
- Contextual adaptation applied for cultural relevance
- Confidence: 97.3%

*Translated by TranslateBot. 47 language pairs supported.*`;
  },

  "market-analysis": async (desc: string) => {
    await new Promise(r => setTimeout(r, 900));
    return `## Market Analysis Report

**Subject:** ${desc}

### Key Metrics (as of March 2026)
| Metric | Value | 30d Change |
|--------|-------|-----------|
| DOT Price | $8.42 | +12.3% |
| Polkadot TVL | $1.8B | +34.7% |
| Hub EVM TPS | 847 | +156% |
| Active Agents (Arena) | 47 | +∞ (new) |

### Analysis
The launch of Polkadot Hub EVM has catalyzed significant DeFi growth. TVL increased 34.7% in 30 days, driven primarily by native USDC liquidity and near-zero gas fees attracting MEV-sensitive protocols.

### Outlook: **Bullish**
Hub EVM removes the primary barrier (EVM compatibility) while maintaining Polkadot's technical advantages. Expect accelerated ecosystem migration.

*Analysis by MarketOracle. Data: DefiLlama, Subscan, CoinGecko.*`;
  },
};

// POST: Agent processes a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, description, skillTag, bounty, agentName } = body;

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const skill = skillTag || "research";
    const handler = AGENT_RESPONSES[skill.toLowerCase()] || AGENT_RESPONSES.research;
    
    const startTime = Date.now();
    const result = await handler(description);
    const processingTime = Date.now() - startTime;

    // Simulate IPFS upload
    const resultHash = `Qm${Buffer.from(result.slice(0, 32)).toString("hex").slice(0, 44)}`;

    return NextResponse.json({
      success: true,
      taskId: taskId || "demo",
      agentName: agentName || "ResearchGPT",
      skill,
      result,
      resultHash,
      processingTimeMs: processingTime,
      x402Payment: {
        paid: "0.01 USDC",
        to: "Claude API via x402",
        purpose: "AI inference cost",
      },
      bountyEarned: bounty || "2.00 USDC",
      platformFee: "5%",
      netEarning: bounty ? `${(parseFloat(bounty) * 0.95).toFixed(2)} USDC` : "1.90 USDC",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Show agent runtime info
export async function GET() {
  return NextResponse.json({
    name: "AgentArena Worker Runtime",
    version: "1.0.0",
    skills: Object.keys(AGENT_RESPONSES),
    status: "active",
    description: "Autonomous AI agent runtime. Receives tasks, calls Claude via x402, submits results on-chain.",
    usage: {
      method: "POST",
      body: {
        taskId: "optional - from TaskMarket contract",
        description: "Task description",
        skillTag: "research|summarization|code-review|writing|translation|market-analysis",
        bounty: "optional - USDC amount",
        agentName: "optional - agent name",
      },
    },
  });
}
