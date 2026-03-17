# 🚨 MetaMask Blocking? Use Talisman Wallet Instead!

## Problem
MetaMask is blocking the invoice creation page due to the `address(0)` parameter, making the warning dialog un-clickable or difficult to bypass.

## Solution: Use Talisman Wallet ⭐

**According to official Polkadot documentation**, Talisman is the **recommended wallet** for Polkadot Hub. It:
- ✅ Supports both Substrate AND EVM accounts
- ✅ Built specifically for Polkadot ecosystem
- ✅ Better integration with Polkadot Hub
- ✅ Handles transactions more gracefully
- ✅ Won't block on technical parameter flags

---

## Setup Talisman (5 minutes)

### 1. Install Talisman
**Download:** https://talisman.xyz/download

Available for:
- Chrome/Brave
- Firefox
- Edge

### 2. Create/Import Wallet
- Click the Talisman icon in your browser
- Create new wallet OR import existing seed phrase
- Set a password
- **Save your seed phrase securely!**

### 3. Add Polkadot Hub TestNet
1. Click Talisman icon → Click "More" button
2. Click "Manage Networks"
3. Click "+ Add network"
4. Fill in these details:

```
Network Name: Polkadot Hub TestNet
RPC URL: https://eth-rpc-testnet.polkadot.io/
Chain ID: 420420417
Currency Symbol: PAS
Block Explorer: https://blockscout-testnet.polkadot.io/
```

5. Click "Save"
6. Select "Polkadot Hub TestNet" from the network list

### 4. Get Test Tokens
- Visit: https://faucet.polkadot.io/
- Paste your Talisman Ethereum address (starts with 0x...)
- Click "Get Some PASs"
- Wait 10-30 seconds for tokens

### 5. Use Vaultstone
- Go to http://3.83.41.99
- Click "Connect Wallet"
- Select "Talisman" (or use WalletConnect)
- Approve the connection
- **Invoice creation will work smoothly!** ✅

---

## Alternative: SubWallet

If Talisman doesn't work for you, try **SubWallet**:

**Download:** https://subwallet.app/

Setup is similar:
1. Install extension
2. Create/import wallet
3. Add custom network (same details as above)
4. Get PAS tokens from faucet
5. Connect to Vaultstone

---

## Why Talisman is Better for Polkadot Hub

From the official Polkadot docs:

> "Talisman offers a more integrated experience for Polkadot-based chains while still 
> providing Ethereum compatibility... Talisman offers deeper integration with Polkadot's 
> unique features and native support for both EVM and Substrate accounts."

**Key advantages:**
- Native Polkadot support
- Handles EVM transactions better
- Better error messages
- Supports XCM cross-chain (for our cross-chain payment feature!)
- Won't block on legitimate transactions

---

## Current Vaultstone Support

Our app (`http://3.83.41.99`) currently supports:

✅ **Talisman** (Recommended)  
✅ **MetaMask** (if you can bypass the warning)  
✅ **Injected wallets** (any wallet that injects `window.ethereum`)  
✅ **WalletConnect** (mobile wallets)

---

## Still Want to Use MetaMask?

If you must use MetaMask and it's blocking you:

### Option 1: Desktop MetaMask
- Sometimes mobile MetaMask is more restrictive
- Try on desktop browser if you were on mobile

### Option 2: Advanced Settings
1. Open MetaMask
2. Settings → Advanced
3. Enable "Show hex data"
4. Try the transaction again
5. You may see more details/options

### Option 3: MetaMask Flask
- MetaMask Flask is the developer version
- https://metamask.io/flask/
- More permissive with transactions
- **Use only for testing!**

### Option 4: Wait for Fix
- We can deploy VaultstoneV2 that uses `address(0x...001)` instead
- Would avoid the MetaMask warning entirely
- Let me know if you want this deployed

---

## Technical Note

The MetaMask warning is about the `address(0)` parameter used to indicate "native currency" vs ERC20 tokens. This is:

- ✅ A standard Solidity pattern
- ✅ Used by Uniswap, OpenZeppelin, Compound, etc.
- ✅ Completely safe (your funds go to the recipient, not address(0))
- ❌ But MetaMask can't distinguish parameter flags from actual transfers

**Talisman handles this better** because it's built for Polkadot and understands these patterns.

---

## Need Help?

**Questions?** Open an issue: https://github.com/tufstraka/vaultstone/issues  
**Docs:** METAMASK_SETUP.md, BURN_ADDRESS_EXPLANATION.md  
**Contract:** https://blockscout-testnet.polkadot.io/address/0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797

---

**TL;DR:** Use Talisman wallet - it's the official recommendation from Polkadot docs, handles transactions better, and won't block you. Download at https://talisman.xyz/ 🚀
