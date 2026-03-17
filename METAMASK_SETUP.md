# 🦊 MetaMask Setup Guide for Vaultstone

## Step 1: Add Polkadot Hub TestNet to MetaMask

### Option A: Add Network Manually

1. Open MetaMask and click the network dropdown
2. Click "Add Network" → "Add network manually"
3. Enter the following details:

```
Network Name: Polkadot Hub TestNet
RPC URL: https://eth-rpc-testnet.polkadot.io/
Chain ID: 420420417
Currency Symbol: PAS
Block Explorer: https://blockscout-testnet.polkadot.io/
```

4. Click "Save"

### Option B: Add via Vaultstone (Auto-Connect)

1. Visit http://3.83.41.99
2. Click "Connect Wallet" in the top right
3. Select MetaMask
4. When prompted to add network, click "Approve"

---

## Step 2: Get Test Tokens (PAS)

1. Visit the Polkadot Faucet: https://faucet.polkadot.io/
2. Select "Polkadot Hub TestNet" from the dropdown
3. Paste your MetaMask address (starts with 0x...)
4. Click "Get Some PASs"
5. Wait 10-30 seconds for tokens to arrive

---

## Step 3: Use Vaultstone

### Create an Invoice:

1. Go to http://3.83.41.99/dashboard
2. Click "Create Invoice"
3. Fill in:
   - **Recipient**: The wallet address that should pay
   - **Amount**: Invoice amount in PAS
   - **Due Date**: Payment deadline
   - **Payment Splits** (optional): Split payment among multiple wallets

4. Click "Create Invoice"
5. Confirm the transaction in MetaMask
6. Your invoice NFT is minted! Share the payment link

### Pay an Invoice:

1. Visit the payment link (e.g., `/pay/1`)
2. Connect your wallet
3. Review the invoice details
4. Click "Pay Invoice"
5. Confirm the transaction in MetaMask
6. Payment is automatically distributed to all recipients!

---

## Contract Details

**Polkadot Hub TestNet**
- Contract: `0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797`
- Chain ID: 420420417
- RPC: https://eth-rpc-testnet.polkadot.io/
- Explorer: https://blockscout-testnet.polkadot.io/

**Features:**
- ✅ NFT Invoices (ERC721)
- ✅ Cross-chain payments via XCM
- ✅ Payment splits (up to 10 recipients)
- ✅ Multi-currency support (native + ERC20)
- ✅ 1% platform fee

---

## Troubleshooting

### "Wrong Network" Error
- Make sure you've added Polkadot Hub TestNet to MetaMask
- Switch to the correct network in MetaMask

### "Insufficient Funds" Error
- Get test PAS tokens from https://faucet.polkadot.io/
- Make sure you have enough for the invoice amount + gas fees

### Transaction Fails
- Check that the recipient address is valid (starts with 0x)
- Ensure due date is in the future
- If using payment splits, make sure shares total exactly 10000 (100%)

### Can't See My Invoices
- Make sure you're connected with the same wallet that created them
- Check that you're on the correct network (Polkadot Hub TestNet)

---

## Advanced: Local Development

If you want to test locally with Anvil:

1. Add localhost network to MetaMask:
```
Network Name: Localhost
RPC URL: http://3.83.41.99:8545
Chain ID: 31337
Currency Symbol: ETH
```

2. Import the test account:
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

3. Local contract: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

## Security Notes

⚠️ **Testnet Only**
- This is a testnet deployment for testing only
- PAS tokens have no real value
- Do not use mainnet wallets or private keys

🔒 **Best Practices**
- Never share your private key or seed phrase
- Always verify the contract address before transactions
- Double-check recipient addresses before creating invoices

---

## Need Help?

- 📖 Docs: https://github.com/tufstraka/vaultstone
- 🐛 Issues: https://github.com/tufstraka/vaultstone/issues
- 💬 Community: Polkadot Discord

---

**Enjoy using Vaultstone! 🚀**

The future of cross-chain invoicing on Polkadot.
