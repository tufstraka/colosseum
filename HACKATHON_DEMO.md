# Vaultstone Hackathon Demo Guide

## 🎯 What is Vaultstone?

**Vaultstone** is an NFT-based invoice platform for Polkadot Hub that enables:
- **NFT Invoices** - Each invoice is minted as an ERC-721 NFT
- **Payment Splits** - Automatically distribute payments to up to 10 recipients
- **Cross-Chain Payments** - Pay invoices from any Polkadot parachain via XCM

---

## 🚀 Live Demo URLs

| Resource | URL |
|----------|-----|
| **Frontend** | http://3.83.41.99 |
| **Contract (TestNet)** | `0xa73fb25e9222623893b4Be283F7e7837E5bbE3B2` |
| **Block Explorer** | https://blockscout-testnet.polkadot.io/address/0xa73fb25e9222623893b4Be283F7e7837E5bbE3B2 |
| **GitHub** | https://github.com/tufstraka/vaultstone |

---

## 📋 Demo Script (5-7 minutes)

### 1. Introduction (30 seconds)
> "Vaultstone is an NFT invoice platform built for Polkadot Hub. It solves three problems:
> 1. **Invoices are ephemeral** - Ours are permanent NFTs on-chain
> 2. **Payments are manual** - Ours auto-split to multiple recipients
> 3. **Crypto is siloed** - Ours accept payments from any Polkadot parachain via XCM"

### 2. Connect Wallet (30 seconds)
1. Go to http://3.83.41.99
2. Click **"Connect Wallet"**
3. Select MetaMask (or Talisman)
4. Approve the network switch to **Polkadot Hub TestNet**

> "We auto-detect wallets and switch you to the right network automatically."

### 3. Create an Invoice (2 minutes)
1. Navigate to **Dashboard** → **Create Invoice**
2. Fill in:
   - **Recipient**: `0x742d35Cc6634C0532925a3b844Bc9e7595f...` (any test address)
   - **Amount**: `0.1` PAS
   - **Due Date**: Tomorrow
3. Click **"Add Split"** to show payment splits:
   - Add 2 addresses with 5000 shares each (50/50 split)
4. Click **"Create Invoice"**
5. Confirm in MetaMask

> "Notice the shares must equal 10000 (100%). This invoice will automatically split payments 50/50 between two addresses."

### 4. View the Invoice NFT (1 minute)
1. After creation, go to **Dashboard** → **Invoices**
2. Click on your invoice
3. Show the invoice details:
   - Invoice ID (NFT token ID)
   - Status (Pending)
   - Payment splits
   - Shareable payment link

> "This invoice is now an NFT on Polkadot Hub. It can be traded, held as proof of payment, or used for accounting."

### 5. Pay the Invoice (1 minute)
1. Open the payment link in a new tab (or use `/pay/1`)
2. Show the **two payment options**:
   - **Same Chain** - Pay directly from Polkadot Hub
   - **Cross-Chain (XCM)** - Pay from another parachain

#### Same-Chain Payment:
1. Click **"Pay X.XX PAS"**
2. Confirm in MetaMask
3. Show success message

> "For same-chain payments, it's instant. The funds are automatically split according to the invoice rules."

### 6. Demo Cross-Chain Payment UI (1 minute)
1. Create another invoice
2. On the payment page, click **"Cross-Chain (XCM)"** tab
3. Show the parachain options:
   - Asset Hub (1000)
   - Acala (2000)
   - Moonbeam (2004)
   - Astar (2006)
   - Bifrost (2030)
   - Hydration (2034)
4. Select a parachain and show the confirmation dialog

> "With XCM, users can pay from any Polkadot parachain. The contract builds an XCM message that:
> 1. Withdraws assets from the source chain
> 2. Transfers them via the relay chain
> 3. Deposits them here on Polkadot Hub
> 4. Marks the invoice as paid"

### 7. Technical Highlights (1 minute)
Pull up the code/contract to show:

```solidity
// XCM Precompile Integration
IXcm public constant xcm = IXcm(0x00000000000000000000000000000000000a0000);

// Cross-chain payment initiation
function initiateCrossChainPayment(uint256 invoiceId, uint32 sourceParachain) external {
    bytes memory xcmMessage = _buildCrossChainPaymentRequest(...);
    xcm.send(destination, xcmMessage);
}
```

> "We use Polkadot Hub's native XCM precompile. This is the same infrastructure that powers all cross-chain transfers in the ecosystem."

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        POLKADOT HUB                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              VaultstoneInvoice Contract                  │    │
│  │  • ERC-721 NFT Invoices                                 │    │
│  │  • Payment Splits (up to 10 recipients)                 │    │
│  │  • XCM Precompile Integration                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    XCM Precompile                                │
│                    (0x...0a0000)                                 │
└──────────────────────────────┼──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Acala   │    │ Moonbeam │    │  Astar   │
        │  (2000)  │    │  (2004)  │    │  (2006)  │
        └──────────┘    └──────────┘    └──────────┘
```

---

## 💡 Key Technical Features

### 1. NFT Invoices (ERC-721)
- Each invoice is a unique NFT
- Contains: amount, recipient, due date, payment splits
- Can be transferred, traded, or held as proof

### 2. Payment Splits
- Up to 10 recipients per invoice
- Shares defined in basis points (10000 = 100%)
- Automatic distribution on payment
- Platform fee (1%) automatically deducted

### 3. XCM Cross-Chain Payments
- Uses Polkadot Hub's native XCM precompile
- Supports 6 parachains out of the box
- Builds XCM V4 messages for:
  - `WithdrawAsset`
  - `InitiateReserveWithdraw`
  - `BuyExecution`
  - `DepositReserveAsset`
  - `Transact`

### 4. Modern Tech Stack
- **Smart Contract**: Solidity 0.8.24, OpenZeppelin, Foundry
- **Frontend**: Next.js 15, React 19, wagmi v2, TailwindCSS
- **Wallet Support**: MetaMask, Talisman (via Talisman Connect SDK)

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- MetaMask or Talisman wallet
- PAS tokens from faucet (https://faucet.polkadot.io/)

### Add Polkadot Hub TestNet to MetaMask
| Field | Value |
|-------|-------|
| Network Name | Polkadot Hub TestNet |
| RPC URL | `https://eth-rpc-testnet.polkadot.io/` |
| Chain ID | `420420417` |
| Symbol | `PAS` |
| Explorer | `https://blockscout-testnet.polkadot.io/` |

### Run Locally
```bash
# Clone
git clone https://github.com/tufstraka/vaultstone
cd vaultstone

# Frontend
cd frontend
npm install
npm run dev

# Contract (optional)
cd ../contracts
forge build
forge test
```

---

## 🎯 Judging Criteria Alignment

### Innovation
- **First NFT invoice platform on Polkadot Hub**
- XCM cross-chain payment integration
- Automatic payment splits

### Technical Execution
- 24/24 contract tests passing
- Clean Solidity with OpenZeppelin standards
- Modern React/Next.js frontend

### User Experience
- One-click wallet connection
- Auto network switching
- Clear invoice creation flow
- Shareable payment links

### Polkadot Integration
- Built for Polkadot Hub TestNet
- Uses native XCM precompile
- Supports multiple parachains

---

## ❓ Anticipated Q&A

**Q: Why NFT invoices?**
> NFTs provide permanence, transferability, and proof of payment. Traditional invoices are just emails that get lost.

**Q: How do cross-chain payments work?**
> We use Polkadot's XCM (Cross-Consensus Messaging). When you pay from Moonbeam, for example, XCM withdraws your tokens, transfers them through the relay chain, and deposits them on Hub where the invoice lives.

**Q: What's the fee?**
> 1% platform fee, automatically deducted from payments.

**Q: Can invoices be traded?**
> Yes! They're ERC-721 NFTs. You could sell an invoice receivable or use it as collateral in DeFi.

**Q: What parachains are supported?**
> Asset Hub, Acala, Moonbeam, Astar, Bifrost, and Hydration. More can be added by admins.

---

## 📊 Contract Stats

- **Contract Size**: ~15KB bytecode
- **Gas (Create Invoice)**: ~480,000
- **Gas (Pay Invoice)**: ~580,000
- **Tests**: 24/24 passing
- **Audit**: Self-audited (hackathon)

---

## 🔮 Future Roadmap

1. **Invoice Templates** - Save and reuse common invoice formats
2. **Recurring Invoices** - Subscription-style payments
3. **ERC-20 Support** - Pay with stablecoins
4. **Invoice Disputes** - On-chain arbitration
5. **Mobile App** - Native iOS/Android
6. **Mainnet Deployment** - Polkadot Hub mainnet launch

---

## 📞 Contact

- **GitHub**: https://github.com/tufstraka/vaultstone
- **Demo**: http://3.83.41.99

---

**Good luck with the demo! 🚀**
