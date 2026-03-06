'use client';

import { useState } from 'react';
import { 
  Rocket, Target, Zap, Globe, Crown, Code2, 
  TrendingUp, Shield, Eye, Users, CheckCircle2,
  Clock, Lock, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';

type PhaseStatus = 'completed' | 'in-progress' | 'upcoming';

interface Milestone {
  title: string;
  description: string;
  status: 'done' | 'building' | 'planned';
  icon?: React.ReactNode;
}

interface Phase {
  id: string;
  phase: string;
  title: string;
  subtitle: string;
  status: PhaseStatus;
  trigger?: string;
  milestones: Milestone[];
  accent: string;
  glowColor: string;
}

const phases: Phase[] = [
  {
    id: 'foundation',
    phase: 'Phase 1',
    title: 'Foundation',
    subtitle: 'Core platform & KOL tracking',
    status: 'completed',
    accent: 'text-primary',
    glowColor: 'shadow-neon-sm',
    milestones: [
      { title: 'KOL Scanner Website', description: 'Track KOL calls, winrates, and multipliers on Solana', status: 'done', icon: <Eye size={16} /> },
      { title: 'Telegram Bot', description: 'Real-time call detection from KOL channels with auto-analysis', status: 'done', icon: <Zap size={16} /> },
      { title: 'Discord Bot', description: 'Token scanning, /pnl cards, leaderboards for communities', status: 'done', icon: <Code2 size={16} /> },
      { title: 'Achievement System', description: 'Milestone tracking (2x, 5x, 10x, 100x) with custom GIFs', status: 'done', icon: <Target size={16} /> },
      { title: 'Wallet Tracker', description: 'Real-time buy/sell alerts via Helius webhooks', status: 'done', icon: <Shield size={16} /> },
      { title: 'GitHub Tracker', description: 'Monitor repo changes for tracked projects', status: 'done', icon: <Code2 size={16} /> },
    ],
  },
  {
    id: 'growth',
    phase: 'Phase 2',
    title: 'Growth',
    subtitle: 'Expand reach & monetization kickoff',
    status: 'in-progress',
    accent: 'text-neon-blue',
    glowColor: 'shadow-[0_0_20px_rgba(0,212,255,0.2)]',
    milestones: [
      { title: 'Real-time X (Twitter) Tracking', description: 'Detect contracts posted by KOLs on X in real-time — seconds after they post', status: 'building', icon: <Eye size={16} /> },
      { title: 'Expand KOL Database', description: 'Scale from current roster to 500+ tracked KOLs across Solana ecosystem', status: 'building', icon: <Users size={16} /> },
      { title: 'DexScreener Boost', description: 'Token boost on DexScreener post-PumpFun migration for visibility', status: 'planned', icon: <TrendingUp size={16} /> },
      { title: 'X Gold Verified + Org Badge', description: 'Establish trust and credibility on Twitter/X', status: 'planned', icon: <Crown size={16} /> },
      { title: 'User Milestone: 10K', description: 'At 10K users → DexScreener revenue share unlocked', status: 'planned', icon: <Target size={16} /> },
    ],
  },
  {
    id: 'monetization',
    phase: 'Phase 3',
    title: 'Monetization',
    subtitle: 'Sustainable revenue & token utility',
    status: 'upcoming',
    trigger: '$15K Market Cap',
    accent: 'text-neon-purple',
    glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    milestones: [
      { title: 'Buyback & Burn Engine', description: 'At $15K market cap → activate automated buyback & burn using PumpFun creator fees. Deflationary by design.', status: 'planned', icon: <TrendingUp size={16} /> },
      { title: 'DexScreener Payouts', description: 'Revenue from DexScreener partner program at 10K+ user threshold', status: 'planned', icon: <Rocket size={16} /> },
      { title: 'Creator Fee Revenue', description: 'On-chain creator fees from token trading funding development & burns', status: 'planned', icon: <Shield size={16} /> },
    ],
  },
  {
    id: 'ecosystem',
    phase: 'Phase 4',
    title: 'Ecosystem',
    subtitle: 'Open source, SDKs & developer tools',
    status: 'upcoming',
    accent: 'text-warning',
    glowColor: 'shadow-[0_0_20px_rgba(255,165,2,0.2)]',
    milestones: [
      { title: 'XSCAN SDK', description: 'Open-source JavaScript/TypeScript SDK for KOL data, call tracking, and on-chain analytics', status: 'planned', icon: <Code2 size={16} /> },
      { title: 'API for Developers', description: 'Public REST API for builders to integrate XSCAN data into their own tools', status: 'planned', icon: <Globe size={16} /> },
      { title: 'Community Libraries', description: 'Python, Rust SDKs — empower the community to build on top of XSCAN', status: 'planned', icon: <Users size={16} /> },
    ],
  },
  {
    id: 'scale',
    phase: 'Phase 5',
    title: 'Scale',
    subtitle: 'Premium features & enterprise',
    status: 'upcoming',
    trigger: 'High Demand',
    accent: 'text-rank-gold',
    glowColor: 'shadow-gold',
    milestones: [
      { title: 'Pro Subscriptions', description: 'Premium tier with advanced data: real-time alerts, custom KOL watchlists, API access, priority support', status: 'planned', icon: <Crown size={16} /> },
      { title: 'Advanced Analytics', description: 'Deep KOL performance analytics, sector rotation tracking, alpha detection', status: 'planned', icon: <TrendingUp size={16} /> },
      { title: 'Institutional Dashboard', description: 'Enterprise-grade data feeds for funds and trading desks', status: 'planned', icon: <Shield size={16} /> },
    ],
  },
];

export default function RoadmapTimeline() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('growth');

  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Phase Cards */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] md:left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-primary via-neon-purple to-card-border" />

          <div className="space-y-6">
            {phases.map((phase) => {
              const isExpanded = expandedPhase === phase.id;
              const doneCount = phase.milestones.filter(m => m.status === 'done').length;
              const totalCount = phase.milestones.length;

              return (
                <div key={phase.id} className="relative pl-14 md:pl-16">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 md:left-4 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                    phase.status === 'completed' 
                      ? 'border-primary bg-primary/20' 
                      : phase.status === 'in-progress'
                      ? 'border-neon-blue bg-neon-blue/20 animate-pulse'
                      : 'border-card-border bg-card'
                  }`}>
                    {phase.status === 'completed' && (
                      <CheckCircle2 size={12} className="text-primary" />
                    )}
                    {phase.status === 'in-progress' && (
                      <div className="w-2 h-2 rounded-full bg-neon-blue" />
                    )}
                    {phase.status === 'upcoming' && (
                      <Clock size={10} className="text-muted" />
                    )}
                  </div>

                  {/* Card */}
                  <div 
                    className={`rounded-xl border bg-card transition-all duration-300 cursor-pointer ${
                      isExpanded 
                        ? `border-card-border ${phase.glowColor}` 
                        : 'border-card-border/50 hover:border-card-border'
                    }`}
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  >
                    {/* Header */}
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-widest ${phase.accent}`}>
                            {phase.phase}
                          </span>
                          {phase.trigger && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-card-hover border border-card-border text-muted-foreground">
                              Trigger: {phase.trigger}
                            </span>
                          )}
                          {phase.status === 'completed' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              ✓ Complete
                            </span>
                          )}
                          {phase.status === 'in-progress' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue">
                              Building now
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold">{phase.title}</h3>
                        <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Progress */}
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                phase.status === 'completed' ? 'bg-primary' : 
                                phase.status === 'in-progress' ? 'bg-neon-blue' : 'bg-muted'
                              }`}
                              style={{ width: `${(doneCount / totalCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{doneCount}/{totalCount}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                      </div>
                    </div>

                    {/* Milestones */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-card-border/50">
                        <div className="space-y-3 mt-4">
                          {phase.milestones.map((milestone, i) => (
                            <div 
                              key={i} 
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                milestone.status === 'done' 
                                  ? 'bg-primary/5' 
                                  : milestone.status === 'building' 
                                  ? 'bg-neon-blue/5 border border-neon-blue/10' 
                                  : 'bg-secondary/30'
                              }`}
                            >
                              <div className={`mt-0.5 ${
                                milestone.status === 'done' ? 'text-primary' : 
                                milestone.status === 'building' ? 'text-neon-blue' : 'text-muted'
                              }`}>
                                {milestone.status === 'done' ? <CheckCircle2 size={16} /> : milestone.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    milestone.status === 'done' ? 'text-foreground/70' : 'text-foreground'
                                  }`}>
                                    {milestone.title}
                                  </span>
                                  {milestone.status === 'building' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue font-medium">
                                      WIP
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {milestone.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
