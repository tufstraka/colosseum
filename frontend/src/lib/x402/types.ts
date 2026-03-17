// x402 Payment Types
export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionHash?: string;
  network?: string;
  paidAmount?: string;
}

// Parse x402 payment requirement from 402 response header
export function parsePaymentRequired(header: string): PaymentRequirement[] {
  try {
    const decoded = atob(header);
    return JSON.parse(decoded);
  } catch {
    return [];
  }
}

// Encode payment payload for request header
export function encodePaymentPayload(payload: PaymentPayload): string {
  return btoa(JSON.stringify(payload));
}

// Create EVM payment authorization message
export function createPaymentMessage(
  requirement: PaymentRequirement,
  from: string,
  nonce: string
): string {
  const validAfter = Math.floor(Date.now() / 1000).toString();
  const validBefore = (Math.floor(Date.now() / 1000) + requirement.maxTimeoutSeconds).toString();
  
  // EIP-712 typed data for payment authorization
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      PaymentAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "PaymentAuthorization",
    domain: {
      name: "x402",
      version: "1",
      chainId: 420420417, // Polkadot Hub TestNet
    },
    message: {
      from,
      to: requirement.payTo,
      value: requirement.maxAmountRequired,
      validAfter,
      validBefore,
      nonce,
    },
  });
}

// Format amount for display
export function formatX402Amount(amount: string, decimals: number = 18): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole}.${fractionStr}`;
}
