import { NextRequest, NextResponse } from "next/server";
import { analyzeInvoiceWithAI } from "@/lib/ai/bedrock";

// x402 Payment Requirement for Fraud Detection
const PAYMENT_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "25000000000000000", // 0.025 PAS
  resource: "/api/x402/ai/fraud-check",
  description: "AI-powered invoice fraud detection and risk analysis (Powered by Claude)",
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
        message: "AI fraud detection requires payment (0.025 PAS)",
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
    const { invoice } = body;

    if (!invoice || !invoice.recipient || !invoice.amount) {
      return NextResponse.json({ 
        error: "Missing required fields",
        required: ["invoice.recipient", "invoice.amount"],
      }, { status: 400 });
    }

    // Run AI analysis using Amazon Bedrock
    const analysis = await analyzeInvoiceWithAI({
      recipient: invoice.recipient,
      amount: invoice.amount,
      currency: invoice.currency || "PAS",
      description: invoice.description,
      dueDate: invoice.dueDate,
    });

    return NextResponse.json({
      success: true,
      message: "AI fraud analysis complete",
      poweredBy: "Amazon Bedrock (Claude 3 Sonnet)",
      analysis: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        creditworthiness: analysis.creditworthiness,
        suggestedDiscount: analysis.suggestedDiscount,
        factors: analysis.factors,
        recommendation: analysis.recommendation,
        estimatedPaymentDays: analysis.estimatedPaymentDays,
      },
      // For marketplace factoring
      factoring: {
        recommended: analysis.riskLevel !== "critical",
        suggestedPrice: invoice.amount * (1 - analysis.suggestedDiscount / 100),
        expectedProfit: invoice.amount * (analysis.suggestedDiscount / 100),
        annualizedReturn: analysis.estimatedPaymentDays > 0 
          ? (analysis.suggestedDiscount / analysis.estimatedPaymentDays) * 365
          : 0,
      },
      invoice: {
        recipient: invoice.recipient,
        amount: invoice.amount,
        currency: invoice.currency || "PAS",
      },
      payment: {
        verified: true,
        from: paymentPayload.payload?.authorization?.from,
        amount: PAYMENT_REQUIREMENT.maxAmountRequired,
      },
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

export async function GET() {
  const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));
  return new NextResponse(
    JSON.stringify({
      endpoint: "/api/x402/ai/fraud-check",
      method: "POST",
      description: "AI-powered invoice fraud detection and factoring analysis",
      poweredBy: "Amazon Bedrock (Claude 3 Sonnet)",
      cost: "0.025 PAS",
      features: [
        "Risk score (0-100)",
        "Creditworthiness assessment", 
        "Suggested factoring discount",
        "Annualized return calculation",
        "Detailed risk factors",
      ],
      example: {
        invoice: {
          recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          amount: 1000,
          currency: "PAS",
          description: "Website development services",
          dueDate: "2026-04-15",
        },
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
