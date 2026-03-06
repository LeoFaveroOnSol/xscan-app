import { Shield, AlertTriangle, Eye, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SideWalletsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-4">
          <Shield className="w-4 h-4" />
          Security
        </div>
        <h1 className="text-4xl font-bold mb-4">Side Wallet Detection</h1>
        <p className="text-xl text-muted-foreground">
          How we protect users from insider trading and exit liquidity schemes.
        </p>
      </div>

      {/* The Problem */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">The Problem</h2>

        <div className="p-6 rounded-xl bg-danger/10 border border-danger/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger mb-2">Exit Liquidity Scheme</h3>
              <p className="text-sm text-muted-foreground">
                Some KOLs use "side wallets" - secondary wallets not publicly associated with them -
                to trade before or after making public calls. This allows them to profit at the
                expense of their followers.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-3">Common Patterns</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium mb-1">1. Pre-Call Buying</p>
            <p className="text-sm text-muted-foreground">
              KOL buys a token with their side wallet, then promotes it to followers.
              When followers buy and price rises, KOL sells for profit.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium mb-1">2. Coordinated Dumps</p>
            <p className="text-sm text-muted-foreground">
              KOL times their side wallet sales perfectly with peak follower buying,
              maximizing their exit at the expense of late buyers.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium mb-1">3. Multiple Wallets</p>
            <p className="text-sm text-muted-foreground">
              Using multiple wallets to hide the total position size and make tracking
              more difficult.
            </p>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Solution</h2>

        <div className="p-6 rounded-xl bg-success/10 border border-success/20 mb-6">
          <div className="flex items-start gap-3">
            <Eye className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-success mb-2">On-Chain Analysis</h3>
              <p className="text-sm text-muted-foreground">
                XSCAN analyzes blockchain transaction data to identify wallets that may be
                linked to KOLs, even when they try to hide the connection.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-3">Detection Methods</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium mb-1">Transaction Pattern Analysis</p>
              <p className="text-sm text-muted-foreground">
                We look for wallets that consistently buy tokens shortly before KOL tweets
                and sell during the resulting pump. Statistical analysis identifies suspicious
                timing correlations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-medium mb-1">Wallet Clustering</p>
              <p className="text-sm text-muted-foreground">
                We analyze fund flows between wallets to identify clusters that may belong
                to the same entity. SOL transfers, token movements, and shared DEX interactions
                are all considered.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-medium mb-1">Historical Analysis</p>
              <p className="text-sm text-muted-foreground">
                We maintain historical data on KOL-linked wallets and cross-reference new
                addresses against known patterns. Suspicious wallets are flagged for review.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-medium mb-1">Community Reports</p>
              <p className="text-sm text-muted-foreground">
                Users can report suspicious activity, which our team investigates. Community
                vigilance helps catch patterns our automated systems might miss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Actions We Take</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-sm">
              <strong>Flagging:</strong> Suspected side wallets are flagged on KOL profiles
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-sm">
              <strong>Warnings:</strong> Users are warned when viewing flagged KOLs
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-sm">
              <strong>Stat Adjustments:</strong> Side wallet trading may affect displayed metrics
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-sm">
              <strong>Delisting:</strong> Severe or repeated violations may result in delisting
            </p>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Commitment to Transparency</h2>
        <p className="text-muted-foreground mb-4">
          All blockchain data we analyze is publicly available. Our detection methods are
          designed to identify patterns, not to make accusations. We believe in:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Giving KOLs the opportunity to explain flagged wallets</li>
          <li>Publishing methodology for community review</li>
          <li>Updating our systems based on new evasion techniques</li>
          <li>Protecting user privacy while maintaining accountability</li>
        </ul>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Link
          href="/docs/tokenomics"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm text-muted-foreground">Previous</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Tokenomics
            </p>
          </div>
        </Link>

        <Link
          href="/faq"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-right"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              FAQ
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
