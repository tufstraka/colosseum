// AWS Bedrock client for AI features
// Uses Claude 3 Sonnet for invoice analysis

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface InvoiceAnalysis {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  creditworthiness: number;
  suggestedDiscount: number;
  factors: {
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
  recommendation: string;
  estimatedPaymentDays: number;
}

export interface GeneratedInvoice {
  recipient: string | null;
  amount: number | null;
  currency: string;
  description: string;
  dueDate: string;
  splits: { address: string; percentage: number }[];
}

export async function analyzeInvoiceWithAI(invoice: {
  recipient: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  creatorHistory?: {
    totalInvoices: number;
    paidOnTime: number;
    averagePaymentDays: number;
  };
}): Promise<InvoiceAnalysis> {
  const prompt = `You are an invoice risk analyst for a blockchain-based invoice factoring platform. Analyze this invoice and provide a risk assessment for potential investors who might buy this invoice at a discount.

Invoice Details:
- Recipient (Debtor): ${invoice.recipient}
- Amount: ${invoice.amount} ${invoice.currency}
- Description: ${invoice.description || "Not provided"}
- Due Date: ${invoice.dueDate || "Not specified"}
${invoice.creatorHistory ? `
Creator History:
- Total Invoices Created: ${invoice.creatorHistory.totalInvoices}
- Paid On Time Rate: ${Math.round((invoice.creatorHistory.paidOnTime / invoice.creatorHistory.totalInvoices) * 100)}%
- Average Payment Time: ${invoice.creatorHistory.averagePaymentDays} days
` : ""}

Provide your analysis in the following JSON format:
{
  "riskScore": <0-100, where 0 is lowest risk>,
  "riskLevel": "<low|medium|high|critical>",
  "creditworthiness": <0-100, estimated debtor creditworthiness>,
  "suggestedDiscount": <percentage discount for factoring, e.g., 5 means sell at 95% of face value>,
  "factors": [
    {"factor": "<factor name>", "impact": "<positive|negative|neutral>", "description": "<explanation>"}
  ],
  "recommendation": "<detailed recommendation for investors>",
  "estimatedPaymentDays": <estimated days until payment>
}

Be realistic and conservative in your assessment. Consider:
1. Amount size and typical payment patterns
2. Description quality and legitimacy indicators
3. Due date reasonableness
4. Creator history if available
5. Market conditions for invoice factoring`;

  try {
    const command = new InvokeModelCommand({
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
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Bedrock AI error:", error);
    // Fallback to rule-based analysis
    return fallbackAnalysis(invoice);
  }
}

export async function generateInvoiceWithAI(prompt: string): Promise<GeneratedInvoice> {
  const systemPrompt = `You are an AI assistant that helps create invoices from natural language descriptions. Extract structured invoice data from the user's request.

Return a JSON object with:
{
  "recipient": "<0x address if mentioned, or null>",
  "amount": <number or null>,
  "currency": "<PAS|DOT|USDT|USDC, default PAS>",
  "description": "<brief description of what the invoice is for>",
  "dueDate": "<YYYY-MM-DD format, calculate from relative dates like 'in 2 weeks'>",
  "splits": [{"address": "<0x address>", "percentage": <number>}] or empty array
}

Today's date is ${new Date().toISOString().split('T')[0]}.
If due date is not specified, default to 7 days from today.
Be precise with addresses - only include valid 0x addresses with 40 hex characters.`;

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Bedrock AI error:", error);
    // Fallback to regex-based parsing
    return fallbackGenerate(prompt);
  }
}

function fallbackAnalysis(invoice: { amount: number; description?: string; dueDate?: string }): InvoiceAnalysis {
  let riskScore = 25; // Base risk
  const factors: InvoiceAnalysis["factors"] = [];
  
  // Amount-based risk
  if (invoice.amount > 10000) {
    riskScore += 20;
    factors.push({ factor: "High Value", impact: "negative", description: "Large invoice amounts carry more risk" });
  } else if (invoice.amount < 100) {
    riskScore += 10;
    factors.push({ factor: "Low Value", impact: "neutral", description: "Small amounts may not be worth factoring costs" });
  } else {
    factors.push({ factor: "Standard Amount", impact: "positive", description: "Invoice amount is within normal range" });
  }
  
  // Description quality
  if (invoice.description && invoice.description.length > 20) {
    riskScore -= 10;
    factors.push({ factor: "Detailed Description", impact: "positive", description: "Clear service description increases legitimacy" });
  }
  
  // Due date
  if (invoice.dueDate) {
    const days = Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days > 90) {
      riskScore += 15;
      factors.push({ factor: "Long Payment Term", impact: "negative", description: "Extended payment terms increase risk" });
    } else if (days < 14) {
      factors.push({ factor: "Short Payment Term", impact: "positive", description: "Quick payment expected" });
    }
  }
  
  const riskLevel = riskScore < 30 ? "low" : riskScore < 50 ? "medium" : riskScore < 70 ? "high" : "critical";
  const suggestedDiscount = Math.min(15, Math.max(2, Math.round(riskScore / 10)));
  
  return {
    riskScore: Math.min(100, Math.max(0, riskScore)),
    riskLevel,
    creditworthiness: 100 - riskScore,
    suggestedDiscount,
    factors,
    recommendation: riskLevel === "low" 
      ? "This invoice appears to be a good factoring opportunity with reasonable risk."
      : riskLevel === "medium"
      ? "Consider factoring with appropriate discount. Some risk factors present."
      : "Higher risk invoice. Ensure adequate discount to compensate for risk.",
    estimatedPaymentDays: 30,
  };
}

function fallbackGenerate(prompt: string): GeneratedInvoice {
  const result: GeneratedInvoice = {
    recipient: null,
    amount: null,
    currency: "PAS",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    splits: [],
  };

  // Extract address
  const addressMatch = prompt.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) result.recipient = addressMatch[0];

  // Extract amount
  const amountMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(PAS|DOT|USDT|USDC)?/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
    if (amountMatch[2]) result.currency = amountMatch[2].toUpperCase();
  }

  // Extract description
  const forMatch = prompt.match(/for\s+["']?([^"'\n,]+)["']?/i);
  if (forMatch) result.description = forMatch[1].trim();

  // Extract due date
  const weekMatch = prompt.match(/in\s+(\d+)\s+weeks?/i);
  const dayMatch = prompt.match(/in\s+(\d+)\s+days?/i);
  if (weekMatch) {
    result.dueDate = new Date(Date.now() + parseInt(weekMatch[1]) * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  } else if (dayMatch) {
    result.dueDate = new Date(Date.now() + parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }

  return result;
}
