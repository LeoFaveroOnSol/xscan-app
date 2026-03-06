import { Users, CheckCircle, ArrowRight, ArrowLeft, Wallet, Twitter, FileText } from 'lucide-react';
import Link from 'next/link';

export default function GettingListedPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          For KOLs
        </div>
        <h1 className="text-4xl font-bold mb-4">Getting Listed on XSCAN</h1>
        <p className="text-xl text-muted-foreground">
          Join the most transparent KOL tracking platform and build your verified track record.
        </p>
      </div>

      {/* Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Get Listed?</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <CheckCircle className="w-6 h-6 text-success mb-3" />
            <h3 className="font-semibold mb-2">Build Credibility</h3>
            <p className="text-sm text-muted-foreground">
              Verified performance data that followers can trust. No more fake screenshots or
              cherry-picked wins.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <CheckCircle className="w-6 h-6 text-success mb-3" />
            <h3 className="font-semibold mb-2">Grow Your Audience</h3>
            <p className="text-sm text-muted-foreground">
              Get discovered by traders looking for reliable KOLs. High performers get
              featured prominently.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <CheckCircle className="w-6 h-6 text-success mb-3" />
            <h3 className="font-semibold mb-2">Stand Out</h3>
            <p className="text-sm text-muted-foreground">
              Differentiate yourself from fake influencers with transparent, on-chain verified stats.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <CheckCircle className="w-6 h-6 text-success mb-3" />
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your own performance over time with detailed analytics and call history.
            </p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Requirements</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Twitter className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Active Twitter/X Account</h3>
              <p className="text-sm text-muted-foreground">
                Public account with regular crypto-related content. We don't require a minimum
                follower count, but active engagement is preferred.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Solana Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to verify ownership and prevent impersonation. This also
                helps us link your on-chain activity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Proof of Calls</h3>
              <p className="text-sm text-muted-foreground">
                Provide examples of past calls you've made. This can be links to tweets,
                screenshots, or any verifiable evidence of your track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Application Process</h2>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-8">
            <div className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <h3 className="font-semibold mb-2">Connect Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Solana wallet (Phantom, Solflare, etc.) to verify your identity.
              </p>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <h3 className="font-semibold mb-2">Fill Application</h3>
              <p className="text-sm text-muted-foreground">
                Provide your Twitter handle, display name, bio, and proof of past calls.
              </p>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <h3 className="font-semibold mb-2">Team Review</h3>
              <p className="text-sm text-muted-foreground">
                Our team reviews your application, verifies your track record, and checks for
                any red flags.
              </p>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-success flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Get Listed!</h3>
              <p className="text-sm text-muted-foreground">
                Once approved, your profile goes live and we start tracking your calls automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-12">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-center">
          <h3 className="text-xl font-bold mb-3">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Join the most trusted KOL tracking platform today.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Link
          href="/docs/how-it-works"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm text-muted-foreground">Previous</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              How It Works
            </p>
          </div>
        </Link>

        <Link
          href="/docs/scoring"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-right"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Scoring System
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
