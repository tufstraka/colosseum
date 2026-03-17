import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Globe, Coins, Users, Link2, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8">
              <Globe className="h-4 w-4" />
              Powered by Polkadot XCM
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Cross-Chain
              </span>
              <br />
              <span className="text-foreground">Invoice Platform</span>
            </h1>
            
            <p className="mt-8 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Create NFT invoices on Polkadot Hub. Accept payments from 
              <span className="text-foreground font-semibold"> any parachain</span>—
              Moonbeam, Astar, Acala, and more.
            </p>
            
            {/* Supported Chains */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["Polkadot Hub", "Moonbeam", "Astar", "Acala", "Asset Hub"].map((chain) => (
                <span key={chain} className="px-3 py-1 rounded-full bg-secondary text-sm font-medium">
                  {chain}
                </span>
              ))}
            </div>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Launch App
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="6+" label="Parachains Supported" />
            <StatCard value="<1s" label="XCM Transfer Time" />
            <StatCard value="10" label="Max Payment Splits" />
            <StatCard value="1%" label="Platform Fee" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Why <span className="text-primary">Vaultstone</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The only invoice platform built natively for the Polkadot ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="True Cross-Chain"
              description="Accept payments via XCM from any Polkadot parachain. Your invoice lives on Hub, but payments flow from anywhere."
              highlight
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="NFT Invoices"
              description="Every invoice is an ERC721 NFT. Own it, transfer it, use it as collateral—your invoice, your asset."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Payment Splitting"
              description="Split payments automatically among up to 10 recipients. Perfect for teams, agencies, and collaborations."
            />
            <FeatureCard
              icon={<Coins className="h-8 w-8" />}
              title="Multi-Currency"
              description="Accept DOT, USDT, USDC, or any ERC20 token. Let your clients pay however they prefer."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Battle-Tested Security"
              description="Built with OpenZeppelin contracts—AccessControl, ReentrancyGuard, and Pausable for maximum safety."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Instant Settlement"
              description="Payments distribute automatically to all recipients. No delays, no manual intervention."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three steps to cross-chain invoicing</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              step="1"
              title="Create Invoice"
              description="Fill in the details, set payment splits, add recipients. Your invoice mints as an NFT you own."
              features={["Set any amount", "Choose currency", "Add up to 10 splits"]}
            />
            <StepCard
              step="2"
              title="Share Payment Link"
              description="Send the shareable link to your client. They connect from any supported parachain."
              features={["One click share", "Mobile friendly", "QR code support"]}
            />
            <StepCard
              step="3"
              title="Get Paid Cross-Chain"
              description="Client pays from their preferred chain. XCM routes the funds to you automatically."
              features={["Instant distribution", "Auto-split payments", "On-chain receipt"]}
            />
          </div>
        </div>
      </section>

      {/* Cross-Chain Diagram */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">XCM Payment Flow</h2>
            <p className="text-lg text-muted-foreground">
              Powered by Polkadot&apos;s native cross-consensus messaging
            </p>
          </div>
          
          <div className="bg-card rounded-2xl border p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Source Chain */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌙</span>
                </div>
                <p className="font-semibold">Moonbeam</p>
                <p className="text-sm text-muted-foreground">Payer&apos;s Chain</p>
              </div>
              
              {/* Arrow */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 lg:w-32 bg-gradient-to-r from-pink-500 to-primary rounded" />
                  <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium text-primary">XCM</span>
                  </div>
                  <div className="h-1 w-16 lg:w-32 bg-gradient-to-r from-primary to-green-500 rounded" />
                </div>
              </div>
              
              {/* Destination */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-green-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⬡</span>
                </div>
                <p className="font-semibold">Polkadot Hub</p>
                <p className="text-sm text-muted-foreground">Invoice Contract</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">1. WithdrawAsset</p>
                <p className="text-muted-foreground">Reserve assets on source</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">2. ReserveTransfer</p>
                <p className="text-muted-foreground">Route via relay chain</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">3. DepositAsset</p>
                <p className="text-muted-foreground">Distribute to recipients</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built With Best Practices</h2>
            <p className="text-lg text-muted-foreground">Enterprise-grade technology stack</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Solidity", desc: "Smart Contracts" },
              { name: "OpenZeppelin", desc: "Security Standards" },
              { name: "Foundry", desc: "Testing & Deploy" },
              { name: "XCM Precompile", desc: "Cross-Chain" },
              { name: "Next.js 15", desc: "Frontend" },
              { name: "wagmi", desc: "Web3 Hooks" },
              { name: "Tailwind", desc: "Styling" },
              { name: "TypeScript", desc: "Type Safety" },
            ].map((tech) => (
              <div key={tech.name} className="p-4 rounded-xl bg-card border text-center hover:shadow-md transition-shadow">
                <p className="font-semibold">{tech.name}</p>
                <p className="text-sm text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Go Cross-Chain?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Create your first invoice and experience the future of Web3 payments.
            </p>
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center px-10 py-5 text-xl font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Create Your First Invoice
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">V</span>
              </div>
              <span className="text-xl font-bold">Vaultstone</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built for Polkadot Solidity Hackathon 2026 • Track 1: EVM Smart Contract
            </div>
            <div className="flex gap-4 text-sm">
              <a href="https://github.com/tufstraka/vaultstone" className="hover:text-primary transition-colors">
                GitHub
              </a>
              <a href="https://dorahacks.io/hackathon/polkadot-solidity-hackathon/" className="hover:text-primary transition-colors">
                Hackathon
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
      highlight 
        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" 
        : "bg-card hover:border-primary/20"
    }`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
        highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
      }`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  features,
}: {
  step: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="relative p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
      <div className="absolute -top-4 left-8">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center shadow-lg">
          {step}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
