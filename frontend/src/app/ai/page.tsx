"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useSignTypedData } from "wagmi";
import { ConnectButton } from "@/components/wallet/connect-button";
import { 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  FileText,
  Zap,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";

const AI_GENERATE_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "50000000000000000", // 0.05 PAS
  resource: "/api/x402/ai/generate",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

const FRAUD_CHECK_REQUIREMENT = {
  scheme: "exact",
  network: "polkadot-hub-testnet",
  maxAmountRequired: "25000000000000000", // 0.025 PAS
  resource: "/api/x402/ai/fraud-check",
  payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
  maxTimeoutSeconds: 300,
  asset: "PAS",
};

export default function AIServicesPage() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [activeTab, setActiveTab] = useState<"generate" | "fraud">("generate");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate state
  const [prompt, setPrompt] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  
  // Fraud check state
  const [fraudInput, setFraudInput] = useState({
    recipient: "",
    amount: "",
    currency: "PAS",
    description: "",
    dueDate: "",
  });
  const [fraudResult, setFraudResult] = useState<any>(null);
  
  const [copied, setCopied] = useState(false);

  const signAndPay = async (requirement: typeof AI_GENERATE_REQUIREMENT) => {
    if (!address) throw new Error("Wallet not connected");

    const nonce = `0x${Date.now().toString(16).padStart(64, '0')}`;
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + requirement.maxTimeoutSeconds;

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
        to: requirement.payTo as `0x${string}`,
        value: BigInt(requirement.maxAmountRequired),
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce: nonce as `0x${string}`,
      },
    });

    return {
      x402Version: 1,
      scheme: requirement.scheme,
      network: requirement.network,
      payload: {
        signature,
        authorization: {
          from: address,
          to: requirement.payTo,
          value: requirement.maxAmountRequired,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedInvoice(null);

    try {
      const paymentPayload = await signAndPay(AI_GENERATE_REQUIREMENT);

      const response = await fetch("/api/x402/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": btoa(JSON.stringify(paymentPayload)),
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setGeneratedInvoice(data);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFraudCheck = async () => {
    if (!fraudInput.recipient || !fraudInput.amount) return;
    
    setIsLoading(true);
    setError(null);
    setFraudResult(null);

    try {
      const paymentPayload = await signAndPay(FRAUD_CHECK_REQUIREMENT);

      const response = await fetch("/api/x402/ai/fraud-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": btoa(JSON.stringify(paymentPayload)),
        },
        body: JSON.stringify({ 
          invoice: {
            ...fraudInput,
            amount: parseFloat(fraudInput.amount),
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setFraudResult(data);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low": return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case "medium": return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "high": return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case "critical": return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Shield className="w-6 h-6 text-zinc-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "medium": return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      case "high": return "bg-orange-500/10 border-orange-500/20 text-orange-500";
      case "critical": return "bg-red-500/10 border-red-500/20 text-red-500";
      default: return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-white text-lg">Vaultstone</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Services
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Intelligent Invoice Tools
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generate invoices from natural language and detect fraud with AI. 
              Powered by <strong className="text-white">x402 protocol</strong> - pay per use.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl mb-8">
            <button
              onClick={() => { setActiveTab("generate"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "generate" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">0.05 PAS</span>
            </button>
            <button
              onClick={() => { setActiveTab("fraud"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "fraud" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              Fraud Detection
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">0.025 PAS</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === "generate" ? (
            <div className="space-y-6">
              {/* Input */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Describe your invoice in plain English
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create an invoice for 150 PAS to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for logo design work, due in 2 weeks"
                  className="w-full h-32 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-zinc-500">
                    AI will extract: recipient, amount, due date, description, and payment splits
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={!isConnected || !prompt.trim() || isLoading}
                    className="px-5 py-2.5 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate (0.05 PAS)</>
                    )}
                  </button>
                </div>
              </div>

              {/* Result */}
              {generatedInvoice && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 bg-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-medium text-white">Invoice Generated!</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-950 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Recipient</p>
                        <p className="text-sm text-white font-mono truncate">
                          {generatedInvoice.invoice.recipient || "Not specified"}
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Amount</p>
                        <p className="text-sm text-white">
                          {generatedInvoice.invoice.amount || "Not specified"} {generatedInvoice.invoice.currency}
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Due Date</p>
                        <p className="text-sm text-white">{generatedInvoice.invoice.dueDate}</p>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Description</p>
                        <p className="text-sm text-white">{generatedInvoice.invoice.description}</p>
                      </div>
                    </div>

                    {generatedInvoice.suggestions?.length > 0 && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-sm text-yellow-400">
                          {generatedInvoice.suggestions.join(" ")}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Link
                        href={`/dashboard/invoices/create?prefill=${encodeURIComponent(JSON.stringify(generatedInvoice.formData))}`}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Create This Invoice
                      </Link>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(generatedInvoice.invoice, null, 2))}
                        className="px-4 py-3 border border-zinc-700 rounded-xl hover:bg-zinc-800 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Fraud Check Input */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-medium text-white mb-4">Invoice Details to Analyze</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Recipient Address *</label>
                    <input
                      type="text"
                      value={fraudInput.recipient}
                      onChange={(e) => setFraudInput({...fraudInput, recipient: e.target.value})}
                      placeholder="0x..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Amount *</label>
                    <input
                      type="number"
                      value={fraudInput.amount}
                      onChange={(e) => setFraudInput({...fraudInput, amount: e.target.value})}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={fraudInput.description}
                      onChange={(e) => setFraudInput({...fraudInput, description: e.target.value})}
                      placeholder="Service description..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={fraudInput.dueDate}
                      onChange={(e) => setFraudInput({...fraudInput, dueDate: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleFraudCheck}
                    disabled={!isConnected || !fraudInput.recipient || !fraudInput.amount || isLoading}
                    className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Shield className="w-4 h-4" /> Analyze (0.025 PAS)</>
                    )}
                  </button>
                </div>
              </div>

              {/* Fraud Result */}
              {fraudResult && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className={`p-4 border-b border-zinc-800 ${getRiskColor(fraudResult.analysis.riskLevel)}`}>
                    <div className="flex items-center gap-3">
                      {getRiskIcon(fraudResult.analysis.riskLevel)}
                      <div>
                        <span className="font-medium text-white capitalize">
                          {fraudResult.analysis.riskLevel} Risk
                        </span>
                        <span className="text-sm text-zinc-400 ml-2">
                          Score: {fraudResult.analysis.riskScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Recommendation */}
                    <div className="p-4 bg-zinc-950 rounded-xl">
                      <p className="text-sm text-zinc-300">{fraudResult.analysis.recommendation}</p>
                    </div>

                    {/* Risk Factors */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Risk Factors</h4>
                      <div className="space-y-2">
                        {fraudResult.analysis.factors.map((factor: any, idx: number) => (
                          <div key={idx} className="p-3 bg-zinc-950 rounded-lg flex items-start gap-3">
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                              factor.severity === "high" ? "bg-red-500/20 text-red-400" :
                              factor.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-zinc-700 text-zinc-300"
                            }`}>
                              {factor.severity}
                            </div>
                            <div>
                              <p className="text-sm text-white">{factor.factor}</p>
                              <p className="text-xs text-zinc-500">{factor.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 mt-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Not connected */}
          {!isConnected && (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">Connect your wallet to use AI services</p>
              <ConnectButton />
            </div>
          )}

          {/* How it works */}
          <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              How x402 AI Services Work
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-950 rounded-xl">
                <div className="text-2xl font-bold text-zinc-800 mb-2">01</div>
                <p className="text-sm text-white font-medium">Enter Request</p>
                <p className="text-xs text-zinc-500">Describe your invoice or paste details to check</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-xl">
                <div className="text-2xl font-bold text-zinc-800 mb-2">02</div>
                <p className="text-sm text-white font-medium">Sign Payment</p>
                <p className="text-xs text-zinc-500">Approve the x402 payment in your wallet</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-xl">
                <div className="text-2xl font-bold text-zinc-800 mb-2">03</div>
                <p className="text-sm text-white font-medium">Get Results</p>
                <p className="text-xs text-zinc-500">AI processes your request instantly</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
