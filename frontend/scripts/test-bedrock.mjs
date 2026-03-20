#!/usr/bin/env node

// Test AWS Bedrock credentials

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

async function testBedrock() {
  console.log("\n🔑 Testing AWS Bedrock credentials...\n");
  
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS credentials not set");
    console.error("\nSet environment variables:");
    console.error("  export AWS_ACCESS_KEY_ID=your_key");
    console.error("  export AWS_SECRET_ACCESS_KEY=your_secret\n");
    return false;
  }
  
  try {
    const client = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    });

    const response = await client.send(new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 100,
        messages: [{ role: "user", content: "Reply with: 'Bedrock works!'" }],
      }),
    }));

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const text = result.content?.[0]?.text || "";

    if (text) {
      console.log("✅ SUCCESS! Bedrock response:\n");
      console.log(text);
      console.log("\n✅ Credentials are valid!\n");
      return true;
    } else {
      console.log("❌ Empty response from Bedrock\n");
      return false;
    }
  } catch (error) {
    console.error("❌ Bedrock call failed:", error.message);
    return false;
  }
}

testBedrock().then(success => process.exit(success ? 0 : 1));
