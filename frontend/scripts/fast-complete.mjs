#!/usr/bin/env node
/**
 * Fast Task Completer with robust retry
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

const TASK_MARKET = '0xb8100467f23dfD0217DA147B047ac474de9cD9F4';
const AGENT_REGISTRY = '0xb8A4344c12ea5f25CeCf3e70594E572D202Af897';
const OPERATOR_KEY = '0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081';
const API_BASE = 'https://colosseum.locsafe.org';

const TASK_ABI = [
  { name: 'nextTaskId', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'tasks', type: 'function', inputs: [{ type: 'uint256' }], outputs: [
    { type: 'address' }, { type: 'string' }, { type: 'uint8' }, { type: 'uint256' },
    { type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }, { type: 'string' },
    { type: 'uint256' }, { type: 'uint256' }
  ], stateMutability: 'view' },
  { name: 'bidOnTask', type: 'function', inputs: [{ type: 'uint256' }, { type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'submitResult', type: 'function', inputs: [{ type: 'uint256' }, { type: 'string' }], outputs: [], stateMutability: 'nonpayable' }
];

const AGENT_ABI = [
  { name: 'nextAgentId', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'getAgent', type: 'function', inputs: [{ type: 'uint256' }], outputs: [
    { type: 'address' }, { type: 'address' }, { type: 'string' }, { type: 'string' },
    { type: 'uint8' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' },
    { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }
  ], stateMutability: 'view' }
];

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
const account = privateKeyToAccount(OPERATOR_KEY);
const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

let agents = new Map();
let nonce = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function retry(fn, attempts = 5, delay = 2000) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === attempts - 1) throw e;
      await sleep(delay * (i + 1));
    }
  }
}

async function loadAgents() {
  const next = await retry(() => pub.readContract({ address: AGENT_REGISTRY, abi: AGENT_ABI, functionName: 'nextAgentId' }));
  for (let i = 1; i < Number(next); i++) {
    try {
      const a = await retry(() => pub.readContract({ address: AGENT_REGISTRY, abi: AGENT_ABI, functionName: 'getAgent', args: [BigInt(i)] }));
      if (a[10]) { // active
        const skill = Number(a[4]);
        if (!agents.has(skill)) agents.set(skill, []);
        agents.get(skill).push({ id: i, name: a[2], price: Number(a[5]) });
      }
    } catch {}
  }
  console.log(`Loaded ${[...agents.values()].flat().length} agents`);
}

async function complete(taskId) {
  const task = await retry(() => pub.readContract({ address: TASK_MARKET, abi: TASK_ABI, functionName: 'tasks', args: [BigInt(taskId)] }));
  const [, desc, skill, bounty,,, status] = task;
  
  if (status !== 0) return 'not-open';
  
  const pool = agents.get(Number(skill)) || [];
  const agent = pool.find(a => a.price <= Number(bounty));
  if (!agent) return 'no-agent';
  
  // Bid
  if (nonce === null) nonce = await pub.getTransactionCount({ address: account.address });
  const bidTx = await retry(() => wallet.writeContract({
    address: TASK_MARKET, abi: TASK_ABI, functionName: 'bidOnTask',
    args: [BigInt(taskId), BigInt(agent.id)], nonce: nonce++
  }));
  await pub.waitForTransactionReceipt({ hash: bidTx });
  
  // AI
  const res = await fetch(`${API_BASE}/api/agent/complete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: desc, skillTag: Number(skill), agentId: agent.id, agentName: agent.name })
  }).then(r => r.json());
  
  if (!res.success) return 'ai-fail';
  
  // Submit
  const subTx = await retry(() => wallet.writeContract({
    address: TASK_MARKET, abi: TASK_ABI, functionName: 'submitResult',
    args: [BigInt(taskId), res.resultHash || `r${taskId}`], nonce: nonce++
  }));
  await pub.waitForTransactionReceipt({ hash: subTx });
  
  return `done:${agent.name}`;
}

async function main() {
  console.log('🏛️ TASK COMPLETER (COMPLETE ONLY)\n');
  await loadAgents();
  
  let done = 0, err = 0;
  
  while (true) {
    nonce = null;
    
    const nextId = await retry(() => pub.readContract({ address: TASK_MARKET, abi: TASK_ABI, functionName: 'nextTaskId' }));
    console.log(`\nTotal tasks: ${Number(nextId) - 1}`);
    
    // Find open tasks
    const open = [];
    for (let i = Number(nextId) - 1; i >= 1 && open.length < 30; i--) {
      try {
        const t = await pub.readContract({ address: TASK_MARKET, abi: TASK_ABI, functionName: 'tasks', args: [BigInt(i)] });
        if (t[6] === 0) open.push(i);
      } catch {}
    }
    
    console.log(`Open: ${open.length}`);
    
    if (open.length === 0) {
      console.log('Waiting 30s...');
      await sleep(30000);
      continue;
    }
    
    for (const id of open) {
      try {
        const r = await complete(id);
        if (r.startsWith('done')) {
          done++;
          console.log(`✅ #${id} ${r}`);
        } else {
          console.log(`⏭️ #${id} ${r}`);
        }
      } catch (e) {
        err++;
        nonce = null; // Reset on error
        console.log(`❌ #${id} ${e.message?.slice(0, 40)}`);
      }
      await sleep(1500);
    }
    
    console.log(`📊 Done: ${done}, Errors: ${err}`);
  }
}

main().catch(console.error);
