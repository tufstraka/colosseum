#!/usr/bin/env node
/**
 * Bulk Task Creator & Worker
 * Posts tasks and processes them automatically until task #204
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
const MOCK_USDC_ADDRESS = '0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f';
const OPERATOR_KEY = '0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081';
const API_BASE = 'https://colosseum.locsafe.org';
const TARGET_TASK_ID = 204;

const TASK_MARKET_ABI = [
  { name: 'nextTaskId', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'tasks', type: 'function', inputs: [{ type: 'uint256' }], outputs: [
    { type: 'address' }, { type: 'string' }, { type: 'uint8' }, { type: 'uint256' },
    { type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }, { type: 'string' },
    { type: 'uint256' }, { type: 'uint256' }
  ], stateMutability: 'view' },
  { name: 'postTask', type: 'function', inputs: [{ type: 'string' }, { type: 'uint8' }, { type: 'uint256' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
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

const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'allowance', type: 'function', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }
];

const SKILL_NAMES = ['Research', 'Writing', 'Data Analysis', 'Code Review', 'Translation', 'Summarization', 'Creative', 'Technical Writing', 'SC Audit', 'Market Analysis'];

// Task templates by skill
const TASK_TEMPLATES = {
  0: [ // Research
    "Research the history and evolution of {topic}",
    "Analyze the current state of {topic} and its future prospects",
    "Investigate the key players and stakeholders in {topic}",
    "Examine the technological foundations of {topic}",
    "Study the economic impact of {topic} on global markets"
  ],
  1: [ // Writing
    "Write a comprehensive guide to {topic}",
    "Create an engaging blog post about {topic}",
    "Compose a professional whitepaper on {topic}",
    "Draft an executive summary about {topic}",
    "Write a compelling narrative explaining {topic}"
  ],
  2: [ // Data Analysis
    "Analyze trends and patterns in {topic}",
    "Create a statistical breakdown of {topic}",
    "Identify key metrics and KPIs for {topic}",
    "Perform a comparative analysis of {topic}",
    "Generate insights from {topic} data"
  ],
  3: [ // Code Review
    "Review best practices for implementing {topic}",
    "Analyze security considerations in {topic} code",
    "Evaluate performance optimizations for {topic}",
    "Assess code quality patterns in {topic} projects",
    "Document technical debt related to {topic}"
  ],
  4: [ // Translation
    "Translate technical documentation about {topic}",
    "Localize marketing content for {topic}",
    "Adapt {topic} terminology for international audiences",
    "Create multilingual glossary for {topic}",
    "Translate user guides for {topic}"
  ],
  5: [ // Summarization
    "Summarize key points about {topic}",
    "Create an executive brief on {topic}",
    "Distill complex {topic} concepts into simple terms",
    "Provide a TL;DR overview of {topic}",
    "Extract main takeaways from {topic} research"
  ],
  6: [ // Creative
    "Generate creative concepts for {topic} branding",
    "Develop innovative ideas for {topic} marketing",
    "Create unique naming options for {topic} products",
    "Design creative campaigns around {topic}",
    "Brainstorm viral content ideas for {topic}"
  ],
  7: [ // Technical Writing
    "Write API documentation for {topic}",
    "Create developer guides for {topic}",
    "Document system architecture for {topic}",
    "Write technical specifications for {topic}",
    "Develop troubleshooting guides for {topic}"
  ],
  8: [ // Smart Contract Audit
    "Audit security patterns in {topic} contracts",
    "Review access control in {topic} smart contracts",
    "Analyze gas optimization for {topic} protocols",
    "Evaluate upgrade mechanisms in {topic} contracts",
    "Assess reentrancy protections in {topic}"
  ],
  9: [ // Market Analysis
    "Analyze market dynamics of {topic}",
    "Evaluate competitive landscape in {topic}",
    "Assess investment potential of {topic}",
    "Study market trends affecting {topic}",
    "Forecast growth projections for {topic}"
  ]
};

const TOPICS = [
  "blockchain scalability", "DeFi lending protocols", "NFT marketplaces", "Layer 2 solutions",
  "cross-chain bridges", "DAO governance", "tokenomics design", "yield farming strategies",
  "MEV protection", "decentralized identity", "zero-knowledge proofs", "rollup technology",
  "liquidity mining", "stablecoin mechanisms", "oracle networks", "smart contract security",
  "Web3 infrastructure", "blockchain interoperability", "consensus mechanisms", "gas optimization",
  "token vesting", "DEX aggregators", "perpetual futures", "prediction markets",
  "social tokens", "play-to-earn gaming", "metaverse economics", "blockchain privacy",
  "validator economics", "restaking protocols", "account abstraction", "intent-based trading",
  "Polkadot parachains", "substrate development", "EVM compatibility", "proof of stake",
  "liquid staking", "real-world assets", "blockchain oracles", "automated market makers"
];

const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
const account = privateKeyToAccount(OPERATOR_KEY);
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

let currentNonce = null;
let agentCache = new Map(); // skill -> agents[]

async function getNextNonce() {
  if (currentNonce === null) {
    currentNonce = await publicClient.getTransactionCount({ address: account.address });
  }
  return currentNonce++;
}

function resetNonce() { currentNonce = null; }

function getRandomTask() {
  const skillTag = Math.floor(Math.random() * 10);
  const templates = TASK_TEMPLATES[skillTag];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const description = template.replace('{topic}', topic);
  const bounty = (Math.floor(Math.random() * 10) + 1) * 1000000; // $1-10 USDC
  return { description, skillTag, bounty };
}

async function ensureAllowance() {
  const allowance = await publicClient.readContract({
    address: MOCK_USDC_ADDRESS, abi: ERC20_ABI, functionName: 'allowance',
    args: [account.address, TASK_MARKET_ADDRESS]
  });
  
  if (allowance < parseUnits('10000', 6)) {
    console.log('📝 Approving USDC...');
    const hash = await walletClient.writeContract({
      address: MOCK_USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve',
      args: [TASK_MARKET_ADDRESS, parseUnits('1000000', 6)],
      nonce: await getNextNonce()
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ USDC approved');
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
    console.log(`   ${SKILL_NAMES[skill]}: ${agents.length} agents`);
    total += agents.length;
  }
  console.log(`✅ Loaded ${total} active agents\n`);
}

function findBestAgent(skillTag, bounty) {
  const agents = agentCache.get(skillTag) || [];
  if (!agents.length) return null;
  
  // Filter by price and sort by reputation + tasks
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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function retry(fn, retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`   ⏳ Retry ${i + 1}/${retries}...`);
      await sleep(delay * (i + 1));
    }
  }
}

async function postAndProcessTask() {
  const { description, skillTag, bounty } = getRandomTask();
  const deadline = Math.floor(Date.now() / 1000) + 86400; // 24h
  
  // Find agent first
  const agent = findBestAgent(skillTag, bounty);
  if (!agent) {
    console.log(`⏭️  Skipping ${SKILL_NAMES[skillTag]} - no eligible agents`);
    return null;
  }
  
  console.log(`\n📤 Task: "${description.slice(0, 45)}..." (${SKILL_NAMES[skillTag]}, $${bounty/1e6})`);
  console.log(`   🤖 Agent: ${agent.name} (#${agent.id})`);
  
  // Post task with retry
  const postHash = await retry(async () => {
    return walletClient.writeContract({
      address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'postTask',
      args: [description, skillTag, BigInt(bounty), BigInt(deadline)],
      nonce: await getNextNonce()
    });
  });
  await publicClient.waitForTransactionReceipt({ hash: postHash });
  
  await sleep(1000);
  
  const nextId = await retry(() => publicClient.readContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'nextTaskId'
  }));
  const taskId = Number(nextId) - 1;
  console.log(`   ✅ Posted #${taskId}`);
  
  await sleep(1000);
  
  // Bid with retry
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
  
  await sleep(1000);
  
  // Complete with AI
  console.log(`   🧠 Generating...`);
  const result = await completeWithAI(description, skillTag, agent.id, agent.name);
  if (!result.success) {
    console.log(`   ❌ AI error: ${result.error?.slice(0, 50)}`);
    return taskId;
  }
  console.log(`   ✅ Generated (${result.result?.length || 0} chars)`);
  
  await sleep(1000);
  
  // Submit with retry
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
  console.log(`   🎉 Task #${taskId} COMPLETED!`);
  
  return taskId;
}

async function main() {
  console.log('🏛️  Colosseum Bulk Task Creator');
  console.log('================================');
  console.log(`Operator: ${account.address}`);
  console.log(`Target: Task #${TARGET_TASK_ID}\n`);
  
  await ensureAllowance();
  await loadAgents();
  
  let nextId = await publicClient.readContract({
    address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'nextTaskId'
  });
  
  console.log(`Current: Task #${Number(nextId) - 1}`);
  console.log(`Tasks to create: ${TARGET_TASK_ID - Number(nextId) + 1}`);
  
  let completed = 0;
  let errors = 0;
  
  while (Number(nextId) <= TARGET_TASK_ID) {
    try {
      resetNonce();
      const taskId = await postAndProcessTask();
      if (taskId) completed++;
      
      nextId = await publicClient.readContract({
        address: TASK_MARKET_ADDRESS, abi: TASK_MARKET_ABI, functionName: 'nextTaskId'
      });
      
      // Small delay
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (e) {
      console.log(`❌ Error: ${e.message?.slice(0, 60)}`);
      errors++;
      resetNonce();
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n================================');
  console.log(`🎉 DONE! Completed ${completed} tasks (${errors} errors)`);
  console.log(`Final task ID: #${Number(nextId) - 1}`);
}

main().catch(console.error);
