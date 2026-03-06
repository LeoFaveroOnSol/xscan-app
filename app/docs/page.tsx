import Link from 'next/link';
import { ArrowRight, Zap, Users, BarChart3, Shield } from 'lucide-react';

export default function DocsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          Documentation
        </div>
        <h1 className="text-4xl font-bold mb-4">Welcome to XSCAN</h1>
        <p className="text-xl text-muted-foreground">
          The most comprehensive platform for tracking crypto KOL performance on Twitter/X.
        </p>
      </div>

      {/* What is XSCAN */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What is XSCAN?</h2>
        <p className="text-muted-foreground mb-4">
          XSCAN is a transparency platform designed to bring accountability to the crypto influencer space.
          We automatically track tweets from Key Opinion Leaders (KOLs), detect when they share token
          contract addresses, and monitor the performance of those tokens over time.
        </p>
        <p className="text-muted-foreground">
          Our goal is simple: help traders make informed decisions by providing verified, on-chain
          performance data for crypto influencers. No more guessing whether a KOL actually makes
          profitable calls.
        </p>
      </section>

      {/* Quick Links */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/docs/how-it-works"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                How It Works
              </h3>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Learn how we track KOLs and calculate their performance metrics.
            </p>
          </Link>

          <Link
            href="/docs/getting-listed"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-success" />
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Getting Listed
              </h3>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Apply to become a verified KOL on XSCAN.
            </p>
          </Link>

          <Link
            href="/docs/token"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                $XSCAN Token
              </h3>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Learn about our native token and its utility.
            </p>
          </Link>

          <Link
            href="/docs/side-wallets"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Side Wallet Detection
              </h3>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              How we protect users from insider trading.
            </p>
          </Link>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Real-Time Tweet Monitoring</h3>
              <p className="text-muted-foreground text-sm">
                We scan tweets every 5 minutes to detect new calls from monitored KOLs.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">On-Chain Verification</h3>
              <p className="text-muted-foreground text-sm">
                All performance data is verified against actual on-chain token prices.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">ATH Tracking</h3>
              <p className="text-muted-foreground text-sm">
                We track the All-Time High of each call to show true potential returns.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">4</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Transparent Leaderboard</h3>
              <p className="text-muted-foreground text-sm">
                Rankings based on winrate, average multiplier, and best calls.
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Credit */}
      <div className="mt-12 pt-8 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          Built by{' '}
          <a href="https://x.com/leofaveroo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">@leofaveroo</a>
        </p>
      </div>
    </div>
  );
}
