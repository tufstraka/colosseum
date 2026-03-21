#!/usr/bin/env node
/**
 * Task Completer - ONLY completes open tasks, does NOT post new ones
 */

import { createPublicClient, createWalletClient, http } from 'viem';
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
  { name: 'tasks', type: 'function', inputs: [{ type: 'uint256' }], outputs: [
    { type: 'address' }, { type: 'string' }, { type: 'uint8' }, { type: 'uint256' },
    { type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }, { type: 'string' },
    { type: 'uint256' }, { type: 'uint256' }
  ], stateMutability: 'view' },
  { name: 'bidOnTask', type: 'function', inputs: [{ type: 'uint256' }, { type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'submitResult', type: 'function', inputs: [{ type: 'uint256' }, { type: 'string' }], outputs: [], stateMutability: 'nonpayable' }
];

const AGENT_REGISTRY_ABI = [
  { name: 'nextAgentId', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'getAgent', type: 'function', inputs: [{ type: 'uint256' }], outputs: [
    { type: 'address' }, { type: 'address' }, { type: 'string' }, { type: 'string' },
    { type: 'uint8' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' },
    { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }
  ], stateMutability: 'view' }
];

const SKILL_NAMES = ['Research', 'Writing', 'Data Analysis', 'Code Review', 'Translation', 'Summarization', 'Creative', 'Technical Writing', 'SC Audit', 'Market Analysis'];

const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
const account = privateKeyToAccount(OPERATOR_KEY);
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

let currentNonce = null;
let agentCache = new Map();

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getNextNonce() {
  if (currentNonce === null) {
    currentNonce = await publicClient.getTransactionCount({ address: account.address });
  }
  return currentNonce++;
}

function resetNonce() { currentNonce = null; }

async function retry(fn, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries - 1) throw e;
      await sleep(delay * (i + 1));
    }
  }
}

async function loadAgents() {
  console.log('📥 Loading agents...');
  const nextAgentId = await publicClient.readContract({
    address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI, functionName: 'nextAgentId'
  });
  
  for (let i = 1; i < Number(nextAgentId); i++) {
    try {
      const agent = await publicClient.readContract({
        address: AGENT_REGISTRY_ADDRESS, abi: AGENT_REGISTRY_ABI,
        functionName: 'getAgent', args: [BigInt(i)]
      });
      const [owner, wallet, name, desc, skill, price, tasks, earnings, rep, ratings, active] = agent;
      if (active) {
        const skillNum = Number(skill);
        if (!agentCache.has(skillNum)) agentCache.set(skillNum, []);
        agentCache.get(skillNum).push({
          id: i, name, rep: Number(rep), tasks: Number(tasks), price: Number(price)
        });
      }
    } catch (e) {}
  }
  
  let total = 0;
  for (const [skill, agents] of agentCache) {
    total += agents.length;
  }
  console.log(`✅ Loaded ${total} active agents\n`);
}

function findBestAgent(skillTag, bounty) {
  const agents = agentCache.get(skillTag) || [];
  if (!agents.length) return null;
  const eligible = agents.filter(a => a.price <= bounty);
  if (!eligible.length) return null;
  eligible.sort((a, b) => (b.rep + b.tasks * 10) - (a.rep + a.tasks * 10));
  return eligible[0];
}

async function completeWithAI(description, skillTag, agentId, agentName) {
  const res = await fetch(`${API_BASE}/api/agent/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, skillTag, agentId, agentName })
  });
  return res.json();
}

async function processTask(taskId, task) {
  const [poster, description, skillTag, bounty, deadline, assignedAgent, status] = task;
  
  if (status !== 0) return false; // Not open
  
  const skillNum = Number(skillTag);
  const bountyNum = Number(bounty);
  
  const agent = findBestAgent(skillNum, bountyNum);
  if (!agent) {
    console.log(`   ⏭️  #${taskId}: No agent for ${SKILL_NAMES[skillNum]}`);
    return false;
  }
  
  console.log(`\n🎯 Task #${taskId}: ${description.slice(0, 50)}...`);
  console.log(`   ${SKILL_NAMES[skillNum]} | $${bountyNum / 1e6} | Agent: ${agent.name}`);
  
  try {
    // Bid
    resetNonce();
    const bidHash = await retry(async () => {
      return walletClient.writeContract({
        address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'bidOnTask',
        args: [BigInt(taskId), BigInt(agent.id)],
        nonce: await getNextNonce()
      });
    });
    await publicClient.waitForTransactionReceipt({ hash: bidHash });
    console.log(`   ✅ Bid placed`);
    
    await sleep(500);
    
    // Complete with AI
    console.log(`   🧠 Generating...`);
    const result = await completeWithAI(description, skillNum, agent.id, agent.name);
    if (!result.success) {
      console.log(`   ❌ AI error: ${result.error?.slice(0, 40)}`);
      return false;
    }
    console.log(`   ✅ Generated (${result.result?.length || 0} chars)`);
    
    await sleep(500);
    
    // Submit
    resetNonce();
    const resultHash = result.resultHash || `result-${taskId}-${Date.now()}`;
    const submitHash = await retry(async () => {
      return walletClient.writeContract({
        address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'submitResult',
        args: [BigInt(taskId), resultHash],
        nonce: await getNextNonce()
      });
    });
    await publicClient.waitForTransactionReceipt({ hash: submitHash });
    console.log(`   🎉 COMPLETED!`);
    
    return true;
  } catch (e) {
    console.log(`   ❌ Error: ${e.message?.slice(0, 50)}`);
    resetNonce();
    return false;
  }
}

async function scanAndComplete() {
  const nextId = await retry(() => publicClient.readContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'nextTaskId'
  }));
  
  console.log(`\n📋 Scanning tasks 1 to ${Number(nextId) - 1}...`);
  
  let completed = 0;
  let skipped = 0;
  
  // Scan from newest to oldest
  for (let i = Number(nextId) - 1; i >= 1; i--) {
    try {
      const task = await retry(() => publicClient.readContract({
        address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI,
        functionName: 'tasks', args: [BigInt(i)]
      }));
      
      if (task[6] === 0) { // status === Open
        const success = await processTask(i, task);
        if (success) {
          completed++;
          await sleep(2000); // Rate limit
        } else {
          skipped++;
        }
      }
      
      // Progress update every 100 tasks
      if (i % 100 === 0) {
        console.log(`   Scanned to #${i}, completed: ${completed}, skipped: ${skipped}`);
      }
      
    } catch (e) {
      // Task doesn't exist or error
    }
  }
  
  return { completed, skipped };
}

async function main() {
  console.log('🏛️  Colosseum Task Completer');
  console.log('============================');
  console.log('Mode: COMPLETE ONLY (no posting)\n');
  
  await loadAgents();
  
  let totalCompleted = 0;
  let round = 1;
  
  while (true) {
    console.log(`\n=== Round ${round} ===`);
    const { completed, skipped } = await scanAndComplete();
    totalCompleted += completed;
    
    console.log(`\n📊 Round ${round} done: ${completed} completed, ${skipped} skipped`);
    console.log(`   Total completed: ${totalCompleted}`);
    
    if (completed === 0) {
      console.log('\n✅ No more open tasks! Waiting 30s...');
      await sleep(30000);
    } else {
      console.log('\n⏳ Brief pause before next round...');
      await sleep(5000);
    }
    
    round++;
  }
}

main().catch(console.error);
