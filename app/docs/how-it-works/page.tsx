import { ArrowLeft, ArrowRight, Search, Zap, BarChart3, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          Guide
        </div>
        <h1 className="text-4xl font-bold mb-4">How XSCAN Works</h1>
        <p className="text-xl text-muted-foreground">
          A complete overview of our tracking and scoring system.
        </p>
      </div>

      {/* Process Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">The Tracking Process</h2>

        <div className="space-y-8">
          <div className="relative pl-12">
            <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Tweet Detection</h3>
            <p className="text-muted-foreground mb-3">
              Every 5 minutes, our system scans tweets from all monitored KOLs. We use pattern
              recognition to detect Solana contract addresses (CAs) in their tweets.
            </p>
            <div className="p-4 rounded-lg bg-card border border-border">
              <code className="text-sm text-primary">
                Example CA: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
              </code>
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Token Verification</h3>
            <p className="text-muted-foreground mb-3">
              When a CA is detected, we verify it's a valid Solana token and fetch its current
              market data from DexScreener. We check for minimum liquidity ($1,000) and market
              cap ($5,000) to filter out obvious scams.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
              <li>Token name and symbol</li>
              <li>Current price and market cap</li>
              <li>Liquidity depth</li>
              <li>24h trading volume</li>
            </ul>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Call Creation</h3>
            <p className="text-muted-foreground mb-3">
              A "call" is created in our database linking the KOL, token, tweet, and entry price.
              The entry market cap at the time of the tweet becomes the baseline for calculating
              all future multipliers.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">Entry Market Cap</p>
                <p className="font-semibold">$50,000</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">Monitoring Period</p>
                <p className="font-semibold">48 hours</p>
              </div>
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 w-8 h-8 rounded-full bg-success flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">4. Performance Tracking</h3>
            <p className="text-muted-foreground mb-3">
              Every 15 minutes, we update the price of all active calls. We track both the
              current price and the All-Time High (ATH) reached during the monitoring period.
            </p>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm">
                <strong className="text-success">Win Condition:</strong> A call is considered a
                "win" if it reaches 2x or more from the entry market cap at any point.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Explained */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Metrics Explained</h2>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-2">Winrate</h3>
            <p className="text-sm text-muted-foreground mb-2">
              The percentage of calls that reached 2x or more.
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              Winrate = (Winning Calls / Total Calls) × 100%
            </code>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-2">Average Multiplier</h3>
            <p className="text-sm text-muted-foreground mb-2">
              The mean ATH multiplier across all calls.
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              Avg Multi = Sum of ATH Multipliers / Total Calls
            </code>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-2">Best Multiplier</h3>
            <p className="text-sm text-muted-foreground">
              The highest ATH multiplier achieved by any single call. This represents the KOL's
              best-performing recommendation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-2">ATH (All-Time High)</h3>
            <p className="text-sm text-muted-foreground">
              The highest market cap a token reached during the monitoring period. This is used
              to calculate the ATH multiplier, giving credit for potential gains even if the
              token later dumps.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Link
          href="/docs"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm text-muted-foreground">Previous</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Introduction
            </p>
          </div>
        </Link>

        <Link
          href="/docs/getting-listed"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-right"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Getting Listed
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
