"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/connect-button";
import { X402Paywall, X402PaymentSuccess } from "@/components/x402/paywall";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Zap,
  Lock,
  CheckCircle,
  FileText,
  Activity
} from "lucide-react";

// Payment requirement for this demo
const PAYMENT_REQUIREMENTS = [
  {
    scheme: "exact",
    network: "polkadot-hub-testnet",
    maxAmountRequired: "10000000000000000", // 0.01 PAS
    resource: "/api/x402/invoice-data",
    description: "Access premium invoice analytics",
    mimeType: "application/json",
    payTo: "0x25D1F4647d6eA54fd7C6Dc07933e4CdCc0B5d129",
    maxTimeoutSeconds: 300,
    asset: "PAS",
  },
];

interface AnalyticsData {
  totalInvoicesCreated: number;
  totalVolume: string;
  volumeUnit: string;
  averageInvoiceAmount: string;
  topPaymentMethods: { method: string; percentage: number }[];
  recentActivity: { type: string; count: number; period: string }[];
  networkStats: Record<string, { invoices: number; volume: string }>;
  generatedAt: string;
}

export default function X402DemoPage() {
  const { isConnected } = useAccount();
  const [isPaid, setIsPaid] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const handlePaymentSuccess = (response: any) => {
    setIsPaid(true);
    setAnalyticsData(response.data);
    setPaymentInfo(response.payment);
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
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-sm mb-4">
              <Zap className="w-4 h-4" />
              x402 Protocol Demo
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Premium Invoice Analytics
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Access real-time invoice statistics and network analytics. 
              This endpoint is protected by the <strong className="text-white">x402 payment protocol</strong> - 
              pay 0.01 PAS to unlock the data.
            </p>
          </div>

          {/* What is x402 */}
          <div className="mb-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              What is x402?
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              x402 is an open protocol for internet-native payments using HTTP 402 status codes. 
              It enables machine-to-machine payments, allowing APIs to require payment before returning data.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-950 rounded-xl">
                <Lock className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-white">Payment Required</p>
                <p className="text-xs text-zinc-500">Server returns HTTP 402 with payment details</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-xl">
                <FileText className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-white">Sign & Pay</p>
                <p className="text-xs text-zinc-500">Client signs payment authorization</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-xl">
                <CheckCircle className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-white">Access Granted</p>
                <p className="text-xs text-zinc-500">Server verifies payment, returns data</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {!isPaid ? (
            <div className="flex justify-center">
              <X402Paywall
                requirements={PAYMENT_REQUIREMENTS}
                resourceName="Invoice Analytics API"
                resourceDescription="Real-time statistics about invoices, payments, and cross-chain activity on Vaultstone."
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Payment Success */}
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-white">Payment Verified!</h3>
                </div>
                <p className="text-sm text-emerald-400">
                  Paid 0.01 PAS from {paymentInfo?.from?.slice(0, 8)}...{paymentInfo?.from?.slice(-6)}
                </p>
              </div>

              {/* Analytics Dashboard */}
              {analyticsData && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <StatCard
                      icon={<FileText className="w-5 h-5" />}
                      label="Total Invoices"
                      value={analyticsData.totalInvoicesCreated.toLocaleString()}
                    />
                    <StatCard
                      icon={<TrendingUp className="w-5 h-5" />}
                      label="Total Volume"
                      value={`${analyticsData.totalVolume} ${analyticsData.volumeUnit}`}
                    />
                    <StatCard
                      icon={<BarChart3 className="w-5 h-5" />}
                      label="Avg. Invoice"
                      value={`${analyticsData.averageInvoiceAmount} ${analyticsData.volumeUnit}`}
                    />
                  </div>

                  {/* Payment Methods */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="font-semibold text-white mb-4">Payment Methods</h3>
                    <div className="space-y-3">
                      {analyticsData.topPaymentMethods.map((method, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-zinc-300">{method.method}</span>
                              <span className="text-sm text-zinc-400">{method.percentage}%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${method.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Network Stats */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="font-semibold text-white mb-4">Network Distribution</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {Object.entries(analyticsData.networkStats).map(([network, stats]) => (
                        <div key={network} className="p-4 bg-zinc-950 rounded-xl">
                          <p className="text-sm font-medium text-white capitalize mb-2">{network}</p>
                          <p className="text-2xl font-bold text-white">{stats.invoices}</p>
                          <p className="text-xs text-zinc-500">{stats.volume} PAS volume</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Recent Activity (24h)
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {analyticsData.recentActivity.map((activity, idx) => (
                        <div key={idx} className="p-4 bg-zinc-950 rounded-xl">
                          <p className="text-sm text-zinc-400 capitalize">
                            {activity.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-2xl font-bold text-white">{activity.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Generated */}
                  <p className="text-center text-xs text-zinc-500">
                    Data generated at {new Date(analyticsData.generatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
        {icon}
      </div>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
