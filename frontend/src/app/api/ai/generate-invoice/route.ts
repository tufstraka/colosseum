import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface InvoiceGenerationRequest {
  description: string;
  context?: string;
  currency?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface GeneratedInvoice {
  title: string;
  items: InvoiceItem[];
  totalAmount: number;
  suggestedDueDate: string;
  paymentTerms: string;
  notes: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: InvoiceGenerationRequest = await request.json();

    const prompt = `You are an AI assistant that generates professional invoices for Web3 businesses.

Based on this description: "${body.description}"
Context: ${body.context || "Web3/Blockchain services"}
Currency: ${body.currency || "DOT"}

Generate a detailed invoice with line items. Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "title": "Professional invoice title",
  "items": [
    {"description": "Item description", "quantity": 1, "unitPrice": 100, "total": 100}
  ],
  "totalAmount": 100,
  "suggestedDueDate": "2026-04-13",
  "paymentTerms": "Net 30 - Payment due within 30 days",
  "notes": "Any relevant notes"
}

Make the invoice realistic for Web3/blockchain work. Use appropriate hourly rates for blockchain developers ($100-200/hr).`;

    // Call Amazon Bedrock with Claude
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })
    );

    // Parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content[0].text;

    // Parse the JSON from AI response
    let generatedInvoice: GeneratedInvoice;
    try {
      generatedInvoice = JSON.parse(aiText);
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedInvoice = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return NextResponse.json({
      success: true,
      invoice: generatedInvoice,
      aiGenerated: true,
      model: "Amazon Bedrock - Claude 3 Sonnet",
    });
  } catch (error) {
    console.error("Bedrock AI Error:", error);
    
    // Fallback to mock response if Bedrock fails
    const fallbackInvoice = generateFallbackInvoice(
      (await request.clone().json()).description
    );
    
    return NextResponse.json({
      success: true,
      invoice: fallbackInvoice,
      aiGenerated: false,
      fallback: true,
      error: error instanceof Error ? error.message : "Bedrock unavailable",
    });
  }
}

function generateFallbackInvoice(description: string): GeneratedInvoice {
  const lowerDesc = description.toLowerCase();
  let items: InvoiceItem[] = [];
  let title = "Professional Services Invoice";

  if (lowerDesc.includes("smart contract") || lowerDesc.includes("solidity")) {
    title = "Smart Contract Development Invoice";
    items = [
      { description: "Smart Contract Architecture & Design", quantity: 1, unitPrice: 1500, total: 1500 },
      { description: "Solidity Development (hours)", quantity: 40, unitPrice: 150, total: 6000 },
      { description: "Security Best Practices Implementation", quantity: 1, unitPrice: 2000, total: 2000 },
      { description: "Testing & Gas Optimization", quantity: 15, unitPrice: 100, total: 1500 },
    ];
  } else if (lowerDesc.includes("website") || lowerDesc.includes("frontend")) {
    title = "Web3 Frontend Development Invoice";
    items = [
      { description: "UI/UX Design for dApp", quantity: 1, unitPrice: 2500, total: 2500 },
      { description: "React/Next.js Development (hours)", quantity: 50, unitPrice: 120, total: 6000 },
      { description: "Wallet Integration (wagmi/viem)", quantity: 1, unitPrice: 1500, total: 1500 },
      { description: "Testing & Deployment", quantity: 10, unitPrice: 100, total: 1000 },
    ];
  } else if (lowerDesc.includes("audit") || lowerDesc.includes("security")) {
    title = "Smart Contract Security Audit Invoice";
    items = [
      { description: "Initial Code Review", quantity: 1, unitPrice: 3000, total: 3000 },
      { description: "Vulnerability Assessment (hours)", quantity: 30, unitPrice: 200, total: 6000 },
      { description: "Formal Verification", quantity: 1, unitPrice: 5000, total: 5000 },
      { description: "Audit Report & Recommendations", quantity: 1, unitPrice: 2000, total: 2000 },
    ];
  } else {
    items = [
      { description: "Blockchain Consulting", quantity: 10, unitPrice: 200, total: 2000 },
      { description: "Technical Implementation", quantity: 30, unitPrice: 150, total: 4500 },
      { description: "Documentation & Handover", quantity: 1, unitPrice: 1000, total: 1000 },
    ];
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    title,
    items,
    totalAmount,
    suggestedDueDate: dueDate.toISOString().split("T")[0],
    paymentTerms: "Net 30 - Payment due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.",
    notes: `Invoice generated for: "${description}". All amounts in DOT. Please review line items and adjust as needed.`,
  };
}
