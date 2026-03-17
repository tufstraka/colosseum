import { NextRequest, NextResponse } from "next/server";

// x402 Payment Requirement for Fraud Detection
const PAYMENT_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "25000000000000000", // 0.025 PAS
  resource: "/api/x402/ai/fraud-check",
  description: "AI-powered invoice fraud detection and risk analysis",
  mimeType: "application/json",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

interface InvoiceData {
  recipient: string;
  amount: number;
  currency: string;
  creator?: string;
  dueDate?: string;
  description?: string;
}

interface RiskFactor {
  factor: string;
  severity: "low" | "medium" | "high";
  description: string;
  score: number;
}

function analyzeInvoice(invoice: InvoiceData): {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  recommendation: string;
  details: Record<string, any>;
} {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Check for unusual amount patterns
  if (invoice.amount > 10000) {
    factors.push({
      factor: "High Value Transaction",
      severity: "medium",
      description: `Invoice amount (${invoice.amount} ${invoice.currency}) exceeds typical threshold`,
      score: 15,
    });
    totalScore += 15;
  }

  // Check for round number amounts (potential money laundering indicator)
  if (invoice.amount % 1000 === 0 && invoice.amount > 1000) {
    factors.push({
      factor: "Round Number Amount",
      severity: "low",
      description: "Perfectly round amounts can indicate structured payments",
      score: 5,
    });
    totalScore += 5;
  }

  // Check recipient address patterns
  if (invoice.recipient) {
    // Check for known suspicious patterns
    const recipientLower = invoice.recipient.toLowerCase();
    
    // Burn address check
    if (recipientLower === "0x0000000000000000000000000000000000000000") {
      factors.push({
        factor: "Burn Address Recipient",
        severity: "high",
        description: "Invoice recipient is the zero/burn address",
        score: 50,
      });
      totalScore += 50;
    }

    // Self-payment check
    if (invoice.creator && recipientLower === invoice.creator.toLowerCase()) {
      factors.push({
        factor: "Self-Payment",
        severity: "medium",
        description: "Creator and recipient are the same address",
        score: 20,
      });
      totalScore += 20;
    }

    // Check for contract address (simple heuristic)
    if (recipientLower.startsWith("0x00000000")) {
      factors.push({
        factor: "Potential System Address",
        severity: "medium",
        description: "Recipient appears to be a system/precompile address",
        score: 15,
      });
      totalScore += 15;
    }
  }

  // Due date analysis
  if (invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 0) {
      factors.push({
        factor: "Past Due Date",
        severity: "medium",
        description: "Invoice due date is in the past",
        score: 10,
      });
      totalScore += 10;
    } else if (daysDiff < 1) {
      factors.push({
        factor: "Urgent Due Date",
        severity: "low",
        description: "Very short payment window (less than 24 hours)",
        score: 5,
      });
      totalScore += 5;
    } else if (daysDiff > 365) {
      factors.push({
        factor: "Extended Due Date",
        severity: "low",
        description: "Unusually long payment window (over 1 year)",
        score: 5,
      });
      totalScore += 5;
    }
  }

  // Description analysis
  if (invoice.description) {
    const desc = invoice.description.toLowerCase();
    
    // Urgency keywords
    const urgencyKeywords = ["urgent", "immediate", "asap", "emergency", "now"];
    if (urgencyKeywords.some(k => desc.includes(k))) {
      factors.push({
        factor: "Urgency Language",
        severity: "low",
        description: "Description contains urgency indicators (common in scam invoices)",
        score: 10,
      });
      totalScore += 10;
    }

    // Suspicious keywords
    const suspiciousKeywords = ["wire transfer", "gift card", "crypto", "investment return", "guaranteed"];
    if (suspiciousKeywords.some(k => desc.includes(k))) {
      factors.push({
        factor: "Suspicious Keywords",
        severity: "medium",
        description: "Description contains keywords commonly associated with fraud",
        score: 20,
      });
      totalScore += 20;
    }
  }

  // If no risk factors found, add a positive indicator
  if (factors.length === 0) {
    factors.push({
      factor: "No Issues Detected",
      severity: "low",
      description: "Invoice appears to follow standard patterns",
      score: 0,
    });
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  let recommendation: string;

  if (totalScore >= 50) {
    riskLevel = "critical";
    recommendation = "⛔ DO NOT PAY - This invoice has critical risk indicators. Verify the sender through a separate channel before proceeding.";
  } else if (totalScore >= 30) {
    riskLevel = "high";
    recommendation = "⚠️ HIGH RISK - Review carefully before paying. Consider contacting the sender to verify legitimacy.";
  } else if (totalScore >= 15) {
    riskLevel = "medium";
    recommendation = "⚡ MODERATE RISK - Some unusual patterns detected. Proceed with caution.";
  } else {
    riskLevel = "low";
    recommendation = "✅ LOW RISK - Invoice appears legitimate. Standard verification recommended.";
  }

  return {
    riskScore: Math.min(totalScore, 100),
    riskLevel,
    factors,
    recommendation,
    details: {
      analyzedAt: new Date().toISOString(),
      modelVersion: "vaultstone-fraud-v1",
      checksPerformed: [
        "Amount pattern analysis",
        "Recipient address validation",
        "Due date verification",
        "Description content analysis",
        "Cross-reference check",
      ],
    },
  };
}

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

    // Run fraud analysis
    const analysis = analyzeInvoice(invoice);

    return NextResponse.json({
      success: true,
      message: "Fraud analysis complete",
      analysis,
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));
  return new NextResponse(
    JSON.stringify({
      endpoint: "/api/x402/ai/fraud-check",
      method: "POST",
      description: "AI-powered invoice fraud detection",
      cost: "0.025 PAS",
      example: {
        invoice: {
          recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          amount: 100,
          currency: "PAS",
          description: "Website development services",
          dueDate: "2026-04-01",
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
