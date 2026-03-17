import Link from "next/link";
import { ArrowRight, Shield, DollarSign, Brain, Lock, Globe, Dna, Database, Users, TrendingUp, Zap, Eye } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Genome Vault</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/vault" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/vault/explore" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Explore Data
            </Link>
            <Link
              href="/vault"
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8">
            <Shield className="w-4 h-4" />
            Built on Polkadot Hub — Your Data, Your Profit
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your DNA is Worth
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">
              Billions.
            </span>
            <br />
            <span className="text-zinc-500 text-3xl md:text-5xl">Get Your Cut.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10">
            Pharma companies profit $4.5B/year from your genomic data — and you get nothing. 
            Genome Vault lets you encrypt, list, and <strong className="text-white">sell access</strong> to 
            your own health data. AI strips your identity. Smart contracts handle the money.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/vault"
              className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-5 h-5" />
              List My Data
            </Link>
            <Link
              href="/vault/explore"
              className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Explore as Researcher
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <StatBlock value="$4.5B" label="Genomics Market" />
            <StatBlock value="$0" label="Patients Get Today" />
            <StatBlock value="2.5%" label="Platform Fee" />
            <StatBlock value="97.5%" label="Goes to You" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Three steps. Full control. Real money.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="01"
              icon={<Lock className="w-6 h-6" />}
              title="Upload & Encrypt"
              description="Upload your genomic data (23andMe, Ancestry, medical records). It's encrypted client-side and stored on IPFS. Only you hold the keys."
            />
            <StepCard
              step="02"
              icon={<DollarSign className="w-6 h-6" />}
              title="Set Your Price"
              description="Choose how much per query. Set access windows (1 hour, 1 day, 1 week). Tag your data (ethnicity, conditions, age range) to attract the right buyers."
            />
            <StepCard
              step="03"
              icon={<Brain className="w-6 h-6" />}
              title="AI Anonymizes, You Profit"
              description="When a researcher pays, our AI agent strips all identifying information before releasing the data. You get paid directly via smart contract. USDC or PAS."
            />
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Patients */}
            <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">For Patients</h3>
              <ul className="space-y-3">
                <BulletPoint text="Own your genomic data — not hospitals, not 23andMe" />
                <BulletPoint text="Earn passive income from your biology" />
                <BulletPoint text="Revoke consent anytime — your data, your rules" />
                <BulletPoint text="AI anonymization protects your identity" />
                <BulletPoint text="No crypto needed — gasless uploads via 0xGasless" />
              </ul>
            </div>

            {/* For Researchers */}
            <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">For Researchers</h3>
              <ul className="space-y-3">
                <BulletPoint text="Access diverse, consent-verified genomic datasets" color="purple" />
                <BulletPoint text="Filter by condition, ethnicity, age, data type" color="purple" />
                <BulletPoint text="Pay per query — no long-term contracts" color="purple" />
                <BulletPoint text="AI-verified data quality and anonymization" color="purple" />
                <BulletPoint text="Clinical trial recruitment — reach real patients" color="purple" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Categories */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Supported Data Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CategoryCard icon="🧬" name="Whole Genome" />
            <CategoryCard icon="🔬" name="Exome" />
            <CategoryCard icon="📊" name="SNP Array" />
            <CategoryCard icon="🦠" name="Microbiome" />
            <CategoryCard icon="🧪" name="Epigenetic" />
            <CategoryCard icon="💊" name="Clinical Trials" />
            <CategoryCard icon="🏥" name="Health Records" />
            <CategoryCard icon="📷" name="Medical Imaging" />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Powered By</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <TechCard
              icon={<Globe className="w-6 h-6" />}
              title="Polkadot Hub"
              description="USDC micropayments on Polkadot's EVM chain"
            />
            <TechCard
              icon={<Lock className="w-6 h-6" />}
              title="IPFS"
              description="Decentralized encrypted data storage"
            />
            <TechCard
              icon={<Brain className="w-6 h-6" />}
              title="Amazon Bedrock"
              description="AI anonymization via Claude 3"
            />
            <TechCard
              icon={<Zap className="w-6 h-6" />}
              title="0xGasless"
              description="No gas fees for patients"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Stop Giving Away Your Data for Free
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Every time you take a DNA test, hospitals and research institutions profit. It's time to flip the model.
          </p>
          <Link
            href="/vault"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Start Earning from Your Data
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-zinc-400">Genome Vault — Polkadot Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="https://github.com/tufstraka/vaultstone" className="hover:text-white transition-colors">GitHub</a>
            <a href={`https://blockscout-testnet.polkadot.io/address/0xf06D3239C41b1Db423779987B35a705dd8766D3a`} className="hover:text-white transition-colors">Contract</a>
            <span className="text-zinc-700">Chain: Polkadot Hub TestNet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
      <div className="text-5xl font-bold text-zinc-800 mb-4">{step}</div>
      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function BulletPoint({ text, color = "emerald" }: { text: string; color?: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${color === "purple" ? "bg-purple-500" : "bg-emerald-500"}`} />
      <span className="text-sm text-zinc-300">{text}</span>
    </li>
  );
}

function CategoryCard({ icon, name }: { icon: string; name: string }) {
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center hover:border-zinc-700 transition-colors">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-zinc-300">{name}</div>
    </div>
  );
}

function TechCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}
