import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-primary">Vaultstone</span>
              <br />
              <span className="text-foreground">Cross-Chain Invoice Platform</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Create invoices on Polkadot Hub, get paid from any chain. 
              NFT-based invoices with automatic payment splitting and cross-chain support.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Launch App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Vaultstone?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for the future of cross-chain payments
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="NFT Invoices"
              description="Every invoice is an NFT you own. Transferable, verifiable, and permanent on-chain."
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Cross-Chain Payments"
              description="Accept payments from any Polkadot parachain via XCM. One invoice, multiple payment options."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Instant Splitting"
              description="Automatically split payments among multiple recipients. Perfect for teams and collaborations."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure & Audited"
              description="Built with OpenZeppelin contracts. Battle-tested security for your business."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Create Invoice"
              description="Fill in the details, set payment splits, and mint your invoice as an NFT."
            />
            <StepCard
              step="2"
              title="Share Link"
              description="Send the payment link to your client. They can pay from any supported chain."
            />
            <StepCard
              step="3"
              title="Get Paid"
              description="Payments are automatically distributed to all recipients. No manual work needed."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the future of cross-chain invoicing on Polkadot Hub.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Your First Invoice
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold text-primary">Vaultstone</div>
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            Built for Polkadot Solidity Hackathon 2026
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
    <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
