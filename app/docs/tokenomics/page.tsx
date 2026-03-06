import { Coins, Flame, Users, Code, Megaphone, Wallet, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const tokenomicsData = [
  { label: 'Community & Ecosystem', percentage: 40, color: 'bg-primary', icon: Users },
  { label: 'Development', percentage: 20, color: 'bg-purple-500', icon: Code },
  { label: 'Marketing', percentage: 15, color: 'bg-yellow-500', icon: Megaphone },
  { label: 'Team', percentage: 15, color: 'bg-success', icon: Wallet },
  { label: 'Reserve', percentage: 10, color: 'bg-orange-500', icon: Coins },
];

export default function TokenomicsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium mb-4">
          <Flame className="w-4 h-4" />
          Tokenomics
        </div>
        <h1 className="text-4xl font-bold mb-4">$XSCAN Tokenomics</h1>
        <p className="text-xl text-muted-foreground">
          A deflationary token designed for long-term sustainability.
        </p>
      </div>

      {/* Supply Info */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Token Supply</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-xl bg-card border border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Supply</p>
            <p className="text-3xl font-bold">1,000,000,000</p>
            <p className="text-sm text-muted-foreground">1 Billion $XSCAN</p>
          </div>
          <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
            <p className="text-sm text-orange-400 mb-2">Deflationary</p>
            <p className="text-3xl font-bold text-orange-500">-15%</p>
            <p className="text-sm text-muted-foreground">Of fees burned forever</p>
          </div>
        </div>
      </section>

      {/* Distribution */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Token Distribution</h2>

        {/* Visual Bar */}
        <div className="h-8 rounded-full overflow-hidden flex mb-6">
          {tokenomicsData.map((item, index) => (
            <div
              key={index}
              className={`${item.color} transition-all hover:brightness-110`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.label}: ${item.percentage}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid md:grid-cols-2 gap-4">
          {tokenomicsData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {(1000000000 * item.percentage / 100).toLocaleString()} tokens
                  </p>
                </div>
                <div className="text-2xl font-bold">{item.percentage}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Allocation Details */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Allocation Details</h2>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Community & Ecosystem (40%)</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              The largest allocation is dedicated to community growth, airdrops, rewards programs,
              liquidity provision, and ecosystem development. This ensures the community remains
              the primary beneficiary of the protocol's success.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Development (20%)</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Funds allocated for ongoing platform development, new feature implementation,
              security audits, and technical infrastructure. This ensures continuous improvement
              of the XSCAN platform.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Marketing (15%)</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Dedicated to marketing campaigns, partnerships, influencer collaborations,
              and brand awareness initiatives to grow the XSCAN user base and ecosystem.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Team (15%)</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Team allocation with vesting schedules to ensure long-term alignment with the
              project's success. Subject to cliff and linear vesting periods.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Reserve (10%)</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Reserve fund for unforeseen opportunities, strategic partnerships, exchange listings,
              and emergency situations. Managed by multi-sig wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Link
          href="/docs/token"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm text-muted-foreground">Previous</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              $XSCAN Token
            </p>
          </div>
        </Link>

        <Link
          href="/docs/side-wallets"
          className="group flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-right"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next</p>
            <p className="font-semibold group-hover:text-primary transition-colors">
              Side Wallet Detection
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
