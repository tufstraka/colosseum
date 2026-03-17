import { NextRequest, NextResponse } from "next/server";
import { generateInvoiceWithAI } from "@/lib/ai/bedrock";

// x402 Payment Requirement for AI Invoice Generation
const PAYMENT_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "50000000000000000", // 0.05 PAS
  resource: "/api/x402/ai/generate",
  description: "AI-powered invoice generation from natural language (Powered by Claude)",
  mimeType: "application/json",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

export async function POST(request: NextRequest) {
  const paymentHeader = request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));
    return new NextResponse(
      JSON.stringify({
        error: "Payment Required",
        message: "AI invoice generation requires payment (0.05 PAS)",
        requirements: [PAYMENT_REQUIREMENT],
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT-REQUIRED": requirementEncoded,
        },
      }
    );
  }

  try {
    const paymentPayload = JSON.parse(atob(paymentHeader));
    if (!paymentPayload.x402Version || !paymentPayload.payload?.signature) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
    }

    // Generate invoice using Amazon Bedrock
    const invoice = await generateInvoiceWithAI(prompt);

    return NextResponse.json({
      success: true,
      message: "Invoice generated successfully",
      poweredBy: "Amazon Bedrock (Claude 3 Sonnet)",
      invoice: {
        ...invoice,
        metadata: {
          generatedBy: "Vaultstone AI",
          generatedAt: new Date().toISOString(),
          originalPrompt: prompt,
          model: "Claude 3 Sonnet",
        },
      },
      // Pre-filled form data for frontend
      formData: {
        recipient: invoice.recipient || "",
        amount: invoice.amount?.toString() || "",
        dueDate: invoice.dueDate,
        description: invoice.description,
        splits: invoice.splits.map(s => ({
          payee: s.address,
          shares: Math.floor(s.percentage * 100),
        })),
      },
      suggestions: [
        invoice.recipient ? null : "💡 Add a recipient address (0x...)",
        invoice.amount ? null : "💡 Specify an amount (e.g., '100 PAS')",
        invoice.splits.length === 0 ? "💡 You can add splits with 'split between 0x... and 0x...'" : null,
      ].filter(Boolean),
      payment: {
        verified: true,
        from: paymentPayload.payload?.authorization?.from,
        amount: PAYMENT_REQUIREMENT.maxAmountRequired,
      },
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

export async function GET() {
  const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));
  return new NextResponse(
    JSON.stringify({
      endpoint: "/api/x402/ai/generate",
      method: "POST",
      description: "AI-powered invoice generation from natural language",
      poweredBy: "Amazon Bedrock (Claude 3 Sonnet)",
      cost: "0.05 PAS",
      features: [
        "Natural language understanding",
        "Address extraction",
        "Amount and currency detection",
        "Due date calculation",
        "Payment split parsing",
      ],
      examples: [
        "Create an invoice for 100 PAS to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for website development, due in 2 weeks",
        "Invoice for 500 DOT to 0xABC...123 for consulting, split 60/40 between me and 0xDEF...456",
        "Bill 0x123...789 for 250 USDT, logo design work, due next month",
      ],
      requirements: [PAYMENT_REQUIREMENT],
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT-REQUIRED": requirementEncoded,
      },
    }
  );
}
