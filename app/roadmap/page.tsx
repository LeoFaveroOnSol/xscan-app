import { Metadata } from 'next';
import RoadmapTimeline from '@/components/roadmap/RoadmapTimeline';

export const metadata: Metadata = {
  title: 'Roadmap | XSCAN',
  description: 'XSCAN roadmap — what\'s next for the #1 KOL scanner on Solana.',
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Building in public
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Road<span className="text-primary">map</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Where we are, where we&apos;re going, and what it takes to get there. 
            Full transparency — no empty promises.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <RoadmapTimeline />

      {/* Scale & Costs */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-center">
            Scaling <span className="text-primary">Costs</span> & Limits
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Real numbers. No sugarcoating. Here&apos;s what it costs to run and scale XSCAN.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CostCard
              title="Infrastructure"
              items={[
                { label: 'VPS (current)', value: '~$15/mo', status: 'active' },
                { label: 'Supabase (DB)', value: 'Free tier', status: 'active' },
                { label: 'Vercel (hosting)', value: 'Free tier', status: 'active' },
                { label: 'Upgrade at scale', value: '~$50-100/mo', status: 'future' },
              ]}
            />
            <CostCard
              title="Data & APIs"
              items={[
                { label: 'DexScreener', value: 'Free', status: 'active' },
                { label: 'Helius RPC', value: 'Free tier', status: 'active' },
                { label: 'Twitter data (at scale)', value: '~$30-50/mo', status: 'future' },
                { label: 'Premium data feeds', value: '~$100/mo', status: 'future' },
              ]}
            />
            <CostCard
              title="Growth & Marketing"
              items={[
                { label: 'DexScreener boost', value: '$100-500/boost', status: 'future' },
                { label: 'X Gold verified', value: '$84/yr', status: 'future' },
                { label: 'X Org badge', value: '$200/mo', status: 'future' },
              ]}
            />
            <CostCard
              title="Revenue Streams"
              items={[
                { label: 'Token creator fees', value: 'On-chain', status: 'planned' },
                { label: 'DexScreener payouts', value: 'After 10K users', status: 'planned' },
                { label: 'Buyback & Burn', value: 'After 15K users', status: 'planned' },
                { label: 'Pro subscriptions', value: 'If scaled', status: 'planned' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-3">Want to help shape the roadmap?</h3>
          <p className="text-muted-foreground mb-6">
            Join our community and suggest features. XSCAN is built for traders, by traders.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://t.me/xscancalls"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
            >
              Telegram
            </a>
            <a
              href="https://x.com/xaboratoken"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-card-border bg-card hover:bg-card-hover text-foreground font-semibold transition-colors"
            >
              𝕏 Twitter
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function CostCard({ title, items }: { 
  title: string; 
  items: { label: string; value: string; status: 'active' | 'future' | 'planned' }[] 
}) {
  const statusColors = {
    active: 'bg-primary/10 text-primary',
    future: 'bg-warning/10 text-warning',
    planned: 'bg-neon-purple/10 text-neon-purple',
  };

  const statusDot = {
    active: 'bg-primary',
    future: 'bg-warning',
    planned: 'bg-neon-purple',
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[item.status]}`} />
              <span className="text-sm text-foreground/80">{item.label}</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
