import { Check } from 'lucide-react';

type PhaseStatus = 'complete' | 'active' | 'upcoming';

interface RoadmapPhaseProps {
  phase: number;
  title: string;
  items: string[];
  status: PhaseStatus;
}

function RoadmapPhase({ phase, title, items, status }: RoadmapPhaseProps) {
  const isComplete = status === 'complete';
  const isActive = status === 'active';

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`h-full rounded-2xl border overflow-hidden transition-all ${
        isComplete ? 'border-primary/30 bg-gradient-to-b from-primary/5 to-transparent' :
        isActive ? 'border-primary/20 bg-[#111113]' :
        'border-white/[0.06] bg-[#111113]'
      }`}>
        {/* Top Bar */}
        <div className={`h-1.5 ${
          isComplete ? 'bg-primary' :
          isActive ? 'bg-gradient-to-r from-primary to-primary/50' :
          'bg-white/10'
        }`} />

        <div className="p-6">
          {/* Phase Badge */}
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
            isComplete ? 'bg-primary/20 text-primary border border-primary/30' :
            isActive ? 'bg-primary/10 text-primary border border-primary/20' :
            'bg-white/5 text-muted-foreground border border-white/10'
          }`}>
            Phase {phase}
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold mb-4 ${
            isComplete || isActive ? 'text-white' : 'text-muted-foreground'
          }`}>
            {title}
          </h3>

          {/* Items */}
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                ) : (
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    isActive ? 'bg-primary/50' : 'bg-white/20'
                  }`} />
                )}
                <span className={`text-sm ${
                  isComplete ? 'text-white' :
                  isActive ? 'text-muted-foreground' :
                  'text-muted-foreground/70'
                }`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const phases: RoadmapPhaseProps[] = [
  {
    phase: 1,
    title: 'Foundation',
    status: 'complete',
    items: [
      'XSCAN Platform Launch',
      'KOL Tracking System',
      'User Profiles',
      'Score Algorithm V1',
    ],
  },
  {
    phase: 2,
    title: 'Expansion',
    status: 'active',
    items: [
      'Enhanced API',
      'Terminal Integrations',
      'Analytics Upgrade',
      'Telegram Channels Tracking',
    ],
  },
  {
    phase: 3,
    title: 'Ecosystem',
    status: 'upcoming',
    items: [
      'Premium Tier System',
      'XSCAN Extensions',
      'Multi-chain Support',
    ],
  },
];

export default function Roadmap() {
  return (
    <section className="py-12">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0e] p-8 md:p-12">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight">
          Roadmap
        </h2>

        {/* Phases */}
        <div className="flex flex-col lg:flex-row gap-6">
          {phases.map((phase) => (
            <RoadmapPhase key={phase.phase} {...phase} />
          ))}
        </div>
      </div>
    </section>
  );
}
