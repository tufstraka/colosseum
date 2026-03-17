import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Globe, Coins, Users, Lock, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section - Dark & Mysterious */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        {/* Subtle dark patterns */}
        <div className="absolute inset-0 -z-10">
          {/* Minimal accent glow */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.02]">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id="darkgrid" width="4" height="4" patternUnits="userSpaceOnUse">
                  <path d="M 4 0 L 0 0 0 4" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#darkgrid)" />
            </svg>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Subtle badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-400">Powered by Polkadot XCM</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
              <span className="block text-white">Cross-Chain</span>
              <span className="block text-white">Invoicing</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                Simplified
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-12 max-w-2xl mx-auto">
              Create NFT invoices. Accept payments from any Polkadot parachain.
              <br className="hidden sm:block" />
              No bridges. No complexity. Just works.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-white text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                Launch App
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Minimal */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "6+", label: "Parachains" },
              { value: "<1s", label: "XCM Speed" },
              { value: "10", label: "Payment Splits" },
              { value: "1%", label: "Platform Fee" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Dark Cards */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-gray-400 mb-4">
              Core Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for Polkadot
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Native XCM integration. No compromises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="True Cross-Chain"
              description="Accept payments from Moonbeam, Astar, Acala—any Polkadot parachain via XCM."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="NFT Invoices"
              description="Every invoice is an ERC721 NFT. Own it, transfer it, use it as collateral."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Payment Splits"
              description="Automatically split payments among up to 10 recipients on-chain."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Settlement"
              description="Payments distribute automatically. No delays, no manual work."
            />
            <FeatureCard
              icon={<Coins className="h-6 w-6" />}
              title="Multi-Currency"
              description="Accept DOT, USDT, USDC, or any ERC20 token your clients prefer."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Battle-Tested"
              description="OpenZeppelin contracts with AccessControl and ReentrancyGuard."
            />
          </div>
        </div>
      </section>

      {/* How It Works - Minimal */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-400">Three steps to get paid</p>
          </div>
          
          <div className="space-y-12">
            {[
              {
                num: "01",
                title: "Create Invoice",
                desc: "Set recipient, amount, splits. Mint your invoice NFT.",
              },
              {
                num: "02",
                title: "Share Link",
                desc: "Client pays from any Polkadot parachain they prefer.",
              },
              {
                num: "03",
                title: "Get Paid",
                desc: "XCM routes funds automatically. Splits happen on-chain.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">{step.num}</span>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Understated */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl p-12 lg:p-16 text-center overflow-hidden">
            {/* Subtle accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Start?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Create your first cross-chain invoice in under a minute.
              </p>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold bg-white text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
              
              <p className="text-sm text-gray-500 mt-6">
                No signup required • Connect wallet to begin
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Lock className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">OpenZeppelin Security</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">24/24 Tests Passing</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Globe className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">Native XCM Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">V</span>
              </div>
              <div>
                <p className="text-base font-semibold">Vaultstone</p>
                <p className="text-xs text-gray-500">Cross-Chain Invoicing</p>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="https://github.com/tufstraka/vaultstone" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://dorahacks.io/hackathon/polkadot-solidity-hackathon/" className="hover:text-white transition-colors">
                Hackathon
              </a>
              <a href="https://blockscout-testnet.polkadot.io/address/0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797" className="hover:text-white transition-colors">
                Contract
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Built for Polkadot Solidity Hackathon 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
      <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mb-4 text-gray-400 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
