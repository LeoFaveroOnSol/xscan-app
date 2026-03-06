import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { Trophy, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { formatPercent } from '@/lib/utils/formatters';
import type { KOL } from '@/types/database';

interface TopKOLCardsProps {
  kols: KOL[];
}

const rankStyles = [
  {
    border: 'border-yellow-400/50',
    bg: 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/5',
    badge: 'bg-yellow-400 text-black',
    icon: 'text-yellow-400',
  },
  {
    border: 'border-gray-400/50',
    bg: 'bg-gradient-to-br from-gray-400/10 to-gray-600/5',
    badge: 'bg-gray-400 text-black',
    icon: 'text-gray-400',
  },
  {
    border: 'border-amber-600/50',
    bg: 'bg-gradient-to-br from-amber-600/10 to-amber-800/5',
    badge: 'bg-amber-600 text-white',
    icon: 'text-amber-600',
  },
];

export default function TopKOLCards({ kols }: TopKOLCardsProps) {
  if (kols.length === 0) return null;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {kols.map((kol, index) => {
        const style = rankStyles[index] || rankStyles[2];

        return (
          <Link
            key={kol.id}
            href={`/kol/${kol.twitter_handle}`}
            className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} p-6 hover:scale-[1.02] transition-transform`}
          >
            {/* Rank Badge */}
            <div className={`absolute top-4 right-4 w-8 h-8 rounded-full ${style.badge} flex items-center justify-center font-bold text-sm`}>
              {index + 1}
            </div>

            {/* KOL Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar
                  src={kol.profile_image_url}
                  alt={kol.display_name || kol.twitter_handle}
                  size="lg"
                />
                <Trophy className={`absolute -bottom-1 -right-1 w-5 h-5 ${style.icon}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">
                    {kol.display_name || kol.twitter_handle}
                  </h3>
                  {kol.is_verified && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{kol.twitter_handle}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{formatPercent(kol.winrate)}</p>
                <p className="text-xs text-muted-foreground">Winrate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{kol.avg_multiplier.toFixed(1)}x</p>
                <p className="text-xs text-muted-foreground">Avg Multi</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{kol.best_multiplier.toFixed(0)}x</p>
                <p className="text-xs text-muted-foreground">Best</p>
              </div>
            </div>

            {/* Total Calls */}
            <div className="mt-4 pt-4 border-t border-border/50 text-center">
              <span className="text-sm text-muted-foreground">
                {kol.total_calls} calls tracked
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
