'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { MessageCircle, ThumbsUp, Clock, CheckCircle2, Users } from 'lucide-react';
import type { TelegramChannel } from '@/types/database';

interface TelegramLeaderboardClientProps {
  channels: TelegramChannel[];
  stats: {
    total: number;
    verified: number;
    unverified: number;
  };
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

type Period = '1d' | '1w' | '1m' | 'all';

export default function TelegramLeaderboardClient({ channels, stats }: TelegramLeaderboardClientProps) {
  const [period, setPeriod] = useState<Period>('all');

  const filteredChannels = channels;

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <TelegramIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Telegram Channels
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track best Telegram call channels on Solana
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">Channels:</span>
              <span className="ml-1.5 font-semibold text-white">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">Verified:</span>
              <span className="ml-1.5 font-semibold text-blue-400">{stats.verified}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <span className="text-muted-foreground">Unverified:</span>
              <span className="ml-1.5 font-semibold text-yellow-500">{stats.unverified}</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-[#111113] border border-white/[0.06]">
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
                    ? 'bg-blue-500 text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated: 2m ago</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#0d0d0e] text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/[0.06]">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Channel</div>
            <div className="col-span-2 text-right">Avg Multi</div>
            <div className="col-span-2 text-center">Calls</div>
            <div className="col-span-2 text-right">Success Rate</div>
            <div className="col-span-1 text-right">Score</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/[0.04]">
            {filteredChannels.map((channel, index) => {
              const position = index + 1;
              const isTop3 = position <= 3;

              return (
                <Link
                  key={channel.id}
                  href={`/telegram/${channel.channel_username}`}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center transition-all duration-200 hover:bg-blue-500/[0.02] group ${
                    isTop3 ? 'bg-gradient-to-r from-blue-950/30 to-transparent border-l-2 border-blue-500/50' : 'bg-[#111113]'
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

                  {/* Channel Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar
                      src={channel.profile_image_url}
                      alt={channel.display_name || channel.channel_username}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                          {channel.display_name || channel.channel_username}
                        </span>
                        {channel.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          CHANNEL
                        </span>
                        <a
                          href={`https://t.me/${channel.channel_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-white transition-colors"
                        >
                          <TelegramIcon className="w-3.5 h-3.5" />
                        </a>
                        {channel.member_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {channel.member_count.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Avg Multiplier */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-white">
                      {channel.avg_multiplier.toFixed(2)}x
                    </span>
                  </div>

                  {/* Calls */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">
                      <span className="text-blue-400">{channel.winning_calls || 0}</span>
                      <span className="text-muted-foreground">/{channel.total_calls || 0}</span>
                    </span>
                  </div>

                  {/* Success Rate */}
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-semibold ${
                      channel.winrate >= 70 ? 'text-blue-400' :
                      channel.winrate >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {channel.winrate.toFixed(2)}%
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 text-right">
                    <span className="text-lg font-bold text-blue-400">
                      {(channel.winrate / 10).toFixed(2)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Coming Soon State */}
        {filteredChannels.length === 0 && (
          <div className="text-center py-20 rounded-xl border border-blue-500/20 bg-[#111113]">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <TelegramIcon className="w-8 h-8 text-blue-400" />
            </div>
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mb-4">
              Coming in v2.0
            </span>
            <h3 className="text-xl font-semibold mb-2">Telegram Channels Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Track the best Telegram call channels on Solana. This feature will be available in version 2.0 of XSCAN.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
