'use client';

import Link from 'next/link';
import { ArrowRight, Star, ThumbsUp } from 'lucide-react';
import type { KOL } from '@/types/database';

interface GOATsSectionProps {
  kols: KOL[];
}

// Goat Icon SVG
function GoatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.59 3.97c-.17-.65-.41-1.31-.69-1.97h-.28c-.29.31-.56.64-.81.99-.25.36-.5.73-.7 1.13-.4-.76-.93-1.43-1.59-1.98.92 1.14 1.55 2.54 1.79 4.05.57-.59 1.24-1.09 2-1.46-.18-.37-.31-.77-.42-1.16zm-2.4 4.03c-.9-1.21-2.19-2.11-3.69-2.49-.38-.1-.78-.15-1.18-.16-.07-.01-.14-.01-.21-.01-1.1 0-2.12.3-3 .83-.2.12-.39.25-.57.39-.43.34-.81.73-1.14 1.18-.84 1.14-1.34 2.54-1.34 4.06 0 .94.19 1.83.53 2.64.08.19.17.37.26.55.19.36.41.69.66 1.01.38.49.82.93 1.32 1.3l-1.66 2.79c-.07.12-.08.27-.02.4.05.14.17.24.31.28l1.13.33c.22.06.45-.04.55-.24l1.3-2.34c.46.15.94.26 1.43.32v2.45c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5v-2.45c.49-.06.97-.17 1.43-.32l1.3 2.34c.1.2.33.3.55.24l1.13-.33c.14-.04.26-.14.31-.28.06-.13.05-.28-.02-.4l-1.66-2.79c.5-.37.94-.81 1.32-1.3.25-.32.47-.65.66-1.01.09-.18.18-.36.26-.55.34-.81.53-1.7.53-2.64 0-1.2-.32-2.32-.89-3.29-.26-.45-.57-.87-.91-1.26zM9.5 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
  );
}

interface KOLCardProps {
  kol: KOL;
  rank: number;
}

function KOLCard({ kol, rank }: KOLCardProps) {
  const isTop3 = rank <= 3;

  const rankStyles = {
    1: {
      ring: 'ring-2 ring-yellow-400/50',
      badge: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    },
    2: {
      ring: 'ring-2 ring-gray-400/40',
      badge: 'bg-gradient-to-br from-gray-300 to-gray-400 text-black',
      glow: 'shadow-[0_0_15px_rgba(156,163,175,0.2)]',
    },
    3: {
      ring: 'ring-2 ring-amber-600/40',
      badge: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
      glow: 'shadow-[0_0_15px_rgba(217,119,6,0.2)]',
    },
  };

  const style = isTop3 ? rankStyles[rank as 1 | 2 | 3] : null;

  return (
    <Link
      href={`/kol/${kol.twitter_handle}`}
      className={`
        group relative flex items-center gap-4 p-4 rounded-2xl
        bg-[#111113]/80 backdrop-blur-sm
        border border-white/[0.06]
        transition-all duration-300
        hover:bg-[#161618] hover:border-primary/20
        hover:shadow-[0_8px_32px_rgba(0,255,136,0.08)]
        hover:-translate-y-0.5
        ${isTop3 ? style?.ring : ''}
        ${isTop3 ? style?.glow : ''}
      `}
    >
      {/* Rank */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        text-sm font-bold
        ${isTop3 ? style?.badge : 'bg-white/5 text-muted-foreground'}
      `}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={kol.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${kol.twitter_handle}`}
          alt={kol.display_name || kol.twitter_handle}
          className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-primary/30 transition-colors"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${kol.twitter_handle}`;
          }}
        />
        {rank === 1 && (
          <span className="absolute -top-2 -right-2 text-lg">👑</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white truncate group-hover:text-primary transition-colors">
            {kol.display_name || kol.twitter_handle}
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/20 text-primary border border-primary/30">
            KOL
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          @{kol.twitter_handle}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-primary">{kol.winrate.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <ThumbsUp className="w-4 h-4 text-primary/70" />
          <span>
            <span className="font-bold text-white">{kol.winning_calls || 0}</span>
            <span className="text-muted-foreground">/{kol.total_calls}</span>
          </span>
        </div>
      </div>

      {/* Hover arrow */}
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
    </Link>
  );
}

export default function GOATsSection({ kols }: GOATsSectionProps) {
  const topKols = kols.slice(0, 10);

  if (topKols.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GoatIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">The GOATs</h2>
        </div>
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* KOL List */}
      <div className="space-y-3">
        {topKols.map((kol, index) => (
          <KOLCard key={kol.id} kol={kol} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
