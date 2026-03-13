# Vaultstone

Cross-Chain Invoice Platform for Polkadot Hub

## Overview

Vaultstone is a decentralized invoice management system that allows businesses, freelancers, and DAOs to create on-chain invoices as NFTs and receive payments from any Polkadot parachain via XCM.

## Features

- **NFT Invoices**: Every invoice is an ERC721 NFT you own
- **Cross-Chain Payments**: Accept payments from any Polkadot parachain via XCM
- **Payment Splitting**: Automatically split payments among multiple recipients
- **Multi-Currency**: Support for native DOT and ERC20 tokens
- **On-Chain Status**: Track invoice status (Pending, Paid, Cancelled, Disputed)

## Project Structure

```
vaultstone/
├── contracts/           # Solidity smart contracts (Foundry)
│   ├── src/            # Contract source files
│   ├── test/           # Contract tests
│   └── script/         # Deployment scripts
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities and contract ABIs
│   │   └── types/      # TypeScript types
│   └── public/         # Static assets
└── plans/              # Architecture documentation
```

## Tech Stack

### Smart Contracts
- Solidity 0.8.24
- Foundry (Forge, Cast, Anvil)
- OpenZeppelin Contracts

### Frontend
- Next.js 15
- TypeScript
- Tailwind CSS
- wagmi + viem
- React Query

## Getting Started

### Prerequisites

- Node.js 18+
- Foundry (for smart contracts)
- Git

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Build
forge build

# Test
forge test

# Deploy (update .env first)
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## OpenZeppelin Contracts Used

| Contract | Purpose |
|----------|---------|
| ERC721URIStorage | Invoice NFT with metadata |
| ERC721Enumerable | List user invoices |
| AccessControl | Role-based permissions |
| Pausable | Emergency stop |
| ReentrancyGuard | Security |
| SafeERC20 | Safe token transfers |

## Hackathon Tracks

This project is submitted to:
- **Track 1: EVM Smart Contract** - Stablecoin-enabled dApp
- **Track 3: Cross-chain Apps** - XCM for payments
- **OpenZeppelin Sponsor Track** - Heavy OZ usage

## License

MIT

## Team

Built for Polkadot Solidity Hackathon 2026
