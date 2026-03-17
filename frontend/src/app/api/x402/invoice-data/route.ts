import { NextRequest, NextResponse } from "next/server";

// x402 Payment Requirement
const PAYMENT_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "10000000000000000", // 0.01 PAS
  resource: "/api/x402/invoice-data",
  description: "Access premium invoice analytics and verification data",
  mimeType: "application/json",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129", // Contract admin
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

export async function GET(request: NextRequest) {
  // Check for payment header
  const paymentHeader = request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    // Return 402 Payment Required
    const requirementEncoded = btoa(JSON.stringify([PAYMENT_REQUIREMENT]));

    return new NextResponse(
      JSON.stringify({
        error: "Payment Required",
        message: "This endpoint requires payment via x402 protocol",
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

  // Verify payment (simplified - production would verify signature and settle)
  try {
    const paymentPayload = JSON.parse(atob(paymentHeader));

    // Validate payment payload structure
    if (
      !paymentPayload.x402Version ||
      !paymentPayload.scheme ||
      !paymentPayload.payload?.signature
    ) {
      return NextResponse.json(
        { error: "Invalid payment payload" },
        { status: 400 }
      );
    }

    // In production: verify signature, check nonce, settle payment
    // For demo: accept any valid-looking payment

    // Return premium data
    return NextResponse.json({
      success: true,
      message: "Payment verified! Here's your premium data.",
      data: {
        totalInvoicesCreated: 1247,
        totalVolume: "125000.00",
        volumeUnit: "PAS",
        averageInvoiceAmount: "100.24",
        topPaymentMethods: [
          { method: "Same-chain (PAS)", percentage: 68 },
          { method: "Cross-chain (XCM)", percentage: 32 },
        ],
        recentActivity: [
          { type: "invoice_created", count: 45, period: "24h" },
          { type: "invoice_paid", count: 38, period: "24h" },
          { type: "xcm_payments", count: 12, period: "24h" },
        ],
        networkStats: {
          polkadotHub: { invoices: 892, volume: "89200.00" },
          moonbeam: { invoices: 203, volume: "20300.00" },
          acala: { invoices: 152, volume: "15500.00" },
        },
        generatedAt: new Date().toISOString(),
      },
      payment: {
        verified: true,
        from: paymentPayload.payload?.authorization?.from,
        amount: PAYMENT_REQUIREMENT.maxAmountRequired,
        asset: PAYMENT_REQUIREMENT.asset,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid payment data" },
      { status: 400 }
    );
  }
}
