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

interface FraudCheckRequest {
  recipientAddress: string;
  amount: number;
  currency: string;
  creatorAddress: string;
  description: string;
}

interface FraudCheckResult {
  riskScore: number; // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warnings: string[];
  recommendations: string[];
  approved: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: FraudCheckRequest = await request.json();

    const prompt = `You are a fraud detection AI for a blockchain invoice platform. Analyze this invoice for potential fraud risks.

Invoice Details:
- Creator Address: ${body.creatorAddress}
- Recipient Address: ${body.recipientAddress}
- Amount: ${body.amount} ${body.currency}
- Description: "${body.description}"

Analyze for:
1. Unusually high amounts for the service described
2. Suspicious address patterns (if any known patterns)
3. Vague or suspicious descriptions
4. Potential money laundering indicators
5. Social engineering red flags

Return ONLY a valid JSON object (no markdown) with this structure:
{
  "riskScore": 0-100,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "warnings": ["array of specific warnings"],
  "recommendations": ["array of recommendations"],
  "approved": true/false
}

Be conservative - most legitimate invoices should pass. Only flag truly suspicious patterns.`;

    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })
    );

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content[0].text;

    let fraudResult: FraudCheckResult;
    try {
      fraudResult = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fraudResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return NextResponse.json({
      success: true,
      result: fraudResult,
      model: "Amazon Bedrock - Claude 3 Sonnet",
    });
  } catch (error) {
    console.error("Fraud Check Error:", error);

    // Fallback - approve with low risk if AI fails
    return NextResponse.json({
      success: true,
      result: {
        riskScore: 10,
        riskLevel: "LOW",
        warnings: [],
        recommendations: ["AI analysis unavailable - manual review recommended"],
        approved: true,
      },
      fallback: true,
    });
  }
}
