#!/bin/bash
# Register 20 diverse AI agents on AgentArena
export PATH="$HOME/.foundry/bin:$PATH"

RPC="https://eth-rpc-testnet.polkadot.io/"
KEY="0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081"
REGISTRY="0xb8A4344c12ea5f25CeCf3e70594E572D202Af897"

# registerAgent(string name, string desc, uint8 primarySkill, uint8[] skills, uint256 pricePerTask, string endpointHash)
# Skills: 0=Research, 1=Writing, 2=DataAnalysis, 3=CodeReview, 4=Translation, 5=Summarization, 6=Creative, 7=TechWriting, 8=SmartContractAudit, 9=MarketAnalysis

register() {
  local name="$1"
  local desc="$2"
  local skill="$3"
  local price="$4" # in USDC raw (6 decimals)
  local endpoint="$5"
  
  echo "Registering: $name (skill=$skill, price=$price)..."
  cast send "$REGISTRY" \
    "registerAgent(string,string,uint8,uint8[],uint256,string)" \
    "$name" "$desc" "$skill" "[$skill]" "$price" "$endpoint" \
    --rpc-url "$RPC" --private-key "$KEY" --json 2>&1 | python3 -c "import json,sys;d=json.load(sys.stdin);print(f'  tx: {d.get(\"transactionHash\",\"?\")[:16]}... status: {d.get(\"status\")}')" 2>/dev/null || echo "  sent"
  sleep 2
}

echo "=== Registering 20 AI Agents on AgentArena ==="
echo ""

# Research agents
register "Athena" "Deep research agent specializing in governance analysis, protocol reviews, and competitive intelligence. Methodical, evidence-based, always cites sources." 0 2000000 "QmAthenaResearchEndpoint"
register "Hermes" "Fast-turnaround research agent for breaking news analysis and real-time market events. Optimized for speed over depth." 0 1500000 "QmHermesResearchEndpoint"

# Writing agents  
register "Calliope" "Long-form content writer. Whitepapers, blog posts, technical documentation. Clean prose, no filler. Adapts tone to audience." 1 3000000 "QmCalliopeWritingEndpoint"
register "Hemingway" "Concise writer. Short, punchy copy. Marketing materials, tweets, announcement drafts. Every word earns its place." 1 1000000 "QmHemingwayWritingEndpoint"

# Data Analysis agents
register "Oracle" "Statistical analysis and data visualization agent. Ingests CSV, JSON, on-chain data. Correlation analysis, trend detection, anomaly flagging." 2 4000000 "QmOracleDataEndpoint"
register "Pythia" "On-chain data specialist. Tracks DeFi TVL, token flows, whale movements, governance participation rates across Polkadot ecosystem." 2 3500000 "QmPythiaDataEndpoint"

# Code Review agents
register "Sentinel" "Senior code reviewer. Focuses on logic errors, edge cases, gas optimization, and code clarity. Reviews Solidity, Rust, TypeScript." 3 5000000 "QmSentinelCodeEndpoint"
register "Linter" "Automated code quality agent. Style consistency, naming conventions, documentation coverage, test coverage analysis." 3 1500000 "QmLinterCodeEndpoint"

# Translation agents
register "Babel" "Multilingual translation agent. 47 language pairs. Technical documentation specialist. Preserves formatting and code blocks." 4 2000000 "QmBabelTranslateEndpoint"
register "Rosetta" "Localization agent. Goes beyond translation — adapts content for cultural context, regional idioms, and market-specific terminology." 4 2500000 "QmRosettaTranslateEndpoint"

# Summarization agents
register "TL;DR" "Ultra-fast summarization. Governance proposals in 5 bullets. Research papers in 3 sentences. Meeting notes in 30 seconds." 5 500000 "QmTldrSummaryEndpoint"
register "Digest" "Executive summary specialist. Converts complex technical content into decision-maker-friendly briefings with key metrics highlighted." 5 1000000 "QmDigestSummaryEndpoint"

# Creative agents
register "Muse" "Creative ideation agent. Naming, branding, taglines, narrative frameworks. Thinks laterally. Often surprising, never boring." 6 3000000 "QmMuseCreativeEndpoint"
register "Pixel" "Visual concept agent. Describes UI layouts, color palettes, design systems, and brand identities in precise detail." 6 2500000 "QmPixelCreativeEndpoint"

# Technical Writing agents
register "Scribe" "API documentation specialist. Generates OpenAPI specs, SDK guides, integration tutorials. Clear, structured, developer-friendly." 7 3500000 "QmScribeTechEndpoint"

# Smart Contract Audit agents
register "Aegis" "Smart contract security auditor. Reentrancy, access control, flash loan attacks, MEV vulnerabilities. Severity ratings with fix recommendations." 8 8000000 "QmAegisAuditEndpoint"
register "Warden" "Gas optimization and efficiency auditor. Finds storage layout improvements, redundant operations, and cheaper implementation patterns." 8 5000000 "QmWardenAuditEndpoint"

# Market Analysis agents
register "Argus" "DeFi market analyst. Tracks yield strategies, liquidity flows, protocol revenue, and token economic health across 50+ protocols." 9 4000000 "QmArgusMarketEndpoint"
register "Cassandra" "Predictive market analyst. Sentiment analysis, on-chain signals, governance voting patterns. Flags risks before they materialize." 9 5000000 "QmCassandraMarketEndpoint"
register "Mercury" "Real-time arbitrage and opportunity scanner. Cross-chain price discrepancies, new pool launches, governance proposal impacts on token prices." 9 3000000 "QmMercuryMarketEndpoint"

echo ""
echo "=== Done! Checking results ==="
cast call "$REGISTRY" "totalAgents()(uint256)" --rpc-url "$RPC"
cast call "$REGISTRY" "totalActiveAgents()(uint256)" --rpc-url "$RPC"
