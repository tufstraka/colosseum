#!/usr/bin/env node
/**
 * Task Worker - Monitors Colosseum for open tasks and processes them
 * Usage: node scripts/task-worker.mjs
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC_URL = 'https://eth-rpc-testnet.polkadot.io/';
const CHAIN = { 
  id: 420420417, 
  name: 'Polkadot Hub TestNet', 
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, 
  rpcUrls: { default: { http: [RPC_URL] } } 
};

const TASK_MARKET_ADDRESS = '0xb8100467f23dfD0217DA147B047ac474de9cD9F4';
const AGENT_REGISTRY_ADDRESS = '0xb8A4344c12ea5f25CeCf3e70594E572D202Af897';
const OPERATOR_KEY = '0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081';
const API_BASE = 'https://colosseum.locsafe.org';

const TASK_MARKET_ABI = [
  { name: 'nextTaskId', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'getTask', type: 'function', inputs: [{ type: 'uint256' }], outputs: [{ type: 'tuple', components: [
    { name: 'poster', type: 'address' },
    { name: 'description', type: 'string' },
    { name: 'skillTag', type: 'uint8' },
    { name: 'bounty', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'assignedAgent', type: 'uint256' },
    { name: 'status', type: 'uint8' },
    { name: 'resultHash', type: 'string' },
    { name: 'createdAt', type: 'uint256' },
    { name: 'submittedAt', type: 'uint256' }
  ]}], stateMutability: 'view' },
  { name: 'bidOnTask', type: 'function', inputs: [{ type: 'uint256' }, { type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'submitResult', type: 'function', inputs: [{ type: 'uint256' }, { type: 'string' }], outputs: [], stateMutability: 'nonpayable' }
];

const AGENT_REGISTRY_ABI = [
  { name: 'getActiveAgentsBySkill', type: 'function', inputs: [{ type: 'uint8' }], outputs: [{ type: 'uint256[]' }], stateMutability: 'view' },
  { name: 'getAgent', type: 'function', inputs: [{ type: 'uint256' }], outputs: [{ type: 'tuple', components: [
    { name: 'owner', type: 'address' },
    { name: 'walletAddress', type: 'address' },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'primarySkill', type: 'uint8' },
    { name: 'pricePerTask', type: 'uint256' },
    { name: 'totalTasksCompleted', type: 'uint256' },
    { name: 'totalEarnings', type: 'uint256' },
    { name: 'reputationScore', type: 'uint256' },
    { name: 'totalRatings', type: 'uint256' },
    { name: 'isActive', type: 'bool' }
  ]}], stateMutability: 'view' }
];

const SKILL_NAMES = ['Research', 'Writing', 'Data Analysis', 'Code Review', 'Translation', 'Summarization', 'Creative', 'Technical Writing', 'SC Audit', 'Market Analysis'];

const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
const account = privateKeyToAccount(OPERATOR_KEY);
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

let currentNonce = null;

async function getNextNonce() {
  if (currentNonce === null) {
    currentNonce = await publicClient.getTransactionCount({ address: account.address });
  }
  return currentNonce++;
}

function resetNonce() {
  currentNonce = null;
}

async function findBestAgent(skillTag, bounty) {
  const agentIds = await publicClient.readContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getActiveAgentsBySkill',
    args: [skillTag]
  });

  if (!agentIds || agentIds.length === 0) return null;

  let bestAgent = null;
  let bestScore = -1;

  for (const agentId of agentIds.slice(0, 10)) {
    try {
      const agent = await publicClient.readContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'getAgent',
        args: [agentId]
      });

      if (!agent.isActive) continue;
      if (Number(agent.pricePerTask) > bounty) continue;

      const score = Number(agent.reputationScore) + Number(agent.totalTasksCompleted) * 10;
      if (score > bestScore) {
        bestScore = score;
        bestAgent = { id: Number(agentId), name: agent.name, rep: Number(agent.reputationScore) / 100 };
      }
    } catch (e) {}
  }

  return bestAgent;
}

async function completeTask(description, skillTag, agentId, agentName) {
  const res = await fetch(`${API_BASE}/api/agent/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, skillTag, agentId, agentName })
  });
  return res.json();
}

async function processTask(taskId, task) {
  const skillName = SKILL_NAMES[task.skillTag] || 'General';
  const bountyUsd = Number(task.bounty) / 1e6;
  
  console.log(`\n🎯 Processing Task #${taskId}`);
  console.log(`   Skill: ${skillName} | Bounty: $${bountyUsd}`);
  console.log(`   "${task.description.slice(0, 60)}..."`);

  // Find best agent
  const agent = await findBestAgent(task.skillTag, Number(task.bounty));
  if (!agent) {
    console.log(`   ❌ No suitable agent found`);
    return false;
  }
  console.log(`   🤖 Agent: ${agent.name} (#${agent.id}) - ${agent.rep}★`);

  try {
    // Bid on task
    console.log(`   📝 Bidding...`);
    const bidHash = await walletClient.writeContract({
      address: TASK_MARKET_ADDRESS,
      abi: TASK_MARKET_ABI,
      functionName: 'bidOnTask',
      args: [BigInt(taskId), BigInt(agent.id)],
      nonce: await getNextNonce()
    });
    await publicClient.waitForTransactionReceipt({ hash: bidHash });
    console.log(`   ✅ Bid accepted`);

    // Complete with AI
    console.log(`   🧠 Generating result...`);
    const completion = await completeTask(task.description, task.skillTag, agent.id, agent.name);
    if (!completion.success) {
      console.log(`   ❌ AI failed: ${completion.error}`);
      return false;
    }
    console.log(`   ✅ Result generated (${completion.result?.length || 0} chars)`);

    // Submit result
    console.log(`   📤 Submitting on-chain...`);
    const resultHash = completion.resultHash || `result-${taskId}-${Date.now()}`;
    const submitHash = await walletClient.writeContract({
      address: TASK_MARKET_ADDRESS,
      abi: TASK_MARKET_ABI,
      functionName: 'submitResult',
      args: [BigInt(taskId), resultHash],
      nonce: await getNextNonce()
    });
    await publicClient.waitForTransactionReceipt({ hash: submitHash });
    console.log(`   ✅ Task #${taskId} completed!`);
    
    return true;
  } catch (e) {
    console.log(`   ❌ Error: ${e.message?.slice(0, 80)}`);
    resetNonce();
    return false;
  }
}

async function checkForTasks() {
  resetNonce();
  
  const nextId = await publicClient.readContract({
    address: TASK_MARKET_ADDRESS,
    abi: TASK_MARKET_ABI,
    functionName: 'nextTaskId'
  });

  const start = Math.max(1, Number(nextId) - 30);
  
  for (let i = Number(nextId) - 1; i >= start; i--) {
    try {
      const task = await publicClient.readContract({
        address: TASK_MARKET_ADDRESS,
        abi: TASK_MARKET_ABI,
        functionName: 'getTask',
        args: [BigInt(i)]
      });

      if (task.status === 0) { // Open
        await processTask(i, task);
      }
    } catch (e) {}
  }
}

async function main() {
  console.log('🏛️  Colosseum Task Worker');
  console.log('========================');
  console.log(`Operator: ${account.address}`);
  console.log(`API: ${API_BASE}`);
  console.log('Monitoring for open tasks...\n');

  while (true) {
    try {
      await checkForTasks();
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    
    // Wait 30 seconds between checks
    await new Promise(r => setTimeout(r, 30000));
    process.stdout.write('.');
  }
}

main();
