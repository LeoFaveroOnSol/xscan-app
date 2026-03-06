'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Clock, Heart, ChevronRight } from 'lucide-react';
import type { Call } from '@/types/database';

interface XCallsSidebarProps {
  calls: Call[];
}

// Custom Zap Icon with glow effect
function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getCallStatus(call: Call): { label: string; color: string; bg: string } {
  const multiplier = call.current_multiplier || 1;

  if (multiplier >= 10) return { label: '🚀 Moon', color: 'text-primary', bg: 'bg-primary/10' };
  if (multiplier >= 5) return { label: '🔥 Hot', color: 'text-orange-400', bg: 'bg-orange-400/10' };
  if (multiplier >= 2) return { label: '✅ Profit', color: 'text-success', bg: 'bg-success/10' };
  if (multiplier >= 1) return { label: '↗ Up', color: 'text-success', bg: 'bg-success/10' };
  if (multiplier >= 0.5) return { label: '↘ Down', color: 'text-warning', bg: 'bg-warning/10' };
  return { label: '💀 Rekt', color: 'text-danger', bg: 'bg-danger/10' };
}

export default function XCallsSidebar({ calls }: XCallsSidebarProps) {
  const [filter, setFilter] = useState<'all' | 'hot' | 'new'>('all');

  // Filter out unknown tokens first
  const validCalls = calls.filter(call => {
    const name = (call.token_name || '').toLowerCase();
    const symbol = (call.token_symbol || '').toLowerCase();
    return name !== 'unknown' && symbol !== 'unknown' && name !== '' && symbol !== '';
  });

  const recentCalls = validCalls.slice(0, 10);

  const filteredCalls = recentCalls.filter(call => {
    if (filter === 'hot') return (call.current_multiplier || 1) >= 5;
    if (filter === 'new') {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return new Date(call.entry_timestamp) > hourAgo;
    }
    return true;
  });

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
      <div className="sticky top-20 premium-card overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center icon-glow">
                <ZapIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg tracking-tight">X Calls</h2>
                <p className="text-xs text-muted-foreground">Live feed</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
            >
              View All
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1.5 bg-background/50 rounded-xl border border-border/50">
            {(['all', 'hot', 'new'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  filter === tab
                    ? 'tab-pill-active'
                    : 'tab-pill-inactive'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'hot' ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="text-base">🔥</span> Hot
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <span className="text-base">⚡</span> New
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Calls List */}
        <div className="max-h-[550px] overflow-y-auto">
          {filteredCalls.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
                <ZapIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No calls found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredCalls.map((call, index) => {
                const status = getCallStatus(call);
                const multiplier = call.current_multiplier || 1;
                const isPositive = multiplier >= 1;

                return (
                  <Link
                    key={call.id}
                    href={`/token/${call.token_address}`}
                    className="block p-4 hover:bg-white/[0.02] transition-all duration-300 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Token Image */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center flex-shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors">
                        <span className="text-primary font-bold text-sm tracking-tight">
                          {call.token_symbol?.slice(0, 2) || '??'}
                        </span>
                      </div>

                      {/* Call Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors tracking-tight">
                            {call.token_symbol || 'Unknown'}
                          </h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        {/* Multiplier */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${isPositive ? 'bg-success/10' : 'bg-danger/10'}`}>
                            {isPositive ? (
                              <TrendingUp className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-danger" />
                            )}
                            <span className={`text-sm font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                              {multiplier.toFixed(2)}x
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center justify-end">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(new Date(call.entry_timestamp))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            multiplier >= 5 ? 'bg-gradient-to-r from-primary to-primary/70' :
                            multiplier >= 1 ? 'bg-gradient-to-r from-success to-success/70' :
                            multiplier >= 0.5 ? 'bg-gradient-to-r from-warning to-warning/70' : 'bg-gradient-to-r from-danger to-danger/70'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, multiplier * 10))}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground group-hover:text-danger transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {/* Deterministic "likes" based on call ID to prevent re-render flickering */}
                          {Math.abs(call.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 100) + 1}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-background/30">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">
              Live updates every 30s
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
