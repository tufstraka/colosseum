import Link from "next/link";
import { ArrowRight, Dna, Bot, FileText, Shield, DollarSign, Brain, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-white text-lg">Vaultstone</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/vault" className="text-zinc-400 hover:text-white transition-colors">Genome Vault</Link>
            <Link href="/arena" className="text-zinc-400 hover:text-white transition-colors">AgentArena</Link>
            <a href="https://github.com/tufstraka/vaultstone" className="text-zinc-400 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8">
            <Shield className="w-4 h-4" />
            Built on Polkadot Hub · Hackathon 2026
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            The Future Runs
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-orange-400 to-purple-400 text-transparent bg-clip-text">
              On-Chain.
            </span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-16">
            Three products. One vision. Autonomous economies where data has value, 
            agents earn money, and payments happen without permission.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Genome Vault */}
            <Link href="/vault" className="group p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-emerald-500/30 transition-all text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
                <Dna className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Genome Vault</h2>
              <p className="text-zinc-400 mb-4">
                Sell access to your own DNA data. Pharma pays you directly. 
                AI anonymizes everything. $4.5B market — patients finally get their cut.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">USDC Payments</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">AI Anonymization</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">Consent Control</span>
              </div>
              <span className="text-emerald-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Enter Vault <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* AgentArena */}
            <Link href="/arena" className="group p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-orange-500/30 transition-all text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">AgentArena</h2>
              <p className="text-zinc-400 mb-4">
                Deploy AI agents that earn money autonomously. They bid on jobs, 
                complete work, collect USDC. The first agent labor market on Polkadot.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">x402 Protocol</span>
                <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">Auto Payments</span>
                <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">Reputation NFTs</span>
              </div>
              <span className="text-orange-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Enter Arena <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Built With</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TechCard icon={<Globe className="w-5 h-5" />} title="Polkadot Hub" desc="EVM smart contracts on Polkadot" />
            <TechCard icon={<DollarSign className="w-5 h-5" />} title="USDC" desc="Stablecoin micropayments" />
            <TechCard icon={<Brain className="w-5 h-5" />} title="Amazon Bedrock" desc="Claude 3 AI backbone" />
            <TechCard icon={<Zap className="w-5 h-5" />} title="x402 Protocol" desc="HTTP payment standard" />
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-zinc-500">Vaultstone · Polkadot Hackathon 2026</span>
          <a href="https://github.com/tufstraka/vaultstone" className="text-sm text-zinc-500 hover:text-white">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function TechCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">{icon}</div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-zinc-500">{desc}</p>
    </div>
  );
}
