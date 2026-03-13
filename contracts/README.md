# Vaultstone Contracts

Smart contracts for the Vaultstone Invoice System - a cross-chain invoice platform on Polkadot Hub.

## Overview

Vaultstone allows users to create invoices as NFTs and receive payments in native tokens or ERC20 tokens. The system supports payment splitting for revenue distribution.

## Contracts

- **VaultstoneInvoice.sol** - Main contract implementing ERC721 invoices with payment functionality

## Features

- Create invoices as NFTs with metadata stored on IPFS
- Pay invoices in native tokens (DOT) or ERC20 tokens
- Payment splitting for multiple recipients
- Platform fee collection
- Invoice status tracking (Pending, Paid, Cancelled, Disputed)
- Role-based access control
- Pausable for emergencies

## OpenZeppelin Contracts Used

- ERC721URIStorage
- ERC721Enumerable
- AccessControl
- Pausable
- ReentrancyGuard
- SafeERC20

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Install Dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Test with Verbosity

```bash
forge test -vvv
```

### Deploy

1. Copy `.env.example` to `.env` and fill in values
2. Run deployment script:

```bash
source .env
forge script script/Deploy.s.sol:DeployVaultstone --rpc-url $POLKADOT_HUB_TESTNET_RPC_URL --broadcast --verify
```

## Environment Variables

```
PRIVATE_KEY=your_private_key
ADMIN_ADDRESS=admin_wallet_address
FEE_RECIPIENT_ADDRESS=fee_recipient_address
PLATFORM_FEE=100
POLKADOT_HUB_TESTNET_RPC_URL=https://...
```

## License

MIT
