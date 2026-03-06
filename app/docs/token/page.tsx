import { Coins, Flame, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import TokenUsage from '@/components/token/TokenUsage';
import Roadmap from '@/components/token/Roadmap';

export default function TokenPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#111113] to-[#0d0d0e] p-8 md:p-12">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-[80px]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <Coins className="w-4 h-4" />
              Token
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              {/* Token Logo */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-[0_0_40px_rgba(0,255,136,0.3)]">
                <span className="text-4xl font-bold text-black">X</span>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">$XSCAN</h1>
                <p className="text-xl text-muted-foreground">
                  The native token powering the XSCAN ecosystem
                </p>
              </div>
            </div>

            {/* Token Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                <p className="text-xl font-bold">1B</p>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                <p className="text-xs text-muted-foreground mb-1">Chain</p>
                <p className="text-xl font-bold">Solana</p>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-xl font-bold text-primary">Live 🟢</p>
              </div>
            </div>

            {/* Contract Address */}
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04] mb-6">
              <p className="text-xs text-muted-foreground mb-2">Contract Address</p>
              <code className="text-sm sm:text-base font-mono text-primary break-all select-all">
                5ZsM9k7DYo6Gi2ARjBUqwoPY24nV1r5FoPUozjk9pump
              </code>
            </div>

            {/* Buy Button */}
            <div className="flex flex-wrap gap-3">
              <a
                href="https://axiom.trade/t/5ZsM9k7DYo6Gi2ARjBUqwoPY24nV1r5FoPUozjk9pump"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Buy on Axiom
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://pump.fun/coin/5ZsM9k7DYo6Gi2ARjBUqwoPY24nV1r5FoPUozjk9pump"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all border border-white/10"
              >
                View on Pump.fun
              </a>
              <a
                href="https://dexscreener.com/solana/5ZsM9k7DYo6Gi2ARjBUqwoPY24nV1r5FoPUozjk9pump"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all border border-white/10"
              >
                Chart
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Token Usage Section */}
      <TokenUsage />

      {/* Auto Buyback & Burn */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Auto Buyback & Burn</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Deflationary tokenomics</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-orange-500 mb-2">15%</div>
            <p className="text-muted-foreground">of Creator Fees</p>
          </div>

          <p className="text-muted-foreground mb-6 text-center max-w-2xl mx-auto">
            XSCAN automatically allocates <strong className="text-white">15% of all creator fees</strong> generated
            on the platform to buyback $XSCAN tokens from the open market. These tokens are then
            permanently burned, reducing the total supply over time.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
              <div className="w-2 h-2 rounded-full bg-orange-500 mb-3" />
              <p className="font-semibold mb-1">Automatic Execution</p>
              <p className="text-sm text-muted-foreground">
                Buybacks happen automatically as fees are collected.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
              <div className="w-2 h-2 rounded-full bg-orange-500 mb-3" />
              <p className="font-semibold mb-1">Permanent Burns</p>
              <p className="text-sm text-muted-foreground">
                Tokens are sent to a burn address, forever removed.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
              <div className="w-2 h-2 rounded-full bg-orange-500 mb-3" />
              <p className="font-semibold mb-1">On-Chain Transparency</p>
              <p className="text-sm text-muted-foreground">
                All transactions verifiable on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.15)]">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">How the Burn Works</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Step by step process</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-8">
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-primary via-primary/50 to-orange-500" />

            <div className="space-y-8">
              {[
                { num: 1, title: 'Fee Collection', desc: 'Creator fees are collected when KOLs or the platform generates revenue.' },
                { num: 2, title: '15% Allocation', desc: '15% of collected fees are automatically allocated to the buyback pool.' },
                { num: 3, title: 'Market Buyback', desc: 'Funds are used to buy $XSCAN tokens from decentralized exchanges.' },
                { num: 4, title: 'Permanent Burn', desc: 'Purchased tokens are sent to a burn address, permanently reducing supply.', isBurn: true },
              ].map((step) => (
                <div key={step.num} className="relative pl-12">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.isBurn ? 'bg-orange-500' : 'bg-primary'
                  }`}>
                    {step.isBurn ? (
                      <Flame className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-black font-bold text-sm">{step.num}</span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <Roadmap />

      {/* Next Page */}
      <div className="pt-8 border-t border-white/[0.06]">
        <Link
          href="/docs/tokenomics"
          className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#111113] hover:border-primary/30 transition-all"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Tokenomics
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
