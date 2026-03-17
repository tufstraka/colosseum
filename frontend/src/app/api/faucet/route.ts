// USDC Faucet API - mints test USDC to any address on Polkadot Hub TestNet
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MOCK_USDC_ADDRESS = "0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f";
const DEPLOYER_KEY = "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";
const RPC_URL = "https://eth-rpc-testnet.polkadot.io/";

const MINT_ABI = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address) view returns (uint256)",
]);

const polkadotHubTestnet = {
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const account = privateKeyToAccount(DEPLOYER_KEY as `0x${string}`);
    
    const walletClient = createWalletClient({
      account,
      chain: polkadotHubTestnet,
      transport: http(RPC_URL),
    });

    const publicClient = createPublicClient({
      chain: polkadotHubTestnet,
      transport: http(RPC_URL),
    });

    // Check current balance
    const currentBalance = await publicClient.readContract({
      address: MOCK_USDC_ADDRESS as `0x${string}`,
      abi: MINT_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    // Mint 10,000 USDC (6 decimals)
    const mintAmount = BigInt(10_000) * BigInt(10 ** 6);

    const hash = await walletClient.writeContract({
      address: MOCK_USDC_ADDRESS as `0x${string}`,
      abi: MINT_ABI,
      functionName: "mint",
      args: [address as `0x${string}`, mintAmount],
    });

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const newBalance = await publicClient.readContract({
      address: MOCK_USDC_ADDRESS as `0x${string}`,
      abi: MINT_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    return NextResponse.json({
      success: true,
      txHash: hash,
      address,
      minted: "10,000 USDC",
      previousBalance: `${Number(currentBalance) / 1e6} USDC`,
      newBalance: `${Number(newBalance) / 1e6} USDC`,
      explorerUrl: `https://blockscout-testnet.polkadot.io/tx/${hash}`,
      usdcContract: MOCK_USDC_ADDRESS,
    });
  } catch (error: any) {
    console.error("Faucet error:", error);
    return NextResponse.json({ 
      error: "Faucet failed", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Genome Vault USDC Faucet",
    network: "Polkadot Hub TestNet (420420417)",
    usdcContract: MOCK_USDC_ADDRESS,
    mintAmount: "10,000 USDC per request",
    usage: "POST with { address: '0x...' }",
  });
}
