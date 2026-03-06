import { Rocket, Key, HandCoins, User } from 'lucide-react';

const features = [
  {
    icon: Rocket,
    title: 'Premium Features',
    description: 'Unlock advanced analytics, real-time alerts, and exclusive KOL insights by holding $XSCAN tokens.',
  },
  {
    icon: User,
    title: 'KOL Incentives',
    description: 'Top-performing KOLs earn $XSCAN rewards based on their accuracy and community engagement.',
  },
  {
    icon: Key,
    title: 'API Access',
    description: 'Access our comprehensive API for building custom tools and integrations with $XSCAN holdings.',
  },
  {
    icon: HandCoins,
    title: 'Ecosystem Rewards',
    description: 'Participate in governance, airdrops, and exclusive events by being part of the $XSCAN ecosystem.',
  },
];

export default function TokenUsage() {
  return (
    <section className="py-12">
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-8 md:p-12">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight">
          How $XSCAN is used
        </h2>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group text-center p-6 rounded-xl border border-white/[0.04] bg-black/20 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Text */}
        <p className="text-center text-primary font-medium mt-10 text-lg">
          $XSCAN powers the XSCAN ecosystem.
        </p>
      </div>
    </section>
  );
}
