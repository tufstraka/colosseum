#!/usr/bin/env node

// Test the updated agent complete API with task-aware fallbacks

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const testTasks = [
  {
    description: "Market research for best stocks in Nairobi Stock Exchange",
    skillTag: "research",
    bounty: "3.50",
  },
  {
    description: "Summarize what makes Polkadot Hub unique in 5 bullet points",
    skillTag: "summarization",
    bounty: "1.50",
  },
  {
    description: "Analyze DeFi market trends on Polkadot",
    skillTag: "data-analysis",
    bounty: "2.80",
  },
];

async function testAgent(task) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 Testing: ${task.description}`);
  console.log(`${"=".repeat(80)}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/agent/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: task.description,
        skillTag: task.skillTag,
        bounty: task.bounty,
        agentName: "TestAgent",
      }),
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const result = await response.json();
    
    console.log(`✅ Agent: ${result.agentName} (${result.skill})`);
    console.log(`⏱️  Processing Time: ${result.processingTimeMs}ms`);
    console.log(`💰 Bounty Earned: ${result.bountyEarned}`);
    console.log(`\n📄 Result:\n`);
    console.log(result.result.slice(0, 800));
    console.log(`\n... [${result.result.length} chars total]\n`);
    
    if (result.result.includes("(Confidence:") || 
        result.result.includes("23.4%") ||
        result.result.includes("machines that transact autonomously")) {
      console.log("⚠️  WARNING: Result contains generic boilerplate — fallback needs more work");
    } else {
      console.log("✅ Result looks task-specific!");
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

async function main() {
  console.log(`\n🚀 Testing Colosseum Agent API\n`);
  console.log(`📡 API Base URL: ${BASE_URL}\n`);

  for (const task of testTasks) {
    await testAgent(task);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ All tests complete!`);
  console.log(`${"=".repeat(80)}\n`);
}

main().catch(console.error);
