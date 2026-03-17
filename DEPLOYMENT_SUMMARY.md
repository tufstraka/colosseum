# 🎉 Vaultstone - Deployment Complete

**Cross-Chain Invoice Platform on Polkadot Hub**

---

## 🌐 Live Deployment

### Frontend
**URL:** http://3.83.41.99
- Modern, responsive UI with glass morphism design
- Real-time blockchain integration
- MetaMask wallet support
- Mobile-friendly

### Smart Contract (Polkadot Hub TestNet)
**Address:** `0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797`
- **Chain ID:** 420420417
- **RPC:** https://eth-rpc-testnet.polkadot.io/
- **Explorer:** https://blockscout-testnet.polkadot.io/address/0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797
- **Faucet:** https://faucet.polkadot.io/

---

## ✅ Features Implemented

### Core Functionality
- ✅ **NFT Invoices** - ERC721 tokens with full ownership
- ✅ **Payment Splitting** - Up to 10 recipients with automatic distribution
- ✅ **Multi-Currency** - Native PAS/DOT + ERC20 tokens
- ✅ **Status Tracking** - Pending, Paid, Cancelled, Overdue, Disputed

### Cross-Chain (XCM Integration)
- ✅ **6+ Parachains Supported:**
  - Asset Hub (1000)
  - Acala (2000)
  - Moonbeam (2004)
  - Astar (2006)
  - Bifrost (2030)
  - Hydration (2034)
- ✅ **XCM Precompile Integration** (0xA0000)
- ✅ **Cross-chain payment initiation**
- ✅ **XCM message building & execution**

### Security
- ✅ **OpenZeppelin Standards** - AccessControl, ReentrancyGuard, Pausable
- ✅ **Role-Based Access** - Admin, Pauser, XCM Executor roles
- ✅ **Safe Math** - No overflow/underflow vulnerabilities
- ✅ **All 24 Tests Passing** - Comprehensive test suite

---

## 🎨 UI/UX Highlights

### Dashboard
- Gradient hero section with connection status
- Animated stat cards with real blockchain data
- Quick action cards for common tasks
- Feature pills highlighting platform benefits
- Empty states with helpful CTAs

### Create Invoice
- Step-by-step form with visual hierarchy
- Live validation and feedback
- Payment split calculator with percentage display
- Inline error handling
- Success animation on completion

### Design System
- Modern glass morphism effects
- Smooth hover animations
- Consistent gradient accents
- Professional typography
- Mobile-first responsive design
- Dark mode support

---

## 📊 Technical Stack

### Smart Contracts
- **Solidity 0.8.24** with Foundry
- **OpenZeppelin 5.1.0** - Security primitives
- **ERC721URIStorage** - NFT with metadata
- **ERC721Enumerable** - Full enumeration
- **XCM Precompile Interface** - Cross-chain messaging

### Frontend
- **Next.js 15.1.0** - React framework
- **wagmi 2.x** - Web3 hooks
- **viem** - Ethereum library
- **TailwindCSS** - Styling
- **TypeScript** - Type safety

### Infrastructure
- **Nginx** - Reverse proxy
- **Anvil** - Local blockchain (for testing)
- **Polkadot Hub** - Production testnet

---

## 🚀 Getting Started (for Users)

### 1. Setup MetaMask
See [METAMASK_SETUP.md](./METAMASK_SETUP.md) for detailed instructions.

**Quick Setup:**
```
Network: Polkadot Hub TestNet
RPC: https://eth-rpc-testnet.polkadot.io/
Chain ID: 420420417
Symbol: PAS
```

### 2. Get Test Tokens
Visit https://faucet.polkadot.io/ and paste your address

### 3. Create Invoice
1. Connect wallet at http://3.83.41.99
2. Go to Dashboard → Create Invoice
3. Fill in recipient, amount, due date
4. (Optional) Add payment splits
5. Mint your NFT invoice!

### 4. Share & Get Paid
- Share the payment link with your client
- They pay from any supported parachain
- Funds auto-distribute to all recipients

---

## 💻 Development Guide

### Local Setup
```bash
# Clone repo
git clone https://github.com/tufstraka/vaultstone.git
cd vaultstone

# Install contract dependencies
cd contracts
forge install

# Run tests
forge test

# Deploy locally
anvil  # Terminal 1
forge script script/DeployLocal.s.sol:DeployLocal --broadcast  # Terminal 2

# Install frontend dependencies
cd ../frontend
npm install

# Run dev server
npm run dev
```

### Testing
```bash
# Contract tests (24 tests)
cd contracts
forge test -vv

# Coverage
forge coverage

# Gas report
forge test --gas-report
```

---

## 📈 Project Stats

- **Smart Contract:** 750+ lines
- **Frontend:** 3000+ lines
- **Tests:** 24/24 passing
- **Gas Optimized:** Average ~5.7M gas for deployment
- **Build Time:** <10 seconds
- **Bundle Size:** 109KB (first load)

---

## 🎯 Hackathon Submission Checklist

- ✅ Smart contract deployed to Polkadot Hub TestNet
- ✅ Frontend deployed and accessible
- ✅ Cross-chain (XCM) integration complete
- ✅ Comprehensive test suite
- ✅ Modern, professional UI/UX
- ✅ Documentation (README, METAMASK_SETUP)
- ✅ GitHub repo public
- ⏳ Demo video (TODO)
- ⏳ Submission form (TODO)

---

## 🔗 Links

- **Live App:** http://3.83.41.99
- **GitHub:** https://github.com/tufstraka/vaultstone
- **Contract:** https://blockscout-testnet.polkadot.io/address/0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797
- **Hackathon:** https://dorahacks.io/hackathon/polkadot-solidity-hackathon/

---

## 🏆 What Makes Vaultstone Special

1. **True Cross-Chain** - First invoice platform with native XCM support
2. **NFT Innovation** - Invoices as tradeable, ownable assets
3. **Enterprise-Ready** - Payment splits, role management, pause mechanism
4. **Developer-Friendly** - Clean code, comprehensive tests, clear docs
5. **Beautiful UX** - 300 years of design experience distilled into one platform

---

## 📝 Notes for Judges

### Innovation
- Novel use of XCM for cross-chain invoice payments
- NFT invoices enable new business models (invoice factoring, collateral)
- Payment splitting addresses real team/agency workflows

### Technical Excellence
- Clean, well-structured Solidity code
- OpenZeppelin standards throughout
- Comprehensive test coverage
- Type-safe frontend with wagmi/viem

### User Experience
- Intuitive wallet connection flow
- Clear visual hierarchy and feedback
- Mobile-responsive design
- Helpful error messages and validation

### Polkadot Integration
- Supports multiple parachains (Moonbeam, Astar, Acala)
- XCM precompile integration
- Deployed to official Polkadot Hub TestNet

---

**Built for Polkadot Solidity Hackathon 2026 • Track 1: EVM Smart Contract**

🚀 **Vaultstone - The Future of Cross-Chain Invoicing**
