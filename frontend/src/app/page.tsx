import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Globe, Coins, Users, Sparkles, CheckCircle, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Hero Section - Asymmetric Design */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        {/* Custom Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <svg className="w-full h-full opacity-5" viewBox="0 0 100 100">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm mb-8">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-medium">Powered by Polkadot XCM</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="block">Invoice</span>
                <span className="block text-primary">Any Chain</span>
                <span className="block">Everywhere</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Create NFT invoices once. Accept payments from Moonbeam, Astar, Acala—any Polkadot parachain. 
                No bridges. No swaps. Pure XCM magic.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-primary/30"
                >
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-border hover:border-primary/50 rounded-2xl transition-all"
                >
                  See How It Works
                </Link>
              </div>
            </div>
            
            {/* Right Column - Floating Card */}
            <div className="relative">
              <div className="relative bg-card border-2 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl flex items-center justify-center transform rotate-12">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Invoice #1337</p>
                      <p className="text-sm text-muted-foreground">Design Services</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-border" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-mono font-semibold">500 DOT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment From</span>
                      <span className="font-semibold text-purple-600">Moonbeam</span>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Paid via XCM
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-1">6+</p>
              <p className="text-sm text-muted-foreground">Parachains</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-1">&lt;1s</p>
              <p className="text-sm text-muted-foreground">XCM Transfer</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-1">10</p>
              <p className="text-sm text-muted-foreground">Payment Splits</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-1">1%</p>
              <p className="text-sm text-muted-foreground">Platform Fee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Cards Layout */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built Different
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Not your average invoice platform. We&apos;re Polkadot-native, XCM-powered, and actually useful.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Globe className="h-7 w-7" />}
              title="True Cross-Chain"
              description="Accept payments via XCM from Moonbeam, Astar, Acala—any Polkadot parachain. No bridges, no swaps, no hassle."
              accent="primary"
              featured
            />
            <FeatureCard
              icon={<FileText className="h-7 w-7" />}
              title="NFT Invoices"
              description="Every invoice is an ERC721 NFT you own. Transfer it, use it as collateral, or keep it forever."
              accent="purple"
            />
            <FeatureCard
              icon={<Users className="h-7 w-7" />}
              title="Payment Splits"
              description="Automatically split payments among up to 10 recipients. Perfect for teams, agencies, and collaborations."
              accent="green"
            />
            <FeatureCard
              icon={<Zap className="h-7 w-7" />}
              title="Instant Settlement"
              description="Payments distribute automatically to all recipients. No delays, no manual intervention, no waiting."
              accent="orange"
            />
            <FeatureCard
              icon={<Coins className="h-7 w-7" />}
              title="Multi-Currency"
              description="Accept DOT, USDT, USDC, or any ERC20 token. Let your clients pay however they prefer."
              accent="cyan"
            />
            <FeatureCard
              icon={<Shield className="h-7 w-7" />}
              title="Battle-Tested"
              description="Built with OpenZeppelin contracts. AccessControl, ReentrancyGuard, Pausable—security first."
              accent="red"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Timeline Style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Three steps to cross-chain invoicing</p>
          </div>
          
          <div className="space-y-8">
            <StepCard
              number="1"
              title="Create Invoice"
              description="Fill in the details, add recipients, set payment splits. Your invoice mints as an NFT you own. Takes 30 seconds."
              color="primary"
            />
            <StepCard
              number="2"
              title="Share Link"
              description="Send the payment link to your client. They can pay from any Polkadot parachain using their preferred wallet."
              color="purple"
            />
            <StepCard
              number="3"
              title="Get Paid"
              description="XCM routes the funds automatically. Payment splits happen on-chain. You get paid, they get a receipt. Everyone's happy."
              color="green"
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Bold */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-3xl p-12 lg:p-16 text-center text-white overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Ready to start?</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Stop Waiting. Start Invoicing.
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join the future of cross-chain payments. Create your first invoice in under a minute.
              </p>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-primary bg-white hover:bg-white/90 rounded-2xl transition-all hover:scale-105 shadow-2xl"
              >
                Create Your First Invoice
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">V</span>
              </div>
              <div>
                <p className="text-lg font-bold">Vaultstone</p>
                <p className="text-xs text-muted-foreground">Cross-Chain Invoicing</p>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <a href="https://github.com/tufstraka/vaultstone" className="hover:text-primary transition-colors">
                GitHub
              </a>
              <a href="https://dorahacks.io/hackathon/polkadot-solidity-hackathon/" className="hover:text-primary transition-colors">
                Hackathon
              </a>
              <a href="https://blockscout-testnet.polkadot.io/address/0xE28a1b108B07C9Cfa4636165Ee7cA3927ee17797" className="hover:text-primary transition-colors">
                Contract
              </a>
            </div>
            
            <p className="text-sm text-muted-foreground">
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
  accent,
  featured = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  featured?: boolean;
}) {
  const accentColors = {
    primary: "from-primary/20 to-primary/5 border-primary/30 hover:border-primary/50",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50",
    green: "from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/50",
    orange: "from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/50",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50",
    red: "from-red-500/20 to-red-500/5 border-red-500/30 hover:border-red-500/50",
  };

  return (
    <div className={`relative p-6 rounded-2xl border bg-gradient-to-br ${accentColors[accent as keyof typeof accentColors]} transition-all hover:shadow-lg hover:-translate-y-1 ${featured ? 'md:col-span-2 lg:col-span-1' : ''}`}>
      {featured && (
        <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
          Popular
        </div>
      )}
      
      <div className="w-14 h-14 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    primary: "bg-primary text-primary-foreground",
    purple: "bg-purple-600 text-white",
    green: "bg-green-600 text-white",
  };

  return (
    <div className="flex gap-6 items-start">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center text-xl font-bold shadow-lg`}>
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
