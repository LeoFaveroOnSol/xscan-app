'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { Trophy, ThumbsUp, Clock, CheckCircle2 } from 'lucide-react';
import type { KOL } from '@/types/database';
import DeletionRateBadge from '@/components/kol/DeletionRateBadge';

interface LeaderboardClientProps {
  kols: KOL[];
  stats: {
    total: number;
    verified: number;
    unverified: number;
  };
}

// Custom Twitter Icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Period = '1d' | '1w' | '1m' | 'all';
type Tab = 'kols' | 'tokens';

export default function LeaderboardClient({ kols, stats }: LeaderboardClientProps) {
  const [period, setPeriod] = useState<Period>('all');
  const [activeTab, setActiveTab] = useState<Tab>('kols');
  const [filters, setFilters] = useState({
    kols: true,
    influencers: false,
    analysts: false,
  });

  const filteredKols = kols; // Add actual filtering logic based on period and filters

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.15)]">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                XSCAN Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track best KOLs on Solana
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">KOLs:</span>
              <span className="ml-1.5 font-semibold text-white">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">Verified:</span>
              <span className="ml-1.5 font-semibold text-primary">{stats.verified}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">Unverified:</span>
              <span className="ml-1.5 font-semibold text-yellow-500">{stats.unverified}</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-[#111113] border border-white/[0.06]">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('kols')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'kols'
                  ? 'bg-primary text-black'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              KOLs
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tokens'
                  ? 'bg-primary text-black'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              Tokens
            </button>

            <div className="w-px h-6 bg-white/10 mx-2" />

            {/* Type Filters */}
            {['kols', 'influencers', 'analysts'].map((type) => (
              <button
                key={type}
                onClick={() => setFilters(f => ({ ...f, [type]: !f[type as keyof typeof f] }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters[type as keyof typeof filters]
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            {[
              { key: '1d', label: '1 Day' },
              { key: '1w', label: '1 Week' },
              { key: '1m', label: '1 Month' },
              { key: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key as Period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-primary text-black'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="w-px h-6 bg-white/10 mx-2" />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Last updated: 2m ago</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#0d0d0e] text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/[0.06]">
            <div className="col-span-1">#</div>
            <div className="col-span-4">KOL</div>
            <div className="col-span-2 text-right">Avg Multi</div>
            <div className="col-span-2 text-center">Calls</div>
            <div className="col-span-2 text-right">Success Rate</div>
            <div className="col-span-1 text-right">Score</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/[0.04]">
            {filteredKols.map((kol, index) => {
              const position = index + 1;
              const isTop3 = position <= 3;

              return (
                <Link
                  key={kol.id}
                  href={`/kol/${kol.twitter_handle}`}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center transition-all duration-200 hover:bg-primary/[0.02] group ${
                    isTop3 ? 'bg-gradient-to-r from-emerald-950/30 to-transparent border-l-2 border-primary/50' : 'bg-[#111113]'
                  }`}
                >
                  {/* Position */}
                  <div className="col-span-1">
                    {position === 1 ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                        <span className="text-sm font-bold text-black">1</span>
                      </div>
                    ) : position === 2 ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-[0_0_10px_rgba(156,163,175,0.2)]">
                        <span className="text-sm font-bold text-black">2</span>
                      </div>
                    ) : position === 3 ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.2)]">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground pl-2">{position}</span>
                    )}
                  </div>

                  {/* KOL Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar
                      src={kol.profile_image_url}
                      alt={kol.display_name || kol.twitter_handle}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                          {kol.display_name || kol.twitter_handle}
                        </span>
                        {kol.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                          KOL
                        </span>
                        <a
                          href={`https://x.com/${kol.twitter_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-white transition-colors"
                        >
                          <TwitterIcon className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Avg Multiplier */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-white">
                      {kol.avg_multiplier.toFixed(2)}x
                    </span>
                  </div>

                  {/* Calls */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      <span className="text-primary">{kol.winning_calls || 0}</span>
                      <span className="text-muted-foreground">/{kol.total_calls || 0}</span>
                    </span>
                  </div>

                  {/* Success Rate */}
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-semibold ${
                      kol.winrate >= 70 ? 'text-primary' :
                      kol.winrate >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {kol.winrate.toFixed(2)}%
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 text-right">
                    <span className="text-lg font-bold text-primary">
                      {(kol.winrate / 10).toFixed(2)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredKols.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No KOLs found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
