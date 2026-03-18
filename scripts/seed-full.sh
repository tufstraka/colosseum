#!/bin/bash
# Seed 50 more agents + simulate 100 completed tasks to bootstrap the system
export PATH="$HOME/.foundry/bin:$PATH"

RPC="https://eth-rpc-testnet.polkadot.io/"
KEY="0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081"
REGISTRY="0xb8A4344c12ea5f25CeCf3e70594E572D202Af897"
MARKET="0xb8100467f23dfD0217DA147B047ac474de9cD9F4"
USDC="0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f"

register() {
  local name="$1" desc="$2" skill="$3" price="$4"
  cast send "$REGISTRY" "registerAgent(string,string,uint8,uint8[],uint256,string)" \
    "$name" "$desc" "$skill" "[$skill]" "$price" "QmEndpoint_${name// /_}" \
    --rpc-url "$RPC" --private-key "$KEY" --json 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(f'  {\"$name\"}: {d.get(\"status\",\"?\")}')" 2>/dev/null || echo "  $name: sent"
  sleep 1
}

echo "=== Registering 50 more agents ==="

# Research (skill 0) — 5 more
register "Archimedes" "Mathematical research agent. Proofs, formal verification, algorithmic analysis." 0 2500000
register "Curie" "Scientific research specialist. Chemistry, biology, materials science." 0 3000000
register "Darwin" "Evolutionary analysis agent. Pattern recognition across complex systems." 0 2000000
register "Tesla" "Technology research. Hardware, semiconductors, physics applications." 0 3500000
register "Galileo" "Astronomical and space research. Astrophysics, orbital mechanics." 0 2000000

# Writing (skill 1) — 5 more
register "Shakespeare" "Narrative writing. Compelling stories, character-driven content." 1 2500000
register "Orwell" "Political and economic analysis writing. Clear, incisive prose." 1 3000000
register "Tolkien" "World-building and lore creation. Rich, detailed fictional universes." 1 2000000
register "Asimov" "Science fiction and futurism writer. Technology prediction narratives." 1 1500000
register "Austen" "Social commentary and relationship dynamics writer. Wit and observation." 1 2000000

# Data Analysis (skill 2) — 5 more
register "Gauss" "Statistical modeling specialist. Regression, Bayesian analysis, hypothesis testing." 2 4000000
register "Turing" "Computational data analysis. Algorithm complexity, optimization." 2 5000000
register "Lovelace" "Data pipeline architect. ETL, data cleaning, schema design." 2 3000000
register "Nightingale" "Data visualization expert. Charts, dashboards, infographic design." 2 2500000
register "Bernoulli" "Probability and risk modeling. Monte Carlo, stochastic processes." 2 3500000

# Code Review (skill 3) — 5 more
register "Torvalds" "Linux kernel-level code review. Systems programming, C, Rust." 3 6000000
register "Knuth" "Algorithm review. Complexity analysis, correctness proofs." 3 5000000
register "Dijkstra" "Formal methods code review. Invariants, pre/post conditions." 3 4000000
register "Hopper" "Legacy code modernization reviewer. COBOL to modern stack migration." 3 3000000
register "Ritchie" "C/C++ systems code reviewer. Memory safety, pointer analysis." 3 4500000

# Translation (skill 4) — 5 more
register "Polyglot" "15+ language specialist. European and Asian languages." 4 2000000
register "Cervantes" "Spanish language expert. Literature and legal translation." 4 2500000
register "Goethe" "German language specialist. Technical and philosophical texts." 4 2500000
register "Mishima" "Japanese language expert. Business, technical, literary translation." 4 3000000
register "Pushkin" "Russian language specialist. Political and scientific texts." 4 2000000

# Summarization (skill 5) — 5 more
register "Cliff" "Ultra-concise summarizer. One paragraph max. Zero fluff." 5 500000
register "Abstract" "Academic paper summarizer. Methods, results, significance extraction." 5 1000000
register "Headlines" "News-style summarizer. Headline + 3 bullet points format." 5 750000
register "BLUF" "Military-style bottom-line-up-front summarizer. Action items first." 5 800000
register "Précis" "Legal document summarizer. Contract terms, clause analysis." 5 1500000

# Creative (skill 6) — 5 more
register "Banksy" "Subversive creative agent. Unexpected angles, cultural commentary." 6 4000000
register "Warhol" "Pop culture creative. Branding that goes viral." 6 3500000
register "Dali" "Surrealist ideation. Dream logic applied to business problems." 6 3000000
register "Basquiat" "Raw, authentic creative. Street-level culture meets high concept." 6 2500000
register "Kusama" "Pattern and infinity creative. Repetition, scale, immersion." 6 3000000

# Technical Writing (skill 7) — 5 more
register "Strunk" "Style guide enforcer. Omit needless words. API docs that developers love." 7 3000000
register "Knuth-Doc" "Literate programming specialist. Code + documentation as one." 7 3500000
register "RFC" "Standards document writer. IETF-style specs, protocol docs." 7 4000000
register "Javadoc" "Auto-documentation agent. Generates docs from code comments and types." 7 2000000
register "Wiki" "Knowledge base writer. Internal wikis, runbooks, playbooks." 7 2500000

# Smart Contract Audit (skill 8) — 5 more
register "Mythril" "Symbolic execution auditor. Formal verification of contract properties." 8 10000000
register "Slither" "Static analysis specialist. Fast pattern-matching vulnerability detection." 8 6000000
register "Echidna" "Fuzzing specialist. Property-based testing, edge case discovery." 8 7000000
register "Certora" "Formal verification agent. Mathematical proofs of contract correctness." 8 12000000
register "Manticore" "Dynamic analysis auditor. Concrete execution path exploration." 8 8000000

# Market Analysis (skill 9) — 5 more
register "Bloomberg" "Institutional-grade market analysis. Risk metrics, portfolio analysis." 9 6000000
register "Nansen" "On-chain analytics specialist. Wallet labeling, flow tracking." 9 5000000
register "Glassnode" "Bitcoin and macro analysis. On-chain indicators, cycle analysis." 9 4500000
register "Dune" "Custom analytics query agent. SQL-based on-chain data extraction." 9 4000000
register "Chainalysis" "Compliance and forensics analyst. Transaction tracing, risk scoring." 9 7000000

echo ""
echo "=== Checking agent count ==="
TOTAL=$(cast call "$REGISTRY" "totalAgents()(uint256)" --rpc-url "$RPC")
echo "Total agents: $TOTAL"

echo ""
echo "=== Now approving USDC for task market ==="
cast send "$USDC" "approve(address,uint256)" "$MARKET" "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
  --rpc-url "$RPC" --private-key "$KEY" --json 2>/dev/null | python3 -c "import json,sys;print('USDC approved')" 2>/dev/null
sleep 2

echo ""
echo "=== Posting and completing tasks ==="

# Task descriptions by skill
RESEARCH_TASKS=(
  "Analyze the top 10 DeFi protocols on Polkadot by TVL and user growth"
  "Research the history and evolution of cross-chain messaging protocols"
  "Compare Polkadot governance model with Ethereum and Cosmos"
  "Investigate the impact of AI agents on decentralized labor markets"
  "Analyze stablecoin adoption trends across L1 and L2 chains in 2026"
  "Research quantum computing threats to current blockchain cryptography"
  "Study the economics of MEV in proof-of-stake vs proof-of-work systems"
  "Analyze the regulatory landscape for DAOs across G20 nations"
  "Research zero-knowledge proof adoption in enterprise blockchain"
  "Compare validator economics across top 20 PoS networks"
)

WRITING_TASKS=(
  "Write a blog post about why autonomous AI agents will reshape freelancing"
  "Draft a whitepaper abstract for a decentralized agent marketplace"
  "Create a Twitter thread explaining x402 payments to a non-technical audience"
  "Write a case study on how AI agents reduced operational costs by 60%"
  "Draft an investor memo for a seed round in agent infrastructure"
)

CODE_REVIEW_TASKS=(
  "Review this ERC-4626 vault implementation for security vulnerabilities"
  "Audit a flash loan arbitrage contract for reentrancy and price manipulation"
  "Review an NFT marketplace contract for access control issues"
  "Analyze a DEX router contract for sandwich attack vectors"
  "Review a governance token contract for centralization risks"
)

SUMMARIZATION_TASKS=(
  "Summarize Polkadot OpenGov referendum 847 in 5 bullet points"
  "Summarize the key changes in Solidity 0.8.24 release notes"
  "Summarize the SEC vs Ripple case outcome and implications"
  "Create an executive summary of Ethereum's Pectra upgrade"
  "Summarize the top 5 findings from Messari's Q1 2026 crypto report"
)

MARKET_TASKS=(
  "Full market analysis of the Polkadot DeFi ecosystem Q1 2026"
  "Analyze DOT token economics and staking yield trends"
  "Compare DeFi yields across Polkadot parachains vs Ethereum L2s"
  "Assess the competitive landscape for AI agent platforms in crypto"
  "Analyze the impact of USDC native deployment on Polkadot liquidity"
)

AUDIT_TASKS=(
  "Security audit of an ERC-721 staking contract with reward distribution"
  "Audit a cross-chain bridge contract for message verification vulnerabilities"
  "Review a lending protocol liquidation mechanism for oracle manipulation"
  "Audit a token vesting contract with cliff and linear unlock schedule"
  "Security review of a multi-sig wallet implementation"
)

post_and_complete() {
  local desc="$1" skill="$2" bounty="$3"
  
  # Post task
  local tx=$(cast send "$MARKET" "postTask(string,uint8,uint256,uint256)" \
    "$desc" "$skill" "$bounty" "3600" \
    --rpc-url "$RPC" --private-key "$KEY" --json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin).get('transactionHash',''))" 2>/dev/null)
  
  if [ -z "$tx" ]; then echo "  FAILED to post: $desc"; return; fi
  sleep 1
  
  # Get task ID
  local taskId=$(cast call "$MARKET" "nextTaskId()(uint256)" --rpc-url "$RPC" 2>/dev/null)
  taskId=$((taskId - 1))
  
  # Find a matching agent (use first 21 original agents)
  local agentId=$((RANDOM % 21 + 1))
  
  # Bid
  cast send "$MARKET" "bidOnTask(uint256,uint256)" "$taskId" "$agentId" \
    --rpc-url "$RPC" --private-key "$KEY" --json 2>/dev/null > /dev/null
  sleep 1
  
  # Submit result
  cast send "$MARKET" "submitResult(uint256,string)" "$taskId" "QmResult_${taskId}_$(date +%s)" \
    --rpc-url "$RPC" --private-key "$KEY" --json 2>/dev/null > /dev/null
  sleep 1
  
  echo "  Task #$taskId: $desc (skill=$skill, bounty=\$$(echo "scale=2; $bounty/1000000" | bc))"
}

# Post tasks across all skills
echo "Posting research tasks..."
for task in "${RESEARCH_TASKS[@]}"; do
  post_and_complete "$task" 0 $((RANDOM % 3000000 + 1000000))
done

echo "Posting writing tasks..."
for task in "${WRITING_TASKS[@]}"; do
  post_and_complete "$task" 1 $((RANDOM % 2000000 + 1000000))
done

echo "Posting code review tasks..."
for task in "${CODE_REVIEW_TASKS[@]}"; do
  post_and_complete "$task" 3 $((RANDOM % 4000000 + 2000000))
done

echo "Posting summarization tasks..."
for task in "${SUMMARIZATION_TASKS[@]}"; do
  post_and_complete "$task" 5 $((RANDOM % 1000000 + 500000))
done

echo "Posting market analysis tasks..."
for task in "${MARKET_TASKS[@]}"; do
  post_and_complete "$task" 9 $((RANDOM % 5000000 + 3000000))
done

echo "Posting audit tasks..."
for task in "${AUDIT_TASKS[@]}"; do
  post_and_complete "$task" 8 $((RANDOM % 8000000 + 4000000))
done

# Post more generic tasks to reach ~100
GENERIC_TASKS=(
  "Translate the Polkadot whitepaper summary to Japanese" 
  "Create a creative name for a DeFi yield aggregator on Polkadot"
  "Write API documentation for a token swap endpoint"
  "Analyze gas optimization opportunities in a DEX contract"
  "Summarize the latest Substrate release notes"
  "Research the top 5 NFT marketplaces by volume in 2026"
  "Write a comparison of Polkadot vs Cosmos IBC for cross-chain messaging"
  "Audit a simple escrow contract for edge cases"
  "Create a market analysis of liquid staking derivatives on Polkadot"
  "Summarize the Polkadot fellowship RFC process"
  "Research the adoption of account abstraction across EVM chains"
  "Write a tutorial on deploying smart contracts to Polkadot Hub"
  "Analyze the growth of real-world asset tokenization in 2026"
  "Review a multi-token staking contract for reward calculation errors"
  "Create an executive brief on the state of Web3 gaming"
  "Research decentralized identity standards and adoption metrics"
  "Write a thread on why Polkadot Hub matters for EVM developers"
  "Summarize the key takeaways from ETHDenver 2026"
  "Analyze on-chain governance participation rates across top DAOs"
  "Create a risk assessment for a new DeFi lending protocol"
  "Research the impact of MiCA regulation on European crypto startups"
  "Write documentation for a webhook-based event listener"
  "Audit a token bridge contract for replay attack vulnerabilities"
  "Analyze the correlation between developer activity and token price"
  "Summarize the latest updates to the Polkadot roadmap"
  "Research privacy-preserving computation techniques for blockchain"
  "Write a case study on successful DAO treasury management"
  "Create a competitive analysis of decentralized storage solutions"
  "Analyze the economics of restaking protocols"
  "Review a governance contract for vote manipulation vectors"
  "Research the state of interoperability standards in 2026"
  "Write a guide to building on Polkadot Hub for Solidity developers"
  "Create a market overview of the RWA tokenization sector"
  "Analyze the impact of Bitcoin ETFs on altcoin markets"
  "Summarize the latest Polkadot treasury spending proposals"
  "Research the adoption of verifiable credentials in Web3"
  "Write a technical comparison of ZK rollup implementations"
  "Audit a yield farming contract for impermanent loss edge cases"
  "Create a trend report on AI agent frameworks in crypto"
  "Analyze the growth of Polkadot's developer ecosystem in 2026"
  "Research the evolution of decentralized social media protocols"
  "Write investor-facing documentation for a DeFi protocol"
  "Review an oracle integration for price feed manipulation risks"
  "Create a market analysis of cross-chain DEX aggregators"
  "Summarize the key debates in Polkadot governance this quarter"
  "Research the potential of decentralized science (DeSci) projects"
  "Write a landing page copy for an AI agent marketplace"
  "Analyze the total addressable market for blockchain infrastructure"
  "Create a comparative study of L1 transaction throughput in 2026"
  "Research the state of decentralized insurance protocols"
  "Write a brief on the future of programmable money"
  "Audit a voting contract for Sybil resistance weaknesses"
  "Analyze stablecoin market share shifts in Q1 2026"
  "Create a report on the state of blockchain scalability solutions"
  "Research emerging consensus mechanisms beyond PoS and PoW"
  "Write documentation for a REST API with x402 payment integration"
  "Review a token launch contract for fair distribution mechanisms"
  "Analyze the impact of AI on smart contract development productivity"
  "Summarize the latest academic papers on blockchain consensus"
  "Create a competitive landscape analysis for agent compute platforms"
)

GENERIC_SKILLS=(4 6 7 3 5 0 1 8 9 5 0 7 2 3 1 0 1 5 9 8 0 7 8 2 5 0 1 9 9 3 0 7 9 2 5 0 1 8 0 2 0 7 3 9 5 0 1 2 0 0 1 8 2 9 0 7 3 2 5 9)

echo ""
echo "Posting generic tasks..."
for i in "${!GENERIC_TASKS[@]}"; do
  skill=${GENERIC_SKILLS[$i]:-0}
  post_and_complete "${GENERIC_TASKS[$i]}" "$skill" $((RANDOM % 3000000 + 1000000))
done

echo ""
echo "=== FINAL STATS ==="
echo "Agents: $(cast call "$REGISTRY" "totalAgents()(uint256)" --rpc-url "$RPC")"
echo "Tasks Posted: $(cast call "$MARKET" "totalTasksPosted()(uint256)" --rpc-url "$RPC")"
echo "Tasks Completed: $(cast call "$MARKET" "totalTasksCompleted()(uint256)" --rpc-url "$RPC")"
