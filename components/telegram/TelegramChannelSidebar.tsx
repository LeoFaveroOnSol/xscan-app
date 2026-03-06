'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import type { TelegramChannel, TelegramCall } from '@/types/database';
import TelegramFlexCard from './TelegramFlexCard';

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

interface TelegramChannelSidebarProps {
  channel: TelegramChannel;
  totalCalls: number;
  calls: TelegramCall[];
}

export default function TelegramChannelSidebar({ channel, totalCalls, calls }: TelegramChannelSidebarProps) {
  const [showFlexCard, setShowFlexCard] = useState(false);

  const avgMultiplier = `${channel.avg_multiplier.toFixed(2)}x`;
  const bestMultiplier = `${channel.best_multiplier.toFixed(2)}x`;

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0">
      {/* Profile Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400">
            Telegram Channel
          </span>
          <button
            onClick={() => setShowFlexCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            FLEX
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={channel.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.channel_username}`}
              alt={channel.display_name || channel.channel_username}
              className="w-32 h-32 rounded-full object-cover border-2 border-blue-500/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${channel.channel_username}`;
              }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-2">{channel.display_name || channel.channel_username}</h1>
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            CHANNEL
          </span>
        </div>

        {/* Member Count */}
        {channel.member_count > 0 && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {channel.member_count.toLocaleString()} members
              </span>
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={`https://t.me/${channel.channel_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
          >
            <TelegramIcon className="w-5 h-5 text-blue-400" />
          </a>
        </div>

        {/* Description */}
        {channel.description && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center border-r border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XSCORE</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold text-blue-400">{(channel.winrate / 10).toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">WINRATE</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold text-blue-400">+{channel.winrate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">TOKENS</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-blue-400 font-bold">{channel.winning_calls || 0}</span>
              <span className="text-muted-foreground">/ {totalCalls}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">MULTIPLIERS</p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground">BEST</p>
                <p className="font-bold">{bestMultiplier}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground">AVG</p>
                <p className="font-bold">{avgMultiplier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PNL Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ALL TIME PNL</p>
            <p className="text-lg font-bold text-muted-foreground">TBD</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">DEGENS PNL</p>
            <p className="text-lg font-bold text-muted-foreground">TBD</p>
          </div>
        </div>
      </div>

      {/* Flex Card Modal */}
      {showFlexCard && (
        <TelegramFlexCard channel={channel} calls={calls} onClose={() => setShowFlexCard(false)} />
      )}
    </div>
  );
}
