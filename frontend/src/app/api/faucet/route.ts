import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi, parseEther, formatEther, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MOCK_USDC = "0x5b02180fCcf7708600F30EAC6cb8A971504C7d2f";
const KEY = "0xc8a44f742c7214f27752acdae2b3bb50722a8b598f8290719a3899053b3a8081";
const RPC = "https://eth-rpc-testnet.polkadot.io/";
const ABI = parseAbi(["function mint(address to, uint256 amount) external", "function balanceOf(address) view returns (uint256)"]);
const chain = { id: 420420417, name: "Polkadot Hub TestNet", nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } } as const;

const PAS_DRIP = parseEther("5"); // Send 5 PAS for gas

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

    const account = privateKeyToAccount(KEY as `0x${string}`);
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const pub = createPublicClient({ chain, transport: http(RPC) });

    // 1. Mint 10,000 USDC
    const amount = BigInt(10_000) * BigInt(10 ** 6);
    const mintHash = await wallet.writeContract({ address: MOCK_USDC as `0x${string}`, abi: ABI, functionName: "mint", args: [address as `0x${string}`, amount] });
    await pub.waitForTransactionReceipt({ hash: mintHash });

    // 2. Send PAS for gas (so user can actually transact)
    let pasHash: string | null = null;
    const userPasBalance = await pub.getBalance({ address: address as `0x${string}` });
    if (userPasBalance < parseEther("1")) {
      // Only send PAS if user has less than 1 PAS
      try {
        pasHash = await wallet.sendTransaction({
          to: address as `0x${string}`,
          value: PAS_DRIP,
        });
        await pub.waitForTransactionReceipt({ hash: pasHash });
      } catch (e: any) {
        // PAS transfer failed but USDC mint succeeded — still return success
        console.error("PAS transfer failed:", e.message);
      }
    }

    const usdcBal = await pub.readContract({ address: MOCK_USDC as `0x${string}`, abi: ABI, functionName: "balanceOf", args: [address as `0x${string}`] });
    const pasBal = await pub.getBalance({ address: address as `0x${string}` });

    return NextResponse.json({
      success: true,
      minted: "10,000 USDC",
      usdcBalance: `${formatUnits(usdcBal, 6)} USDC`,
      pasBalance: `${formatEther(pasBal)} PAS`,
      pasSent: pasHash ? "5 PAS" : "already had PAS",
      mintTxHash: mintHash,
      pasTxHash: pasHash,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Colosseum Faucet",
    provides: "10,000 USDC + 5 PAS (for gas)",
    usage: "POST { address }",
    note: "PAS is only sent if balance < 1 PAS",
  });
}
