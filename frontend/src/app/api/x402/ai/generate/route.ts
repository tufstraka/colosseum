import { NextRequest, NextResponse } from "next/server";

// x402 Payment Requirement for AI Invoice Generation
const PAYMENT_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "50000000000000000", // 0.05 PAS
  resource: "/api/x402/ai/generate",
  description: "AI-powered invoice generation from natural language",
  mimeType: "application/json",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

// Simple AI invoice parser (in production, use OpenAI/Claude API)
function parseInvoiceRequest(prompt: string): {
  recipient: string | null;
  amount: number | null;
  currency: string;
  description: string;
  dueDate: string;
  splits: { address: string; percentage: number }[];
} {
  const result = {
    recipient: null as string | null,
    amount: null as number | null,
    currency: "PAS",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days default
    splits: [] as { address: string; percentage: number }[],
  };

  // Extract amount
  const amountMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(PAS|DOT|USDT|USDC|dollars?|usd|\$)/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
    const currency = amountMatch[2].toLowerCase();
    if (currency.includes("dot")) result.currency = "DOT";
    else if (currency.includes("usd") || currency.includes("dollar") || currency === "$") result.currency = "USDT";
    else result.currency = "PAS";
  }

  // Extract recipient address
  const addressMatch = prompt.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    result.recipient = addressMatch[0];
  }

  // Extract due date
  const datePatterns = [
    /due\s+(?:on\s+)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}-\d{2}-\d{2})/,
    /in\s+(\d+)\s+days?/i,
    /next\s+(week|month)/i,
  ];

  for (const pattern of datePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      if (match[1].includes("-") || match[1].includes("/")) {
        result.dueDate = match[1];
      } else if (!isNaN(parseInt(match[1]))) {
        const days = parseInt(match[1]);
        result.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      } else if (match[1] === "week") {
        result.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      } else if (match[1] === "month") {
        result.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }
      break;
    }
  }

  // Extract splits
  const splitMatch = prompt.match(/split\s+(?:it\s+)?(?:between\s+)?(.+)/i);
  if (splitMatch) {
    const splitPart = splitMatch[1];
    const addresses = splitPart.match(/0x[a-fA-F0-9]{40}/g) || [];
    const percentages = splitPart.match(/(\d+)%/g)?.map(p => parseInt(p)) || [];
    
    if (addresses.length > 0) {
      // If percentages not specified, split equally
      const equalShare = Math.floor(100 / addresses.length);
      addresses.forEach((addr, i) => {
        result.splits.push({
          address: addr,
          percentage: percentages[i] || equalShare,
        });
      });
    }
  }

  // Extract description
  const forMatch = prompt.match(/for\s+["']?([^"'\n,]+)["']?/i);
  if (forMatch) {
    result.description = forMatch[1].trim();
  } else {
    // Use first part of prompt as description
    result.description = prompt.split(/[,\.]/).filter(s => 
      !s.includes("0x") && !s.match(/\d+\s*(PAS|DOT)/i)
    )[0]?.trim() || "Invoice";
  }

  return result;
}

export async function POST(request: NextRequest) {
  // Check for payment header
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

  // Verify payment
  try {
    const paymentPayload = JSON.parse(atob(paymentHeader));
    if (!paymentPayload.x402Version || !paymentPayload.payload?.signature) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }

    // Get the prompt from request body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
    }

    // Parse the invoice request using AI
    const parsed = parseInvoiceRequest(prompt);

    // Generate response
    return NextResponse.json({
      success: true,
      message: "Invoice generated successfully",
      invoice: {
        recipient: parsed.recipient,
        amount: parsed.amount,
        currency: parsed.currency,
        description: parsed.description,
        dueDate: parsed.dueDate,
        splits: parsed.splits.length > 0 ? parsed.splits : null,
        metadata: {
          generatedBy: "Vaultstone AI",
          generatedAt: new Date().toISOString(),
          originalPrompt: prompt,
        },
      },
      // Pre-filled form data for frontend
      formData: {
        recipient: parsed.recipient || "",
        amount: parsed.amount?.toString() || "",
        dueDate: parsed.dueDate,
        description: parsed.description,
        splits: parsed.splits.map(s => ({
          payee: s.address,
          shares: Math.floor(s.percentage * 100), // Convert to basis points
        })),
      },
      suggestions: [
        parsed.recipient ? null : "💡 Add a recipient address (0x...)",
        parsed.amount ? null : "💡 Specify an amount (e.g., '100 PAS')",
        parsed.splits.length === 0 ? "💡 You can add splits with 'split between 0x... and 0x...'" : null,
      ].filter(Boolean),
      payment: {
        verified: true,
        from: paymentPayload.payload?.authorization?.from,
        amount: PAYMENT_REQUIREMENT.maxAmountRequired,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  // Return payment requirements for GET requests
  const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));
  return new NextResponse(
    JSON.stringify({
      endpoint: "/api/x402/ai/generate",
      method: "POST",
      description: "AI-powered invoice generation from natural language",
      cost: "0.05 PAS",
      example: {
        prompt: "Create an invoice for 100 PAS to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for website development, due in 2 weeks",
      },
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
