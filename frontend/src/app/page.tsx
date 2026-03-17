import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Globe, Coins, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">Vaultstone</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it works</a>
            <a href="https://github.com/tufstraka/vaultstone" className="text-sm text-zinc-400 hover:text-white transition-colors">GitHub</a>
          </div>
          
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-zinc-400 font-medium">Live on Polkadot Hub TestNet</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Cross-chain invoicing for the modern web
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              Create invoices as NFTs. Accept payments from any Polkadot parachain. 
              Automatic splits, instant settlement, zero complexity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Start Creating
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]"></div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-6 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            {[
              { value: "6+", label: "Supported Chains" },
              { value: "<1s", label: "Settlement Time" },
              { value: "10", label: "Max Recipients" },
              { value: "1%", label: "Platform Fee" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{item.value}</div>
                <div className="text-sm text-zinc-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-sm text-emerald-500 font-medium mb-4 block">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for<br />cross-chain payments
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              title="Native XCM Support"
              description="Accept payments from Moonbeam, Astar, Acala, and more. True cross-chain, no bridges needed."
            />
            <FeatureCard
              icon={<FileText className="w-5 h-5" />}
              title="NFT Invoices"
              description="Every invoice is an ERC721 token you own. Transfer, trade, or use as collateral."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Payment Splitting"
              description="Split payments among up to 10 recipients automatically. Perfect for teams."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="Instant Settlement"
              description="Funds distribute immediately on payment. No delays, no manual intervention."
            />
            <FeatureCard
              icon={<Coins className="w-5 h-5" />}
              title="Multi-Currency"
              description="Accept DOT, USDT, USDC, or any ERC20 token your clients prefer."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="x402 Protocol"
              description="Machine-to-machine payments via HTTP 402. Perfect for APIs and AI agents."
              href="/x402"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-sm text-emerald-500 font-medium mb-4 block">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Three steps to get paid
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Invoice",
                description: "Set amount, recipient, due date, and optional payment splits. Your invoice mints as an NFT.",
              },
              {
                step: "02", 
                title: "Share Link",
                description: "Send the payment link to your client. They can pay from any supported Polkadot parachain.",
              },
              {
                step: "03",
                title: "Get Paid",
                description: "XCM routes the payment automatically. Funds split on-chain. You receive instantly.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-zinc-900 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to simplify your invoicing?
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Create your first cross-chain invoice in under a minute.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Launch App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xs">V</span>
              </div>
              <span className="text-sm text-zinc-400">Vaultstone</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://github.com/tufstraka/vaultstone" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://blockscout-testnet.polkadot.io/address/0xACab029d30244398EDB2a60E951404C07A5FdeC6" className="hover:text-white transition-colors">Contract</a>
              <span className="text-zinc-700">|</span>
              <span>Polkadot Hackathon 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href?: string }) {
  const content = (
    <div className={`p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      {href && (
        <p className="text-sm text-emerald-500 mt-3 flex items-center gap-1">
          Try demo <ArrowRight className="w-3 h-3" />
        </p>
      )}
    </div>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
