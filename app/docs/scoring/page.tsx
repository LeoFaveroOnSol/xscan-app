import { BarChart3, Trophy, Target, TrendingUp, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ScoringPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          Scoring
        </div>
        <h1 className="text-4xl font-bold mb-4">Scoring System</h1>
        <p className="text-xl text-muted-foreground">
          How we calculate and display KOL performance metrics.
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          XSCAN uses a straightforward, transparent scoring system based on actual on-chain
          token performance. We don't use complex algorithms or hidden factors - what you see
          is what you get.
        </p>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm">
            <strong className="text-primary">Key Principle:</strong> A "win" is defined as a call
            that reaches 2x or more from the entry market cap at any point during the monitoring period.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Core Metrics</h2>

        <div className="space-y-6">
          {/* Winrate */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Winrate</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The percentage of calls that achieved at least a 2x return from entry market cap.
            </p>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-mono">
                Winrate = (Winning Calls / Total Calls) × 100%
              </p>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 rounded-lg bg-success/10">
                <p className="font-bold text-success">70%+</p>
                <p className="text-xs text-muted-foreground">Elite</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <p className="font-bold text-primary">50-69%</p>
                <p className="text-xs text-muted-foreground">Good</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <p className="font-bold text-yellow-500">30-49%</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div className="p-2 rounded-lg bg-danger/10">
                <p className="font-bold text-danger">&lt;30%</p>
                <p className="text-xs text-muted-foreground">Poor</p>
              </div>
            </div>
          </div>

          {/* Average Multiplier */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Average Multiplier</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The mean ATH (All-Time High) multiplier across all of a KOL's calls. This shows
              the average potential return of following their calls.
            </p>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-mono">
                Avg Multiplier = Sum of all ATH Multipliers / Total Calls
              </p>
            </div>
            <div className="mt-4 p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> If a KOL has 3 calls with ATH multipliers of 3x, 5x, and 2x,
                their average multiplier is (3+5+2)/3 = 3.33x
              </p>
            </div>
          </div>

          {/* Best Multiplier */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold">Best Multiplier</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The highest ATH multiplier achieved by any single call from that KOL. This represents
              their absolute best-performing recommendation.
            </p>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm">
                A high best multiplier shows a KOL can identify exceptional opportunities, even if
                their average performance is lower.
              </p>
            </div>
          </div>

          {/* Total Calls */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold">Total Calls</h3>
            </div>
            <p className="text-muted-foreground">
              The total number of calls tracked for that KOL. More calls generally mean more
              reliable statistics. A KOL with 100 calls and 60% winrate is more proven than
              one with 5 calls and 80% winrate.
            </p>
          </div>
        </div>
      </section>

      {/* How ATH is Tracked */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How ATH is Tracked</h2>
        <p className="text-muted-foreground mb-4">
          We use ATH (All-Time High) rather than current price because crypto tokens are
          extremely volatile. A token might 10x and then dump - the ATH captures that potential
          return even if you didn't sell at the perfect moment.
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>ATH is tracked for 48 hours after the call is made</li>
          <li>Price updates happen every 15 minutes</li>
          <li>The highest market cap reached becomes the ATH</li>
          <li>ATH multiplier = ATH Market Cap / Entry Market Cap</li>
        </ul>
      </section>

      {/* Important Notes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Important Notes</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Entry Timing:</strong> Entry market cap is recorded
              at the time we detect the call (within 5 minutes of the tweet). Followers who buy
              later may have different entry prices.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Not Financial Advice:</strong> Past performance
              doesn't guarantee future results. Always DYOR (Do Your Own Research).
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Minimum Requirements:</strong> Tokens must have
              at least $1,000 liquidity and $5,000 market cap to be tracked.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Link
          href="/docs/getting-listed"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm text-muted-foreground">Previous</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Getting Listed
            </p>
          </div>
        </Link>

        <Link
          href="/docs/token"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-right"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              $XSCAN Token
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
