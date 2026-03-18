import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MOCK_USDC = "0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f";
const KEY = "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";
const RPC = "https://eth-rpc-testnet.polkadot.io/";
const ABI = parseAbi(["function mint(address to, uint256 amount) external", "function balanceOf(address) view returns (uint256)"]);
const chain = { id: 420420417, name: "Polkadot Hub TestNet", nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } } as const;

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

    const account = privateKeyToAccount(KEY as `0x${string}`);
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const pub = createPublicClient({ chain, transport: http(RPC) });

    const amount = BigInt(10_000) * BigInt(10 ** 6);
    const hash = await wallet.writeContract({ address: MOCK_USDC as `0x${string}`, abi: ABI, functionName: "mint", args: [address as `0x${string}`, amount] });
    await pub.waitForTransactionReceipt({ hash });
    const bal = await pub.readContract({ address: MOCK_USDC as `0x${string}`, abi: ABI, functionName: "balanceOf", args: [address as `0x${string}`] });

    return NextResponse.json({ success: true, minted: "10,000 USDC", newBalance: `${Number(bal) / 1e6} USDC`, txHash: hash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ name: "Colosseum USDC Faucet", mint: "10,000 USDC", usage: "POST { address }" });
}
