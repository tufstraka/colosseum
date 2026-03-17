"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe,
  FileText
} from "lucide-react";
import { formatX402Amount, type PaymentRequirement } from "@/lib/x402/types";

interface X402PaywallProps {
  requirements: PaymentRequirement[];
  resourceName: string;
  resourceDescription: string;
  onPaymentSuccess: (response: any) => void;
  onPaymentError?: (error: Error) => void;
  children?: React.ReactNode;
}

export function X402Paywall({
  requirements,
  resourceName,
  resourceDescription,
  onPaymentSuccess,
  onPaymentError,
  children,
}: X402PaywallProps) {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<PaymentRequirement | null>(
    requirements[0] || null
  );

  const handlePay = async () => {
    if (!selectedRequirement || !address) return;

    setIsPaying(true);
    setError(null);

    try {
      const nonce = `0x${Date.now().toString(16).padStart(64, '0')}`;
      const validAfter = Math.floor(Date.now() / 1000);
      const validBefore = validAfter + selectedRequirement.maxTimeoutSeconds;

      // Sign the payment authorization
      const signature = await signTypedDataAsync({
        types: {
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
        message: {
          from: address,
          to: selectedRequirement.payTo as `0x${string}`,
          value: BigInt(selectedRequirement.maxAmountRequired),
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
          nonce: nonce as `0x${string}`,
        },
      });

      // Create payment payload
      const paymentPayload = {
        x402Version: 1,
        scheme: selectedRequirement.scheme,
        network: selectedRequirement.network,
        payload: {
          signature,
          authorization: {
            from: address,
            to: selectedRequirement.payTo,
            value: selectedRequirement.maxAmountRequired,
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce,
          },
        },
      };

      // Make the paid request
      const response = await fetch(selectedRequirement.resource, {
        method: "GET",
        headers: {
          "X-PAYMENT": btoa(JSON.stringify(paymentPayload)),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsPaid(true);
        onPaymentSuccess(data);
      } else {
        throw new Error(`Payment failed: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onPaymentError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsPaying(false);
    }
  };

  if (isPaid && children) {
    return <>{children}</>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Payment Required</h3>
              <p className="text-xs text-zinc-400">x402 Protocol</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">{resourceDescription}</p>
        </div>

        {/* Resource Info */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-xl">
            <FileText className="w-8 h-8 text-zinc-400" />
            <div>
              <p className="font-medium text-white">{resourceName}</p>
              <p className="text-xs text-zinc-500">Protected Resource</p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-6 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 mb-3">Select payment method</p>
          <div className="space-y-2">
            {requirements.map((req, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRequirement(req)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedRequirement === req
                    ? "bg-zinc-800 border-emerald-500"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      req.network.includes("polkadot") ? "bg-pink-500/20" : "bg-blue-500/20"
                    }`}>
                      <Globe className={`w-4 h-4 ${
                        req.network.includes("polkadot") ? "text-pink-400" : "text-blue-400"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">{req.network}</p>
                      <p className="text-xs text-zinc-500">{req.scheme} payment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatX402Amount(req.maxAmountRequired)} {req.asset}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="p-6">
          {!isConnected ? (
            <p className="text-center text-zinc-400 text-sm">
              Connect your wallet to pay
            </p>
          ) : (
            <button
              onClick={handlePay}
              disabled={isPaying || !selectedRequirement}
              className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay {selectedRequirement && formatX402Amount(selectedRequirement.maxAmountRequired)} {selectedRequirement?.asset}
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Instant
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Secure
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              x402
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success state component
export function X402PaymentSuccess({ 
  transactionHash, 
  amount,
  asset 
}: { 
  transactionHash?: string;
  amount: string;
  asset: string;
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-zinc-400 mb-4">
          You paid {formatX402Amount(amount)} {asset}
        </p>
        {transactionHash && (
          <a
            href={`https://blockscout-testnet.polkadot.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-500 hover:underline"
          >
            View transaction →
          </a>
        )}
      </div>
    </div>
  );
}
